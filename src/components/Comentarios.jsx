import { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Comentarios({ chamadoId }) {
  const [comentarios, setComentarios] = useState([]);
  const [mensagem, setMensagem] = useState("");

  async function carregarComentarios() {
    try {
      const response = await api.get(`/chamados/${chamadoId}/comentarios`);
      setComentarios(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar comentários");
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();

    if (!mensagem.trim()) return;

    try {
      await api.post(`/chamados/${chamadoId}/comentarios`, {
        mensagem,
        interno: false,
      });

      setMensagem("");
      carregarComentarios();
      toast.success("Comentário enviado");
    } catch (error) {
      toast.error("Erro ao enviar comentário");
    }
  }

  useEffect(() => {
    carregarComentarios();
  }, [chamadoId]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Comentários
      </h2>

      <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
        {comentarios.map((comentario) => (
          <div
            key={comentario.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-blue-600">
                {comentario.autorNome}
              </span>

              <span className="text-xs text-gray-400">
                {new Date(comentario.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-gray-700">{comentario.mensagem}</p>
          </div>
        ))}
      </div>

      <form onSubmit={enviarComentario} className="flex gap-2">
        <input
          type="text"
          placeholder="Digite um comentário..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}