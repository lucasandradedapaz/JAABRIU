import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function Historico() {
  const [historicos, setHistoricos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarHistoricos() {
    try {
      setLoading(true);

      // busca chamados
      const chamadosResponse = await api.get("/chamados");
      const chamados = chamadosResponse.data || [];

      let historicosTemp = [];

      // busca histórico de cada chamado
      for (const chamado of chamados) {
        try {
          const response = await api.get(
            `/historicos/chamado/${chamado.id}`
          );

          const historicoChamado = (response.data || []).map((item) => ({
            ...item,
            chamadoTitulo: chamado.titulo,
            chamadoId: chamado.id,
          }));

          historicosTemp.push(...historicoChamado);
        } catch (error) {
          console.log(
            `Erro ao buscar histórico do chamado ${chamado.id}`,
            error
          );
        }
      }

      // ordena do mais recente
      historicosTemp.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setHistoricos(historicosTemp);
    } catch (error) {
      console.log("Erro ao carregar históricos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistoricos();
  }, []);

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 p-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Histórico Geral</h1>

        {loading ? (
          <p>Carregando histórico...</p>
        ) : historicos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500">
              Nenhum histórico encontrado.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="space-y-6">
              {historicos.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-slate-800">
                        {item.descricao}
                      </h2>

                      <p className="text-sm text-gray-600 mt-1">
                        Usuário: {item.usuarioNome || "Sistema"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Chamado #{item.chamadoId} -{" "}
                        {item.chamadoTitulo}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <Link
                      to={`/chamados/${item.chamadoId}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver chamado →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}