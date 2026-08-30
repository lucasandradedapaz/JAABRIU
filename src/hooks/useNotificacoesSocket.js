import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import api from "../services/api";

function montarUrlWebSocket(apiBaseURL) {
  const semSufixoApi = apiBaseURL.replace(/\/api\/?$/, "");
  const comProtocoloWs = semSufixoApi
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
  return `${comProtocoloWs}/ws`;
}

/**
 * Conecta na fila privada de notificações do usuário logado
 * (/user/queue/notificacoes) e chama onNotificacao sempre que uma nova
 * notificação chegar em tempo real — nova mensagem, chamado atualizado,
 * resolvido, fechado ou reaberto.
 */
export function useNotificacoesSocket(ativo, onNotificacao) {
  const [conectado, setConectado] = useState(false);
  const onNotificacaoRef = useRef(onNotificacao);
  onNotificacaoRef.current = onNotificacao;

  useEffect(() => {
    if (!ativo) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBaseURL = api.defaults.baseURL || "http://localhost:8081/api";
    const wsUrl = montarUrlWebSocket(apiBaseURL);

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConectado(true);
        client.subscribe("/user/queue/notificacoes", (frame) => {
          try {
            const notificacao = JSON.parse(frame.body);
            onNotificacaoRef.current?.(notificacao);
          } catch (error) {
            console.log("Erro ao processar notificação:", error);
          }
        });
      },
      onDisconnect: () => setConectado(false),
      onWebSocketClose: () => setConectado(false),
      onStompError: (frame) => {
        console.log("Erro STOMP (notificações):", frame.headers?.message);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
      setConectado(false);
    };
  }, [ativo]);

  return { conectado };
}
