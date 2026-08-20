import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Star,
  Clock,
  CheckCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  RotateCcw,
  Pencil,
  Trash2,
  X,
  Save,
  Loader,
  UserRound,
  Wrench,
  Printer,
  Calendar,
  Tag,
  FileText,
  Building2,
} from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Comentarios from "../../components/Comentarios";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";

/* ---------------------------------------------------------
   Identidade visual (paleta azul corporativa)
--------------------------------------------------------- */
const AZUL_ESCURO = "#05204B";
const AZUL_PRINCIPAL = "#2563EB";

const STATUS_CONFIG = {
  ABERTO: {
    label: "Aberto",
    badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    icon: Circle,
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    icon: Loader2,
  },
  RESOLVIDO: {
    label: "Resolvido",
    badge: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    icon: CheckCircle2,
  },
  FECHADO: {
    label: "Fechado",
    badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    icon: Lock,
  },
};

const PRIORIDADE_CONFIG = {
  BAIXA: { label: "Baixa", badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  MEDIA: { label: "Média", badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200" },
  ALTA: { label: "Alta", badge: "bg-orange-100 text-orange-700 ring-1 ring-orange-200" },
  URGENTE: { label: "Urgente", badge: "bg-red-100 text-red-700 ring-1 ring-red-200" },
};

function statusConfig(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status || "—",
      badge: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
      icon: Circle,
    }
  );
}

const ETAPAS = ["ABERTO", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"];
const ETAPA_LABEL = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em atendimento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

/* Barra de progresso horizontal simples: mostra em qual etapa o
   chamado está agora, sem exigir conhecimento técnico do usuário. */
function BarraDeProgresso({ status }) {
  const indiceAtual = ETAPAS.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {ETAPAS.map((etapa, index) => {
        const concluida = indiceAtual >= 0 && index < indiceAtual;
        const atual = index === indiceAtual;
        const pendente = !concluida && !atual;

        return (
          <div key={etapa} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-4 transition ${
                  concluida
                    ? "bg-[#2563EB] ring-blue-100"
                    : atual
                    ? "bg-[#2563EB] ring-blue-100 animate-pulse"
                    : "bg-slate-200 ring-slate-50"
                }`}
              />
              <span
                className={`text-[11px] font-medium text-center whitespace-nowrap ${
                  pendente ? "text-slate-400" : "text-slate-700"
                }`}
              >
                {ETAPA_LABEL[etapa]}
              </span>
            </div>

            {index < ETAPAS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 -mt-5 ${
                  concluida ? "bg-[#2563EB]" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function prioridadeConfig(prioridade) {
  return (
    PRIORIDADE_CONFIG[prioridade] || {
      label: prioridade || "—",
      badge: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    }
  );
}

const SETOR_LABEL = {
  GEAS: "GEAS",
  OBRAS: "Obras",
  SERVICOS_PUBLICOS: "Serviços Públicos",
};

function setorLabel(setor) {
  return SETOR_LABEL[setor] || setor;
}

/* ---------------------------------------------------------
   Acha, no histórico (mais recente primeiro), o evento que
   corresponde a uma ação específica — ex: quem fechou.
--------------------------------------------------------- */
function encontrarEvento(historico, palavrasChave) {
  return (
    historico.find((item) =>
      palavrasChave.some((palavra) =>
        (item.descricao || "").toLowerCase().includes(palavra)
      )
    ) || null
  );
}

export default function DetalhesChamado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { podeGerenciarChamados, user } = useAuth();
  const podeGerenciar = podeGerenciarChamados();
  // Todo mundo que participa do atendimento pode conversar:
  // solicitante, técnico e admin. Antes o técnico ficava de fora por engano.
  const podeInteragir = !!user;
  // Avaliação é só do solicitante (ou admin, em nome dele) — técnico não avalia o próprio atendimento.
  const podeAvaliar = user?.perfil === "USUARIO" || user?.perfil === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState(null);
  const [historico, setHistorico] = useState([]);

  const [descricaoSolucao, setDescricaoSolucao] = useState("");
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoAtribuidoId, setTecnicoAtribuidoId] = useState("");

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentarioAvaliacao] = useState("");
  const [avaliacaoExiste, setAvaliacaoExiste] = useState(false);
  const [avaliadorNome, setAvaliadorNome] = useState("");

  const [salvandoAcao, setSalvandoAcao] = useState(false);
  // controla se a caixa de "colocar solução" está aberta — o técnico pode
  // fechar ela sem salvar caso tenha clicado sem querer.
  const [mostrarCaixaSolucao, setMostrarCaixaSolucao] = useState(false);

  // edição do chamado
  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function carregarChamado() {
    try {
      const response = await api.get("/chamados");
      const chamadoEncontrado = response.data.find(
        (item) => item.id === Number(id)
      );
      setChamado(chamadoEncontrado || null);

      if (chamadoEncontrado?.descricaoSolucao) {
        setDescricaoSolucao(chamadoEncontrado.descricaoSolucao);
      }
      if (chamadoEncontrado) {
        setEditTitulo(chamadoEncontrado.titulo || "");
        setEditDescricao(chamadoEncontrado.descricao || "");
      }
    } catch (error) {
      console.log("Erro ao carregar chamado:", error);
      toast.error("Erro ao carregar chamado");
    }
  }

  async function carregarHistorico() {
    try {
      const response = await api.get(`/historicos/chamado/${id}`);
      setHistorico(response.data || []);
    } catch (error) {
      console.log("Sem histórico:", error);
      setHistorico([]);
    }
  }

  async function carregarAvaliacao() {
    try {
      const response = await api.get(`/chamados/${id}/avaliacao`);
      if (response.data) {
        setNota(response.data.nota || 0);
        setAvaliadorNome(response.data.usuarioNome || "");
        setAvaliacaoExiste(true);
      }
    } catch {
      setAvaliacaoExiste(false);
    }
  }

  async function carregarTecnicos() {
    try {
      const response = await api.get("/usuarios/tecnicos");
      setTecnicos(response.data || []);
    } catch (error) {
      console.log("Erro ao carregar técnicos:", error);
      setTecnicos([]);
    }
  }

  async function carregarDados() {
    setLoading(true);
    await carregarChamado();
    await carregarHistorico();
    await carregarAvaliacao();
    setLoading(false);
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Carrega a lista de técnicos sempre que o chamado ainda pode ser fechado
  // (o técnico escolhe quem auxiliou antes de encerrar o atendimento).
  useEffect(() => {
    const aindaAberto =
      chamado?.status === "ABERTO" ||
      chamado?.status === "EM_ANDAMENTO" ||
      chamado?.status === "RESOLVIDO";
    if (aindaAberto && podeGerenciar) {
      carregarTecnicos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado?.status, podeGerenciar]);

  async function fecharChamado() {
    if (!descricaoSolucao.trim()) {
      toast.warn("Descreva a solução antes de fechar.");
      return;
    }
    if (!tecnicoAtribuidoId) {
      toast.warn("Informe o técnico que auxiliou no atendimento antes de finalizar o chamado.");
      return;
    }
    setSalvandoAcao(true);
    try {
      await api.put(`/chamados/${id}/fechar`, {
        descricaoSolucao,
        tecnicoAtribuidoId: Number(tecnicoAtribuidoId),
      });
      toast.success("Chamado finalizado.");
      setMostrarCaixaSolucao(false);
      await carregarDados();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.mensagem || "Erro ao fechar chamado");
    } finally {
      setSalvandoAcao(false);
    }
  }

  async function reabrirChamado() {
    setSalvandoAcao(true);
    try {
      await api.put(`/chamados/${id}/status?status=ABERTO`);
      toast.success("Chamado reaberto!");
      await carregarDados();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.mensagem || "Erro ao reabrir chamado");
    } finally {
      setSalvandoAcao(false);
    }
  }

  async function salvarEdicao() {
    if (!editTitulo.trim() || !editDescricao.trim()) {
      toast.warn("Preencha título e descrição.");
      return;
    }
    setSalvandoEdicao(true);
    try {
      await api.put(`/chamados/${id}`, {
        titulo: editTitulo,
        descricao: editDescricao,
      });
      toast.success("Chamado atualizado!");
      setEditando(false);
      await carregarDados();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao salvar alterações"
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirChamado() {
    setExcluindo(true);
    try {
      await api.delete(`/chamados/${id}`);
      toast.success("Chamado excluído.");
      navigate("/chamados");
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.mensagem || "Erro ao excluir chamado");
      setExcluindo(false);
    }
  }

  async function enviarAvaliacao() {
    if (!nota) {
      toast.warn("Selecione uma nota.");
      return;
    }
    try {
      await api.post(`/chamados/${id}/avaliacao`, {
        nota,
        comentario: comentarioAvaliacao,
      });
      toast.success("Avaliação enviada com sucesso!");
      await carregarAvaliacao();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao enviar avaliação"
      );
    }
  }

  function handleImprimir() {
    window.print();
  }

  function formatarData(data, comHora = true) {
    if (!data) return "—";
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  }

  // histórico já vem do backend ordenado do mais recente para o mais antigo
  const eventoFechamento = useMemo(
    () => encontrarEvento(historico, ["fechado"]),
    [historico]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="md:ml-64 w-full p-4 pt-20 md:p-8 md:pt-8">
          <div className="bg-white p-8 rounded-xl shadow-sm ring-1 ring-slate-200 flex items-center gap-3 text-slate-500">
            <Loader className="animate-spin" size={20} />
            Carregando detalhes do chamado...
          </div>
        </main>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="md:ml-64 w-full p-4 pt-20 md:p-8 md:pt-8">
          <div className="bg-white p-8 rounded-xl shadow-sm ring-1 ring-slate-200 text-slate-500">
            Chamado não encontrado.
          </div>
        </main>
      </div>
    );
  }

  const status = statusConfig(chamado.status);
  const prioridade = prioridadeConfig(chamado.prioridade);
  const StatusIcon = status.icon;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="md:ml-64 w-full print:ml-0">
        <div className="print:hidden">
          <Header titulo={`Chamado #${chamado.id}`} />
        </div>

        <div className="p-6 sm:p-8 print:p-0 max-w-6xl">
          {/* ===================== IMPRESSÃO — Ordem de Serviço ===================== */}
          <div className="hidden print:block">
            <div className="flex items-center justify-between border-b-2 pb-4 mb-6" style={{ borderColor: AZUL_ESCURO }}>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: AZUL_ESCURO }}>JaAbriu</h1>
                <p className="text-sm text-slate-500">Ordem de Serviço</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold">Chamado #{chamado.id}</p>
                <p>Gerado em {formatarData(new Date().toISOString())}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-4">{chamado.titulo}</h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm border border-slate-300 rounded-lg p-4 mb-6">
              <p><span className="text-slate-500">Solicitante: </span><span className="font-medium">{chamado.usuarioNome || "—"}</span></p>
              <p><span className="text-slate-500">Setor: </span><span className="font-medium">{setorLabel(chamado.setor) || "—"}</span></p>
              <p><span className="text-slate-500">Categoria: </span><span className="font-medium">{chamado.categoria || "—"}</span></p>
              <p><span className="text-slate-500">Prioridade: </span><span className="font-medium">{prioridade.label}</span></p>
              <p><span className="text-slate-500">Responsável: </span><span className="font-medium">{chamado.tecnicoNome || chamado.tecnicoAtribuidoNome || "—"}</span></p>
              <p><span className="text-slate-500">Status: </span><span className="font-medium">{status.label}</span></p>
              <p><span className="text-slate-500">Aberto em: </span><span className="font-medium">{formatarData(chamado.createdAt)}</span></p>
              {chamado.dataFechamento && (
                <p><span className="text-slate-500">Fechado em: </span><span className="font-medium">{formatarData(chamado.dataFechamento)}</span></p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Descrição do problema</h3>
              <p className="text-sm whitespace-pre-line leading-relaxed border border-slate-200 rounded-lg p-4">
                {chamado.descricao}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Solução aplicada</h3>
              <p className="text-sm whitespace-pre-line leading-relaxed border border-slate-200 rounded-lg p-4">
                {chamado.descricaoSolucao || "Ainda não há solução registrada para este chamado."}
              </p>
            </div>
          </div>

          {/* ===================== TELA — conteúdo interativo ===================== */}
          <div className="print:hidden">
          {/* TOOLBAR */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-slate-400 mb-1">
                CHAMADO #{chamado.id}
              </p>
              <h1 className="text-2xl font-bold text-slate-800 break-words">
                {chamado.titulo}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                  <StatusIcon size={13} className={chamado.status === "EM_ANDAMENTO" ? "animate-spin" : ""} />
                  {status.label}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${prioridade.badge}`}>
                  Prioridade {prioridade.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden shrink-0">
              <button
                onClick={handleImprimir}
                title="Imprimir chamado"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 ring-1 ring-slate-200 bg-white hover:bg-slate-50 transition"
              >
                <Printer size={16} />
                Imprimir
              </button>

              {podeGerenciar && (
                <>
                  <button
                    onClick={() => setEditando(true)}
                    title="Editar chamado"
                    className="p-2.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 ring-1 ring-slate-200 bg-white transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmandoExclusao(true)}
                    title="Excluir chamado"
                    className="p-2.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ring-1 ring-slate-200 bg-white transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* BARRA DE PROGRESSO */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 mb-6 print:hidden">
            <BarraDeProgresso status={chamado.status} />
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid lg:grid-cols-3 gap-6 print:block">
            {/* COLUNA PRINCIPAL */}
            <div className="lg:col-span-2 space-y-6">
              {/* DESCRIÇÃO */}
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8 print:shadow-none print:ring-0 print:p-0 print:mb-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText size={15} />
                  Descrição do problema
                </h2>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 whitespace-pre-line text-slate-700 leading-relaxed text-sm print:bg-transparent print:border-0 print:p-0">
                  {chamado.descricao}
                </div>
              </div>

              {/* AÇÕES DE FLUXO — apenas técnico/admin */}
              {podeGerenciar &&
                (chamado.status === "ABERTO" ||
                  chamado.status === "EM_ANDAMENTO" ||
                  chamado.status === "RESOLVIDO") && (
                  <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8 print:hidden">
                    {!mostrarCaixaSolucao ? (
                      <>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                          Ações do atendimento
                        </h2>
                        <button
                          onClick={() => setMostrarCaixaSolucao(true)}
                          className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition"
                          style={{ backgroundColor: AZUL_PRINCIPAL }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4fd1")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = AZUL_PRINCIPAL)}
                        >
                          <CheckCircle2 size={18} />
                          Colocar solução
                        </button>
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Solução do chamado
                          </h2>
                          <button
                            onClick={() => setMostrarCaixaSolucao(false)}
                            title="Fechar sem salvar"
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-3">
                          Descreva a solução aplicada. Selecione o técnico que auxiliou na coluna ao lado antes de finalizar.
                        </p>
                        <textarea
                          rows={5}
                          value={descricaoSolucao}
                          onChange={(e) => setDescricaoSolucao(e.target.value)}
                          placeholder="Descreva a solução aplicada..."
                          autoFocus
                          className="w-full border-2 border-slate-200 rounded-lg p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition resize-none"
                        />

                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={fecharChamado}
                            disabled={salvandoAcao}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition"
                          >
                            {salvandoAcao ? <Loader className="animate-spin" size={18} /> : <Lock size={18} />}
                            Fechar chamado
                          </button>
                          <button
                            onClick={() => setMostrarCaixaSolucao(false)}
                            className="px-5 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* SOLUÇÃO */}
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden print:shadow-none print:ring-0 print:p-0 print:mb-4">
                <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle size={15} className={chamado.descricaoSolucao ? "text-emerald-600" : "text-slate-400"} />
                    Solução realizada
                  </h2>

                  {chamado.descricaoSolucao && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200 print:hidden">
                      <CheckCircle2 size={12} />
                      Resolvido
                    </span>
                  )}
                </div>

                {chamado.descricaoSolucao ? (
                  <>
                    <div className="mx-6 sm:mx-8 mt-4 mb-6 border-l-4 border-emerald-400 bg-emerald-50/40 rounded-r-lg py-3 pl-4 pr-4 print:bg-transparent print:border-0 print:p-0 print:m-0">
                      <p className="whitespace-pre-line text-slate-700 leading-relaxed text-sm">
                        {chamado.descricaoSolucao}
                      </p>
                    </div>

                    {eventoFechamento && (
                      <div className="flex items-center gap-3 px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
                        <Avatar nome={eventoFechamento.usuarioNome} tamanho={30} />
                        <div className="text-sm">
                          <p className="text-slate-700">
                            Fechado por <span className="font-semibold">{eventoFechamento.usuarioNome || "Sistema"}</span>
                          </p>
                          <p className="text-slate-400 text-xs">{formatarData(eventoFechamento.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic px-6 sm:px-8 pb-6 sm:pb-8">
                    A solução ainda não foi registrada para este chamado.
                  </p>
                )}
              </div>

              {/* COMENTÁRIOS / ATENDIMENTO */}
              <Comentarios chamadoId={id} podeComentar={podeInteragir} />
            </div>

            {/* COLUNA LATERAL */}
            <div className="space-y-6 print:mt-4">
              {/* INFORMAÇÕES DO CHAMADO */}
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 print:shadow-none print:ring-1 print:ring-slate-300">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Informações do chamado
                </h2>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <UserRound size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs">Solicitante</dt>
                      <dd className="font-medium text-slate-700">{chamado.usuarioNome || "—"}</dd>
                    </div>
                  </div>

                  {chamado.setor && (
                    <div className="flex items-start gap-2.5">
                      <Building2 size={15} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 text-xs">Setor</dt>
                        <dd className="font-medium text-slate-700">{setorLabel(chamado.setor)}</dd>
                      </div>
                    </div>
                  )}

                  {chamado.tecnicoNome && (
                    <div className="flex items-start gap-2.5">
                      <Wrench size={15} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 text-xs">Técnico responsável</dt>
                        <dd className="font-medium text-slate-700">{chamado.tecnicoNome}</dd>
                      </div>
                    </div>
                  )}

                  {chamado.tecnicoAtribuidoNome && (
                    <div className="flex items-start gap-2.5">
                      <Wrench size={15} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 text-xs">Técnico que auxiliou</dt>
                        <dd className="font-medium text-slate-700">{chamado.tecnicoAtribuidoNome}</dd>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Tag size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs">Categoria</dt>
                      <dd className="font-medium text-slate-700">{chamado.categoria || "—"}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs">Aberto em</dt>
                      <dd className="font-medium text-slate-700">{formatarData(chamado.createdAt)}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs">Última atualização</dt>
                      <dd className="font-medium text-slate-700">{formatarData(chamado.updatedAt)}</dd>
                    </div>
                  </div>

                  {chamado.dataFechamento && (
                    <div className="flex items-start gap-2.5">
                      <Lock size={15} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 text-xs">Fechado em</dt>
                        <dd className="font-medium text-slate-700">{formatarData(chamado.dataFechamento)}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              {/* AVALIAÇÃO — apenas usuário comum/admin avaliam; técnico só visualiza */}
              {chamado.status === "FECHADO" && (podeAvaliar || avaliacaoExiste) && (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 print:shadow-none print:ring-1 print:ring-slate-300">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {avaliacaoExiste ? "Avaliação do atendimento" : "Seu chamado foi resolvido! 🎉"}
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    {avaliacaoExiste ? "Nota dada a este atendimento." : "Como foi o atendimento?"}
                  </p>

                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <button
                        key={estrela}
                        type="button"
                        disabled={avaliacaoExiste || !podeAvaliar}
                        onClick={() => setNota(estrela)}
                        onMouseEnter={() => podeAvaliar && setHoverNota(estrela)}
                        onMouseLeave={() => setHoverNota(0)}
                        className="disabled:cursor-default print:hidden"
                      >
                        <Star
                          size={26}
                          className={`transition ${
                            estrela <= (hoverNota || nota) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {!avaliacaoExiste && podeAvaliar ? (
                    <button
                      onClick={enviarAvaliacao}
                      className="w-full inline-flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
                      style={{ backgroundColor: AZUL_PRINCIPAL }}
                    >
                      Enviar avaliação
                    </button>
                  ) : avaliacaoExiste ? (
                    <div className="space-y-2">
                      <p className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={15} />
                        Avaliação registrada
                      </p>
                      {avaliadorNome && (
                        <div className="flex items-center gap-2">
                          <Avatar nome={avaliadorNome} tamanho={24} />
                          <span className="text-xs text-slate-500">
                            por <span className="font-medium text-slate-700">{avaliadorNome}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* ENCERRAMENTO — técnico que auxiliou + reabrir chamado */}
              {podeGerenciar &&
                (chamado.status === "ABERTO" ||
                  chamado.status === "EM_ANDAMENTO" ||
                  chamado.status === "RESOLVIDO" ||
                  chamado.status === "FECHADO") && (
                  <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 print:hidden">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                      Encerramento
                    </h2>

                    {chamado.status !== "FECHADO" ? (
                      <>
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                          Técnico que auxiliou
                        </label>
                        <select
                          value={tecnicoAtribuidoId}
                          onChange={(e) => setTecnicoAtribuidoId(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                        >
                          <option value="">Selecione o técnico...</option>
                          {tecnicos.map((tecnico) => (
                            <option key={tecnico.id} value={tecnico.id}>
                              {tecnico.nome}
                            </option>
                          ))}
                        </select>
                        {tecnicos.length === 0 && (
                          <p className="text-xs text-slate-400 mt-1.5">
                            Nenhum técnico disponível para atribuir.
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          Necessário para fechar o chamado com uma solução.
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={reabrirChamado}
                        disabled={salvandoAcao}
                        className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium ring-1 ring-slate-200 transition"
                      >
                        {salvandoAcao ? <Loader className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                        Reabrir chamado
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
          </div>
        </div>
      </main>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Editar chamado</h3>
              <button
                onClick={() => setEditando(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Título</label>
            <input
              type="text"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 mb-4 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
            />

            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Descrição</label>
            <textarea
              rows={5}
              value={editDescricao}
              onChange={(e) => setEditDescricao(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 mb-6 outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition resize-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditando(false)}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white disabled:opacity-60 transition"
                style={{ backgroundColor: AZUL_PRINCIPAL }}
              >
                {salvandoEdicao ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmandoExclusao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir chamado?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Essa ação não pode ser desfeita. O chamado #{chamado.id} será removido permanentemente.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmandoExclusao(false)}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={excluirChamado}
                disabled={excluindo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition"
              >
                {excluindo ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
