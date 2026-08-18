import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarDashboard() {
    try {
      setLoading(true);
      const response = await api.get("/dashboard");
      setDashboard(response.data || null);
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
        {
          titulo: "Total de Chamados",
          valor: dashboard.totalChamados,
          cor: "bg-blue-500",
        },
        {
          titulo: "Abertos",
          valor: dashboard.chamadosAbertos,
          cor: "bg-cyan-500",
        },
        {
          titulo: "Em andamento",
          valor: dashboard.chamadosEmAndamento,
          cor: "bg-yellow-500",
        },
        {
          titulo: "Resolvidos",
          valor: dashboard.chamadosResolvidos,
          cor: "bg-green-500",
        },
        {
          titulo: "Atrasados",
          valor: dashboard.chamadosAtrasados,
          cor: "bg-red-500",
        },
        {
          titulo: "Média Avaliações",
          valor: Number(dashboard.mediaAvaliacoes || 0).toFixed(1),
          cor: "bg-purple-500",
        },
      ]
    : [];

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full">
        <Header titulo="Dashboard" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                Painel Administrativo
              </h1>
              <p className="text-gray-500 mt-1">
                Visão geral do sistema JaAbriu
              </p>
            </div>

            <button
              onClick={carregarDashboard}
              className="bg-slate-200 hover:bg-slate-300 px-5 py-3 rounded-xl"
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-lg font-medium">
                Carregando dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* CARDS */}
              <div className="grid md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className={`${card.cor} h-2`} />

                    <div className="p-6">
                      <h2 className="text-gray-500 text-sm mb-3">
                        {card.titulo}
                      </h2>

                      <p className="text-4xl font-bold text-slate-800">
                        {card.valor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* RESUMO */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Resumo do Sistema
                </h2>

                <div className="space-y-3 text-gray-600">
                  <p>
                    • Monitoramento em tempo real dos chamados.
                  </p>
                  <p>
                    • Controle de SLA e identificação de chamados
                    atrasados.
                  </p>
                  <p>
                    • Acompanhamento de satisfação através das
                    avaliações dos usuários.
                  </p>
                  <p>
                    • Gestão centralizada de atendimento técnico.
                  </p>
                </div>
              </div>

              {/* STATUS GERAL */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-3">
                    Performance
                  </h3>

                  <p className="text-gray-600">
                    Sistema operando normalmente.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-3">
                    SLA
                  </h3>

                  <p className="text-gray-600">
                    {dashboard?.chamadosAtrasados > 0
                      ? `${dashboard.chamadosAtrasados} chamado(s) atrasado(s).`
                      : "Nenhum chamado atrasado."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}