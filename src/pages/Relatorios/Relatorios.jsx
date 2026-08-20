import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BarChart3,
  Printer,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Loader,
  ClipboardList,
  CircleDot,
  Loader2,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

const AZUL_PRINCIPAL = "#2563EB";
const AZUL_ESCURO = "#05204B";

const STATUS_OPCOES = [
  { value: "ABERTO", label: "Aberto" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDO", label: "Resolvido" },
  { value: "FECHADO", label: "Fechado" },
];

const PRIORIDADE_OPCOES = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const CATEGORIA_OPCOES = [
  { value: "INFRAESTRUTURA", label: "Infraestrutura" },
  { value: "SOFTWARE", label: "Software" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "REDE", label: "Rede" },
  { value: "ACESSO", label: "Acesso" },
  { value: "OUTROS", label: "Outros" },
];

const SETOR_OPCOES = [
  { value: "GEAS", label: "GEAS" },
  { value: "OBRAS", label: "Obras" },
  { value: "SERVICOS_PUBLICOS", label: "Serviços Públicos" },
];

const STATUS_LABEL = Object.fromEntries(STATUS_OPCOES.map((s) => [s.value, s.label]));
const PRIORIDADE_LABEL = Object.fromEntries(PRIORIDADE_OPCOES.map((p) => [p.value, p.label]));
const SETOR_LABEL = Object.fromEntries(SETOR_OPCOES.map((s) => [s.value, s.label]));

const CORES_GRAFICO = ["#2563EB", "#4675AF", "#0F766E", "#64748B", "#0EA5E9", "#1E293B"];

const FILTROS_VAZIOS = {
  dataInicio: "",
  dataFim: "",
  status: "",
  prioridade: "",
  categoria: "",
  setor: "",
  tecnicoId: "",
  usuarioId: "",
};

function formatarData(data, comHora = false) {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default function Relatorios() {
  const { user } = useAuth();

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(null);
  const [geradoEm, setGeradoEm] = useState(null);

  const [tecnicos, setTecnicos] = useState([]);
  const [solicitantes, setSolicitantes] = useState([]);

  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [carregouUmaVez, setCarregouUmaVez] = useState(false);

  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState({ campo: "createdAt", direcao: "desc" });
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 10;

  async function carregarFiltrosAuxiliares() {
    try {
      const [resTecnicos, resUsuarios] = await Promise.all([
        api.get("/usuarios/tecnicos"),
        api.get("/usuarios"),
      ]);
      setTecnicos(resTecnicos.data || []);
      setSolicitantes(
        (resUsuarios.data || []).filter((u) => u.perfil === "USUARIO")
      );
    } catch (error) {
      console.log("Erro ao carregar filtros auxiliares:", error);
    }
  }

  async function gerarRelatorio() {
    setCarregando(true);
    try {
      const payload = {};
      if (filtros.status) payload.status = filtros.status;
      if (filtros.prioridade) payload.prioridade = filtros.prioridade;
      if (filtros.categoria) payload.categoria = filtros.categoria;
      if (filtros.setor) payload.setor = filtros.setor;
      if (filtros.tecnicoId) payload.tecnicoId = Number(filtros.tecnicoId);
      if (filtros.usuarioId) payload.usuarioId = Number(filtros.usuarioId);
      if (filtros.dataInicio) payload.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) payload.dataFim = filtros.dataFim;

      const response = await api.post("/chamados/filtros", payload);
      setChamados(response.data || []);
      setFiltrosAplicados({ ...filtros });
      setGeradoEm(new Date().toISOString());
      setPagina(1);
      setCarregouUmaVez(true);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFiltrosAuxiliares();
    gerarRelatorio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
  }

  function handleImprimir() {
    window.print();
  }

  function alternarOrdenacao(campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: "asc" }
    );
  }

  // --- Indicadores (derivados do resultado já filtrado pela API) ---
  const indicadores = useMemo(() => {
    const total = chamados.length;
    const abertos = chamados.filter((c) => c.status === "ABERTO").length;
    const emAndamento = chamados.filter((c) => c.status === "EM_ANDAMENTO").length;
    const resolvidos = chamados.filter((c) => c.status === "RESOLVIDO").length;
    const fechados = chamados.filter((c) => c.status === "FECHADO").length;
    const atrasados = chamados.filter((c) => c.atrasado).length;
    return { total, abertos, emAndamento, resolvidos, fechados, atrasados };
  }, [chamados]);

  // --- Dados dos gráficos ---
  const dadosPorStatus = useMemo(
    () =>
      STATUS_OPCOES.map((s) => ({
        nome: s.label,
        total: chamados.filter((c) => c.status === s.value).length,
      })),
    [chamados]
  );

  const dadosPorPrioridade = useMemo(
    () =>
      PRIORIDADE_OPCOES.map((p) => ({
        nome: p.label,
        total: chamados.filter((c) => c.prioridade === p.value).length,
      })),
    [chamados]
  );

  const dadosPorSetor = useMemo(
    () =>
      SETOR_OPCOES.map((s) => ({
        nome: s.label,
        total: chamados.filter((c) => c.setor === s.value).length,
      })),
    [chamados]
  );

  const dadosPorTecnico = useMemo(() => {
    const contagem = {};
    chamados.forEach((c) => {
      const nome = c.tecnicoNome || "Sem técnico";
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [chamados]);

  // --- Tabela: busca + ordenação + paginação ---
  const linhasFiltradas = useMemo(() => {
    let lista = [...chamados];

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (c) =>
          c.titulo?.toLowerCase().includes(termo) ||
          c.usuarioNome?.toLowerCase().includes(termo) ||
          String(c.id).includes(termo)
      );
    }

    lista.sort((a, b) => {
      const campo = ordenacao.campo;
      let va = a[campo] ?? "";
      let vb = b[campo] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return ordenacao.direcao === "asc" ? -1 : 1;
      if (va > vb) return ordenacao.direcao === "asc" ? 1 : -1;
      return 0;
    });

    return lista;
  }, [chamados, busca, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / ITENS_POR_PAGINA));
  const linhasPagina = linhasFiltradas.slice(
    (pagina - 1) * ITENS_POR_PAGINA,
    pagina * ITENS_POR_PAGINA
  );

  function ColunaOrdenavel({ campo, children }) {
    const ativa = ordenacao.campo === campo;
    return (
      <th
        onClick={() => alternarOrdenacao(campo)}
        className="px-4 py-3 font-medium text-left cursor-pointer select-none hover:text-slate-700 transition whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {ativa &&
            (ordenacao.direcao === "asc" ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            ))}
        </span>
      </th>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="md:ml-64 w-full print:ml-0">
        <div className="print:hidden">
          <Header
            titulo="Relatórios"
            subtitulo="Indicadores e relatório detalhado de chamados, com filtros por período, status, setor e técnico."
          />
        </div>

        <div className="p-6 sm:p-8 print:p-0">
          {/* CABEÇALHO — SÓ NA IMPRESSÃO */}
          <div className="hidden print:block mb-6">
            <div
              className="flex items-center justify-between border-b-2 pb-4 mb-3"
              style={{ borderColor: AZUL_ESCURO }}
            >
              <div>
                <h1 className="text-2xl font-bold" style={{ color: AZUL_ESCURO }}>
                  JaAbriu
                </h1>
                <p className="text-sm text-slate-500">Relatório de Chamados</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Gerado em {formatarData(geradoEm, true)}</p>
                <p>Responsável: {user?.nome || "—"}</p>
              </div>
            </div>

            {filtrosAplicados && (
              <div className="text-xs text-slate-500 mb-4">
                <span className="font-semibold">Filtros aplicados: </span>
                {filtrosAplicados.dataInicio && `De ${formatarData(filtrosAplicados.dataInicio)} `}
                {filtrosAplicados.dataFim && `até ${formatarData(filtrosAplicados.dataFim)} `}
                {filtrosAplicados.status && `· Status: ${STATUS_LABEL[filtrosAplicados.status]} `}
                {filtrosAplicados.prioridade && `· Prioridade: ${PRIORIDADE_LABEL[filtrosAplicados.prioridade]} `}
                {filtrosAplicados.setor && `· Setor: ${SETOR_LABEL[filtrosAplicados.setor]} `}
                {!filtrosAplicados.dataInicio &&
                  !filtrosAplicados.dataFim &&
                  !filtrosAplicados.status &&
                  !filtrosAplicados.prioridade &&
                  !filtrosAplicados.setor &&
                  "Nenhum (todos os chamados)"}
              </div>
            )}
          </div>

          {/* FILTROS */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 mb-6 print:hidden">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Filter size={15} />
              Filtros
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Período inicial</label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Período final</label>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                <select
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todos</option>
                  {STATUS_OPCOES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Prioridade</label>
                <select
                  value={filtros.prioridade}
                  onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todas</option>
                  {PRIORIDADE_OPCOES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Categoria</label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todas</option>
                  {CATEGORIA_OPCOES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Setor</label>
                <select
                  value={filtros.setor}
                  onChange={(e) => setFiltros({ ...filtros, setor: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todos</option>
                  {SETOR_OPCOES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Técnico</label>
                <select
                  value={filtros.tecnicoId}
                  onChange={(e) => setFiltros({ ...filtros, tecnicoId: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todos</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Usuário</label>
                <select
                  value={filtros.usuarioId}
                  onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="">Todos</option>
                  {solicitantes.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={gerarRelatorio}
                disabled={carregando}
                className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm disabled:opacity-60 transition"
                style={{ backgroundColor: AZUL_PRINCIPAL }}
              >
                {carregando ? <Loader className="animate-spin" size={16} /> : <BarChart3 size={16} />}
                Gerar relatório
              </button>

              <button
                onClick={limparFiltros}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200 transition"
              >
                Limpar filtros
              </button>

              <button
                onClick={handleImprimir}
                disabled={!carregouUmaVez}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <Printer size={16} />
                Imprimir relatório
              </button>
            </div>
          </div>

          {/* INDICADORES */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 print:grid-cols-6">
            <CardIndicador icon={ClipboardList} label="Total" valor={indicadores.total} cor="#1E293B" />
            <CardIndicador icon={CircleDot} label="Abertos" valor={indicadores.abertos} cor="#2563EB" />
            <CardIndicador icon={Loader2} label="Em andamento" valor={indicadores.emAndamento} cor="#D97706" />
            <CardIndicador icon={CheckCircle2} label="Resolvidos" valor={indicadores.resolvidos} cor="#0EA5E9" />
            <CardIndicador icon={Lock} label="Fechados" valor={indicadores.fechados} cor="#059669" />
            <CardIndicador icon={AlertTriangle} label="Atrasados" valor={indicadores.atrasados} cor="#DC2626" />
          </div>

          {carregando && !carregouUmaVez ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 flex items-center gap-3 text-slate-500">
              <Loader className="animate-spin" size={20} />
              Gerando relatório...
            </div>
          ) : (
            <>
              {/* GRÁFICOS — ocultos na impressão pra manter o relatório enxuto */}
              <div className="grid md:grid-cols-2 gap-6 mb-6 print:hidden">
                <GraficoCard titulo="Chamados por status" dados={dadosPorStatus} />
                <GraficoCard titulo="Chamados por prioridade" dados={dadosPorPrioridade} />
                <GraficoCard titulo="Chamados por setor" dados={dadosPorSetor} />
                <GraficoCard titulo="Chamados por técnico" dados={dadosPorTecnico} />
              </div>

              {/* TABELA DETALHADA */}
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden print:shadow-none print:ring-1 print:ring-slate-300">
                <div className="p-6 flex items-center justify-between gap-4 flex-wrap print:hidden">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Chamados ({linhasFiltradas.length})
                  </h2>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por ID, título ou solicitante..."
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value);
                        setPagina(1);
                      }}
                      className="pl-9 pr-4 py-2 border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition w-72"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-400 border-y border-slate-100">
                      <tr>
                        <ColunaOrdenavel campo="id">ID</ColunaOrdenavel>
                        <ColunaOrdenavel campo="titulo">Título</ColunaOrdenavel>
                        <ColunaOrdenavel campo="usuarioNome">Solicitante</ColunaOrdenavel>
                        <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Setor</th>
                        <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Categoria</th>
                        <ColunaOrdenavel campo="prioridade">Prioridade</ColunaOrdenavel>
                        <ColunaOrdenavel campo="status">Status</ColunaOrdenavel>
                        <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Técnico</th>
                        <ColunaOrdenavel campo="createdAt">Abertura</ColunaOrdenavel>
                        <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Fechamento</th>
                        <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhasPagina.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                            Nenhum chamado encontrado com esses filtros.
                          </td>
                        </tr>
                      ) : (
                        linhasPagina.map((c) => (
                          <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 text-slate-500">#{c.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-700 max-w-[220px] truncate">{c.titulo}</td>
                            <td className="px-4 py-3 text-slate-600">{c.usuarioNome || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{c.setor ? SETOR_LABEL[c.setor] : "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{c.categoria || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{PRIORIDADE_LABEL[c.prioridade] || c.prioridade}</td>
                            <td className="px-4 py-3 text-slate-600">{STATUS_LABEL[c.status] || c.status}</td>
                            <td className="px-4 py-3 text-slate-600">{c.tecnicoNome || "—"}</td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(c.createdAt)}</td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatarData(c.dataFechamento)}</td>
                            <td className="px-4 py-3">
                              {c.atrasado ? (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                                  Atrasado
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                  No prazo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINAÇÃO */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 print:hidden">
                    <p className="text-xs text-slate-400">
                      Página {pagina} de {totalPaginas}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                        disabled={pagina === 1}
                        className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        disabled={pagina === totalPaginas}
                        className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMO — SÓ NA IMPRESSÃO */}
              <div className="hidden print:block mt-6 pt-4 border-t border-slate-300 text-xs text-slate-500">
                <p>
                  Resumo: {indicadores.total} chamado(s) no período · {indicadores.abertos} aberto(s) ·{" "}
                  {indicadores.emAndamento} em andamento · {indicadores.resolvidos} resolvido(s) ·{" "}
                  {indicadores.fechados} fechado(s) · {indicadores.atrasados} atrasado(s).
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function CardIndicador({ icon: Icon, label, valor, cor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 print:shadow-none print:ring-1 print:ring-slate-300">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: cor }} />
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}

function GraficoCard({ titulo, dados }) {
  const temDados = dados.some((d) => d.total > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">{titulo}</h3>
      {!temDados ? (
        <p className="text-sm text-slate-400 py-10 text-center">Sem dados para exibir.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dados} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 11, fill: "#64748B" }}
              interval={0}
              angle={dados.length > 4 ? -25 : 0}
              textAnchor={dados.length > 4 ? "end" : "middle"}
              height={dados.length > 4 ? 50 : 24}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
              cursor={{ fill: "#EFF6FF" }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {dados.map((_, index) => (
                <Cell key={index} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
