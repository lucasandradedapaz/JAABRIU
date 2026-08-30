import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Lock,
  RotateCcw,
  Check,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotificacoesSocket } from "../hooks/useNotificacoesSocket";

const ICONE_TIPO = {
  NOVA_MENSAGEM: MessageSquare,
  CHAMADO_ATUALIZADO: RefreshCw,
  CHAMADO_RESOLVIDO: CheckCircle2,
  CHAMADO_FECHADO: Lock,
  CHAMADO_REABERTO: RotateCcw,
};

function tempoRelativo(data) {
  const diffMs = Date.now() - new Date(data).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d`;
}

export default function NotificacaoSino() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const painelRef = useRef(null);

  async function carregarNotificacoes() {
    try {
      const [resLista, resContagem] = await Promise.all([
        api.get("/notificacoes"),
        api.get("/notificacoes/nao-lidas/contagem"),
      ]);
      setNotificacoes(resLista.data || []);
      setNaoLidas(resContagem.data?.total || 0);
    } catch (error) {
      console.log("Erro ao carregar notificações:", error);
    }
  }

  useNotificacoesSocket(authenticated, (novaNotificacao) => {
    setNotificacoes((atual) => [novaNotificacao, ...atual].slice(0, 30));
    setNaoLidas((atual) => atual + 1);
  });

  useEffect(() => {
    if (authenticated) carregarNotificacoes();
  }, [authenticated]);

  useEffect(() => {
    function fechaSeClicarFora(e) {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fechaSeClicarFora);
    return () => document.removeEventListener("mousedown", fechaSeClicarFora);
  }, []);

  async function abrirNotificacao(notificacao) {
    if (!notificacao.lida) {
      try {
        await api.put(`/notificacoes/${notificacao.id}/lida`);
        setNotificacoes((atual) =>
          atual.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n))
        );
        setNaoLidas((atual) => Math.max(0, atual - 1));
      } catch (error) {
        console.log(error);
      }
    }
    setAberto(false);
    if (notificacao.chamadoId) {
      navigate(`/chamados/${notificacao.chamadoId}`);
    }
  }

  async function marcarTodasComoLidas() {
    try {
      await api.put("/notificacoes/lidas");
      setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (error) {
      console.log(error);
    }
  }

  if (!authenticated) return null;

  return (
    <div className="relative" ref={painelRef}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        title="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">Notificações</h3>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <Check size={13} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhuma notificação ainda.
              </p>
            ) : (
              notificacoes.map((n) => {
                const Icone = ICONE_TIPO[n.tipo] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => abrirNotificacao(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition ${
                      !n.lida ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        !n.lida ? "bg-blue-100 text-[#2563EB]" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icone size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.lida ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {n.mensagem}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {tempoRelativo(n.createdAt)}
                      </p>
                    </div>
                    {!n.lida && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
