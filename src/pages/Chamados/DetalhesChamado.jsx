import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, CheckCircle } from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function DetalhesChamado() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [chamado, setChamado] = useState(null);
  const [historico, setHistorico] = useState([]);

  const [descricaoSolucao, setDescricaoSolucao] = useState("");

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");
  const [avaliacaoExiste, setAvaliacaoExiste] = useState(false);

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
    } catch (error) {
      console.log("Erro ao carregar chamado:", error);
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
        setComentarioAvaliacao(response.data.comentario || "");
        setAvaliacaoExiste(true);
      }
    } catch (error) {
      console.log("Sem avaliação ainda");
      setAvaliacaoExiste(false);
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
  }, [id]);

  async function resolverChamado() {
    try {
      await api.put(`/chamados/${id}/status?status=RESOLVIDO`);
      alert("Chamado marcado como resolvido!");
      carregarDados();
    } catch (error) {
      console.log(error);
      alert("Erro ao resolver chamado");
    }
  }

  async function fecharChamado() {
    if (!descricaoSolucao.trim()) {
      alert("Descreva a solução antes de fechar.");
      return;
    }

    try {
      await api.put(`/chamados/${id}/fechar`, {
        descricaoSolucao,
      });

      alert("Chamado fechado com sucesso!");
      carregarDados();
    } catch (error) {
      console.log(error);
      alert("Erro ao fechar chamado");
    }
  }

  async function enviarAvaliacao() {
    if (!nota) {
      alert("Selecione uma nota.");
      return;
    }

    try {
      await api.post(`/chamados/${id}/avaliacao`, {
        nota,
        comentario: comentarioAvaliacao,
      });

      alert("Avaliação enviada com sucesso!");
      carregarAvaliacao();
    } catch (error) {
      console.log(error);
      alert("Erro ao enviar avaliação");
    }
  }

  function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function corStatus(status) {
    switch (status) {
      case "ABERTO":
        return "bg-blue-100 text-blue-700";
      case "EM_ANDAMENTO":
        return "bg-yellow-100 text-yellow-700";
      case "RESOLVIDO":
        return "bg-purple-100 text-purple-700";
      case "FECHADO":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="ml-64 w-full p-8">
          <div className="bg-white p-8 rounded-2xl shadow">
            Carregando detalhes do chamado...
          </div>
        </main>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="ml-64 w-full p-8">
          <div className="bg-white p-8 rounded-2xl shadow">
            Chamado não encontrado.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full">
        <Header titulo={`Chamado #${chamado.id}`} />

        <div className="p-8 space-y-8">
          {/* CARD PRINCIPAL */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{chamado.titulo}</h2>
                <p className="text-gray-500 mt-1">
                  Ticket #{chamado.id}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full font-semibold ${corStatus(
                  chamado.status
                )}`}
              >
                {chamado.status}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">
                Descrição do problema
              </h3>

              <div className="bg-slate-50 border rounded-xl p-4 whitespace-pre-line">
                {chamado.descricao}
              </div>
            </div>

            {(chamado.status === "ABERTO" ||
              chamado.status === "EM_ANDAMENTO") && (
              <button
                onClick={resolverChamado}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl"
              >
                Marcar como resolvido
              </button>
            )}

            {chamado.status === "RESOLVIDO" && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-bold mb-4">
                  Solução aplicada pelo técnico
                </h3>

                <textarea
                  rows={5}
                  value={descricaoSolucao}
                  onChange={(e) =>
                    setDescricaoSolucao(e.target.value)
                  }
                  placeholder="Descreva a solução aplicada..."
                  className="w-full border rounded-xl p-4"
                />

                <button
                  onClick={fecharChamado}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
                >
                  Fechar chamado
                </button>
              </div>
            )}

            {chamado.descricaoSolucao && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={18} />
                  Solução registrada
                </h3>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 whitespace-pre-line">
                  {chamado.descricaoSolucao}
                </div>
              </div>
            )}
          </div>

          {/* HISTÓRICO */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock size={22} />
              Timeline do chamado
            </h2>

            {historico.length === 0 ? (
              <p className="text-gray-500">
                Nenhum histórico encontrado.
              </p>
            ) : (
              <div className="space-y-5">
                {historico.map((item) => (
                  <div key={item.id} className="border-l-4 pl-4">
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-sm text-gray-500">
                      {item.usuarioNome || "Sistema"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatarData(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AVALIAÇÃO */}
          {chamado.status === "FECHADO" && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">
                Avaliação do atendimento
              </h2>

              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <button
                    key={estrela}
                    type="button"
                    disabled={avaliacaoExiste}
                    onClick={() => setNota(estrela)}
                    onMouseEnter={() => setHoverNota(estrela)}
                    onMouseLeave={() => setHoverNota(0)}
                  >
                    <Star
                      size={38}
                      className={`${
                        estrela <= (hoverNota || nota)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                disabled={avaliacaoExiste}
                value={comentarioAvaliacao}
                onChange={(e) =>
                  setComentarioAvaliacao(e.target.value)
                }
                placeholder="Deixe seu comentário..."
                className="w-full border rounded-xl p-4 mb-4"
              />

              {!avaliacaoExiste ? (
                <button
                  onClick={enviarAvaliacao}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                >
                  Enviar avaliação
                </button>
              ) : (
                <p className="text-green-600 font-semibold">
                  Avaliação salva com sucesso ✓
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}