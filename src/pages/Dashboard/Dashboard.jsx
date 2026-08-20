import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Star, Clock, ArrowRight, RefreshCw } from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const STATUS_LABEL = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

const STATUS_COR = {
  ABERTO: "#2563EB",
  EM_ANDAMENTO: "#f59e0b",
  RESOLVIDO: "#0ea5e9",
  FECHADO: "#10b981",
};

const PRIORIDADE_LABEL = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const STATUS_BADGE = {
  ABERTO: "bg-blue-100 text-blue-700",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700",
  RESOLVIDO: "bg-sky-100 text-sky-700",
  FECHADO: "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarDashboard() {
    try {
      setLoading(true);
      const [dashboardResp, chamadosResp] = await Promise.all([
        api.get("/dashboard"),
        api.get("/chamados"),
      ]);
      setDashboard(dashboardResp.data || null);
      setChamados(chamadosResp.data || []);
    } catch (error) {
      console.log("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const cards = dashboard
    ? [
        { titulo: "Total de chamados", valor: dashboard.totalChamados, cor: "bg-blue-500" },
        { titulo: "Em aberto", valor: dashboard.chamadosAbertos, cor: "bg-cyan-500" },
        { titulo: "Em andamento", valor: dashboard.chamadosEmAndamento, cor: "bg-amber-500" },
        { titulo: "Resolvidos", valor: dashboard.chamadosResolvidos, cor: "bg-emerald-500" },
      ]
    : [];

  // Distribuições calculadas a partir da lista de chamados já carregada
  // (evita criar endpoint novo no backend só para isso).
  const porStatus = Object.keys(STATUS_LABEL)
    .map((status) => ({
      status,
      nome: STATUS_LABEL[status],
      total: chamados.filter((c) => c.status === status).length,
      cor: STATUS_COR[status],
    }))
    .filter((item) => item.total > 0);

  const porPrioridade = Object.keys(PRIORIDADE_LABEL).map((prioridade) => ({
    nome: PRIORIDADE_LABEL[prioridade],
    total: chamados.filter((c) => c.prioridade === prioridade).length,
  }));

  const recentes = [...chamados]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="md:ml-64 w-full">
        <Header titulo="Dashboard" />

        <div className="p-4 pt-20 md:p-8 md:pt-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Painel de Help Desk</h1>
              <p className="text-gray-500 mt-1">Visão geral dos atendimentos do JaAbriu</p>
            </div>

            <button
              onClick={carregarDashboard}
              className="bg-white hover:bg-slate-50 ring-1 ring-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 text-center text-slate-500">
              Carregando dashboard...
            </div>
          ) : (
            <>
              {/* CARDS PRINCIPAIS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {cards.map((card, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className={`${card.cor} h-1.5`} />
                    <div className="p-4 md:p-6">
                      <h2 className="text-slate-500 text-xs md:text-sm mb-2">{card.titulo}</h2>
                      <p className="text-2xl md:text-4xl font-bold text-slate-800">{card.valor ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRÁFICOS */}
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                  <h3 className="font-semibold text-slate-700 mb-4">Chamados por status</h3>
                  {porStatus.length === 0 ? (
                    <p className="text-sm text-slate-400 py-10 text-center">Nenhum chamado registrado ainda.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={porStatus}
                          dataKey="total"
                          nameKey="nome"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {porStatus.map((item) => (
                            <Cell key={item.status} fill={item.cor} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                  <h3 className="font-semibold text-slate-700 mb-4">Chamados por prioridade</h3>
                  {chamados.length === 0 ? (
                    <p className="text-sm text-slate-400 py-10 text-center">Nenhum chamado registrado ainda.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={porPrioridade}>
                        <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* SLA + AVALIAÇÃO */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${dashboard?.chamadosAtrasados > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">SLA</p>
                    <p className="font-semibold text-slate-800">
                      {dashboard?.chamadosAtrasados > 0
                        ? `${dashboard.chamadosAtrasados} chamado(s) atrasado(s)`
                        : "Nenhum chamado atrasado"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                    <Star size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Avaliação média</p>
                    <p className="font-semibold text-slate-800">
                      {Number(dashboard?.mediaAvaliacoes || 0).toFixed(1)} de 5
                    </p>
                  </div>
                </div>
              </div>

              {/* CHAMADOS RECENTES */}
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">Chamados recentes</h3>
                  <Link to="/chamados" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                    Ver todos <ArrowRight size={14} />
                  </Link>
                </div>

                {recentes.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Nenhum chamado registrado ainda.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentes.map((chamado) => (
                      <Link
                        key={chamado.id}
                        to={`/chamados/${chamado.id}`}
                        className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            #{chamado.id} · {chamado.titulo}
                          </p>
                          <p className="text-xs text-slate-400">{formatarData(chamado.createdAt)}</p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[chamado.status] || "bg-gray-100 text-gray-700"}`}>
                          {STATUS_LABEL[chamado.status] || chamado.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}