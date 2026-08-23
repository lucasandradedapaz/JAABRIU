import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Ticket,
  Filter,
  X,
  Loader,
  UserRound,
  Wrench,
  Building2,
} from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

const AZUL_PRINCIPAL = "#2563EB";

// Ordem de urgência: chamados que ainda precisam de atenção aparecem
// primeiro. Dentro de cada grupo, os mais recentes vêm primeiro.
const ORDEM_STATUS = { ABERTO: 0, EM_ANDAMENTO: 1, RESOLVIDO: 2, FECHADO: 3 };

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

const SETOR_OPCOES = [
  { value: "GEAS", label: "GEAS" },
  { value: "OBRAS", label: "Obras" },
  { value: "SERVICOS_PUBLICOS", label: "Serviços Públicos" },
];

const STATUS_LABEL = Object.fromEntries(STATUS_OPCOES.map((s) => [s.value, s.label]));
const SETOR_LABEL = Object.fromEntries(SETOR_OPCOES.map((s) => [s.value, s.label]));

function corStatus(status) {
  switch (status) {
    case "ABERTO":
      return "bg-blue-100 text-blue-700";
    case "EM_ANDAMENTO":
      return "bg-amber-100 text-amber-700";
    case "RESOLVIDO":
      return "bg-sky-100 text-sky-700";
    case "FECHADO":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function corPrioridade(prioridade) {
  switch (prioridade) {
    case "BAIXA":
      return "bg-slate-100 text-slate-700";
    case "MEDIA":
      return "bg-blue-100 text-blue-700";
    case "ALTA":
      return "bg-orange-100 text-orange-700";
    case "URGENTE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatarData(data) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const FILTROS_VAZIOS = {
  status: "",
  prioridade: "",
  setor: "",
  tecnicoId: "",
  usuarioId: "",
  dataInicio: "",
  dataFim: "",
};

export default function Chamados() {
  const { podeGerenciarChamados, isAdmin } = useAuth();
  const podeGerenciar = podeGerenciarChamados();
  const admin = isAdmin();

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [tecnicos, setTecnicos] = useState([]);
  const [solicitantes, setSolicitantes] = useState([]);

  async function carregarChamados() {
    setLoading(true);
    try {
      const response = await api.get("/chamados");
      setChamados(response.data || []);
    } catch (error) {
      console.log("Erro ao carregar chamados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarFiltrosAuxiliares() {
    try {
      if (podeGerenciar) {
        const resTecnicos = await api.get("/usuarios/tecnicos");
        setTecnicos(resTecnicos.data || []);
      }
      if (admin) {
        const resUsuarios = await api.get("/usuarios");
        setSolicitantes((resUsuarios.data || []).filter((u) => u.perfil === "USUARIO"));
      }
    } catch (error) {
      console.log("Erro ao carregar filtros auxiliares:", error);
    }
  }

  useEffect(() => {
    carregarChamados();
    carregarFiltrosAuxiliares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aplicarFiltros() {
    setLoading(true);
    try {
      const payload = {};
      if (filtros.status) payload.status = filtros.status;
      if (filtros.prioridade) payload.prioridade = filtros.prioridade;
      if (filtros.setor) payload.setor = filtros.setor;
      if (filtros.tecnicoId) payload.tecnicoId = Number(filtros.tecnicoId);
      if (filtros.usuarioId) payload.usuarioId = Number(filtros.usuarioId);
      if (filtros.dataInicio) payload.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) payload.dataFim = filtros.dataFim;

      const response = await api.post("/chamados/filtros", payload);
      setChamados(response.data || []);
    } catch (error) {
      console.log("Erro ao filtrar chamados:", error);
    } finally {
      setLoading(false);
    }
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    carregarChamados();
  }

  const filtrosAtivos = Object.values(filtros).some((v) => v !== "");

  // Busca por texto (client-side) + ordenação por urgência
  const chamadosExibidos = useMemo(() => {
    let lista = chamados;

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (item) =>
          (item.titulo || "").toLowerCase().includes(termo) ||
          (item.descricao || "").toLowerCase().includes(termo)
      );
    }

    return [...lista].sort((a, b) => {
      const ordemA = ORDEM_STATUS[a.status] ?? 99;
      const ordemB = ORDEM_STATUS[b.status] ?? 99;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [chamados, busca]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full">
        <Header
          titulo="Chamados"
          subtitulo={
            podeGerenciar
              ? "Gerencie e acompanhe todos os chamados do sistema."
              : "Acompanhe seus chamados abertos."
          }
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              {podeGerenciar && (
                <button
                  onClick={() => setFiltrosAbertos((v) => !v)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ring-1 transition ${
                    filtrosAtivos
                      ? "ring-[#2563EB] text-[#2563EB] bg-blue-50"
                      : "ring-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Filter size={16} />
                  Filtros
                  {filtrosAtivos && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  )}
                </button>
              )}

              <Link
                to="/novo-chamado"
                className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
                style={{ backgroundColor: AZUL_PRINCIPAL }}
              >
                <Plus size={16} />
                Novo Chamado
              </Link>
            </div>
          </div>

          {/* PAINEL DE FILTROS — só técnico/admin */}
          {podeGerenciar && filtrosAbertos && (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 mb-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Técnico responsável</label>
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

                {admin && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Usuário que abriu</label>
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
                )}

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Data de abertura (de)</label>
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Data de abertura (até)</label>
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={aplicarFiltros}
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
                  style={{ backgroundColor: AZUL_PRINCIPAL }}
                >
                  <Filter size={15} />
                  Filtrar
                </button>
                <button
                  onClick={limparFiltros}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200 transition"
                >
                  <X size={15} />
                  Limpar filtros
                </button>
              </div>
            </div>
          )}

          {/* LISTA */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 flex items-center gap-3 text-slate-500">
              <Loader className="animate-spin" size={20} />
              Carregando chamados...
            </div>
          ) : chamadosExibidos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 text-center text-slate-400">
              Nenhum chamado encontrado.
            </div>
          ) : (
            <div className="grid gap-4">
              {chamadosExibidos.map((chamado) => (
                <Link
                  key={chamado.id}
                  to={`/chamados/${chamado.id}`}
                  className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 hover:ring-blue-200 hover:shadow-md transition p-6 block"
                >
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 font-medium">#{chamado.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${corStatus(chamado.status)}`}>
                          {STATUS_LABEL[chamado.status] || chamado.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${corPrioridade(chamado.prioridade)}`}>
                          {chamado.prioridade}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-800 truncate">
                        {chamado.titulo}
                      </h2>

                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                        {chamado.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <UserRound size={13} /> {chamado.usuarioNome || "—"}
                        </span>
                        {chamado.setor && (
                          <span className="flex items-center gap-1">
                            <Building2 size={13} /> {SETOR_LABEL[chamado.setor] || chamado.setor}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Wrench size={13} /> {chamado.tecnicoNome || "Não atribuído"}
                        </span>
                        <span>{formatarData(chamado.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB]">
                        <Eye size={16} />
                        Ver detalhes
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
