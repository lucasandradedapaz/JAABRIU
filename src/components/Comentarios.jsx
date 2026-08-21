import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, Loader, Wifi, WifiOff } from "lucide-react";
import api from "../services/api";
import { toast } from "react-toastify";
import Avatar from "./Avatar";
import { useChamadoSocket } from "../hooks/useChamadoSocket";

const PERFIL_LABEL = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  USUARIO: "Solicitante",
};

export default function Comentarios({ chamadoId, podeComentar = true }) {
  const [comentarios, setComentarios] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const fimDaListaRef = useRef(null);

  async function carregarComentarios() {
    try {
      const response = await api.get(`/chamados/${chamadoId}/comentarios`);
      // backend retorna do mais novo pro mais antigo; pra chat, queremos o
      // contrário (mais antiga em cima, mais recente embaixo)
      const ordenados = [...(response.data || [])].reverse();
      setComentarios(ordenados);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar comentários");
    } finally {
      setCarregando(false);
    }
  }

  // Tempo real: qualquer mensagem nova (de qualquer um dos envolvidos)
  // chega aqui automaticamente, sem precisar de F5.
  const { conectado } = useChamadoSocket(chamadoId, (novaMensagem) => {
    setComentarios((atual) => {
      if (atual.some((c) => c.id === novaMensagem.id)) return atual;
      return [...atual, novaMensagem];
    });
  });

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
      // a própria mensagem enviada normalmente chega de volta via WebSocket
      // (o broadcast inclui o remetente); se a conexão em tempo real caiu
      // bem nesse momento, busca a lista de novo pra não "perder" a mensagem
      if (!conectado) {
        await carregarComentarios();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao enviar comentário"
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

  useEffect(() => {
    carregarComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [comentarios.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
      <h2 className="text-base font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare size={18} className="text-[#2563EB]" />
        Atendimento
        {comentarios.length > 0 && (
          <span className="text-xs font-normal text-slate-400">
            · {comentarios.length}{" "}
            {comentarios.length === 1 ? "mensagem" : "mensagens"}
          </span>
        )}
        <span
          title={conectado ? "Tempo real conectado" : "Reconectando..."}
          className={`ml-auto flex items-center gap-1 text-[11px] font-normal ${
            conectado ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {conectado ? <Wifi size={13} /> : <WifiOff size={13} />}
          {conectado ? "Ao vivo" : "Conectando..."}
        </span>
      </h2>

      {carregando ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Loader className="animate-spin" size={16} />
          Carregando conversa...
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-slate-400 text-sm mb-6">
          Nenhuma mensagem registrada neste atendimento ainda.
        </p>
      ) : (
        <div className="space-y-4 max-h-[28rem] overflow-y-auto mb-6 pr-1">
          {comentarios.map((comentario) => {
            const ehEquipe =
              comentario.autorPerfil === "TECNICO" ||
              comentario.autorPerfil === "ADMIN";

            return (
              <div key={comentario.id} className="flex gap-3">
                <Avatar nome={comentario.autorNome} tamanho={34} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`rounded-xl rounded-tl-sm px-4 py-3 ${
                      ehEquipe
                        ? "bg-[#DBEAFE]/60 border border-[#BFDBFE]"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">
                        {comentario.autorNome || "Usuário"}
                      </span>
                      {comentario.autorPerfil && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            ehEquipe
                              ? "bg-[#2563EB] text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {PERFIL_LABEL[comentario.autorPerfil] ||
                            comentario.autorPerfil}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">
                      {comentario.mensagem}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 ml-1">
                    {formatarHora(comentario.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={fimDaListaRef} />
        </div>
      )}

      {podeComentar && (
        <form
          onSubmit={enviarComentario}
          className="flex gap-3 pt-4 border-t border-slate-100 print:hidden"
        >
          <input
            type="text"
            placeholder="Escreva uma mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
          />

          <button
            type="submit"
            disabled={enviando || !mensagem.trim()}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4fd1] disabled:opacity-50 text-white px-5 rounded-lg text-sm font-medium shadow-sm transition"
          >
            {enviando ? (
              <Loader className="animate-spin" size={15} />
            ) : (
              <Send size={15} />
            )}
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
