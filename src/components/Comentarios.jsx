import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, Loader } from "lucide-react";
import api from "../services/api";
import { toast } from "react-toastify";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const PERFIL_LABEL = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  USUARIO: "Solicitante",
};

export default function Comentarios({ chamadoId, podeComentar = true }) {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const fimDaConversaRef = useRef(null);

  async function carregarComentarios({ manterScroll = false } = {}) {
    try {
      const response = await api.get(`/chamados/${chamadoId}/comentarios`);
      setComentarios(response.data || []);
      if (!manterScroll) {
        // rolagem automática para a mensagem mais recente
        setTimeout(() => {
          fimDaConversaRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar conversa");
    } finally {
      setCarregando(false);
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;

    setEnviando(true);
    try {
      await api.post(`/chamados/${chamadoId}/comentarios`, {
        mensagem,
        interno: false,
      });

      setMensagem("");
      await carregarComentarios();
      toast.success("Mensagem enviada.");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao enviar mensagem"
      );
    } finally {
      setEnviando(false);
    }
  }

  function formatarHora(data) {
    if (!data) return "";
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarDiaSeparador(data) {
    if (!data) return "";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
  }

  useEffect(() => {
    setCarregando(true);
    carregarComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  // Agrupa por dia para exibir separadores tipo "17 de agosto" na conversa.
  let ultimoDia = null;

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 flex flex-col overflow-hidden">
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare size={18} className="text-[#2563EB]" />
          Conversa com o técnico
          {comentarios.length > 0 && (
            <span className="text-xs font-normal text-slate-400">
              · {comentarios.length}{" "}
              {comentarios.length === 1 ? "mensagem" : "mensagens"}
            </span>
          )}
        </h2>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 px-6 sm:px-8 py-8">
          <Loader className="animate-spin" size={16} />
          Carregando conversa...
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-slate-400 text-sm px-6 sm:px-8 py-8 text-center">
          Nenhuma mensagem ainda. Escreva abaixo para começar a conversa.
        </p>
      ) : (
        <div className="flex-1 flex flex-col max-h-[32rem] min-h-[16rem] overflow-y-auto px-4 sm:px-6 py-5 bg-slate-50/50">
          {comentarios.map((comentario) => {
            const souEu = user?.id != null && comentario.autorId === user.id;
            const ehEquipe =
              comentario.autorPerfil === "TECNICO" ||
              comentario.autorPerfil === "ADMIN";

            const diaAtual = formatarDiaSeparador(comentario.createdAt);
            const mostrarSeparador = diaAtual && diaAtual !== ultimoDia;
            ultimoDia = diaAtual;

            return (
              <div key={comentario.id}>
                {mostrarSeparador && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-200/70 px-3 py-1 rounded-full">
                      {diaAtual}
                    </span>
                  </div>
                )}

                <div
                  className={`flex gap-2.5 mb-4 ${
                    souEu ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="shrink-0 mt-auto">
                    <Avatar nome={comentario.autorNome} tamanho={28} />
                  </div>

                  <div
                    className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${
                      souEu ? "items-end" : "items-start"
                    }`}
                  >
                    {!souEu && (
                      <span className="text-[11px] font-medium text-slate-500 mb-0.5 ml-1">
                        {comentario.autorNome || (ehEquipe ? "Técnico" : "Solicitante")}
                        {comentario.autorPerfil && (
                          <span className="text-slate-400"> · {PERFIL_LABEL[comentario.autorPerfil] || comentario.autorPerfil}</span>
                        )}
                      </span>
                    )}

                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words shadow-sm ${
                        souEu
                          ? "bg-[#2563EB] text-white rounded-2xl rounded-tr-sm"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {comentario.mensagem}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 mx-1">
                      {formatarHora(comentario.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={fimDaConversaRef} />
        </div>
      )}

      {podeComentar && (
        <form
          onSubmit={enviarComentario}
          className="flex gap-2 sm:gap-3 p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-white print:hidden"
        >
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className="flex-1 min-w-0 border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
          />

          <button
            type="submit"
            disabled={enviando || !mensagem.trim()}
            aria-label="Enviar mensagem"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1d4fd1] disabled:opacity-50 text-white w-11 h-11 sm:w-auto sm:px-5 rounded-full text-sm font-medium shadow-sm transition"
          >
            {enviando ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      )}
    </div>
  );
}