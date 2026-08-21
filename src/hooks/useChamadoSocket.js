import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import api from "../services/api";

/**
 * Deriva a URL do WebSocket a partir da baseURL já configurada em
 * services/api.js (mesma origem do backend), trocando http->ws e
 * https->wss, e removendo o "/api" do final.
 *
 * Ex: "http://localhost:8081/api" -> "ws://localhost:8081/ws"
 *     "https://jaabriu-backend.up.railway.app/api" -> "wss://jaabriu-backend.up.railway.app/ws"
 */
function montarUrlWebSocket(apiBaseURL) {
  const semSufixoApi = apiBaseURL.replace(/\/api\/?$/, "");
  const comProtocoloWs = semSufixoApi
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
  return `${comProtocoloWs}/ws`;
}

/**
 * Conecta ao tópico STOMP de um chamado e chama onMensagem sempre que uma
 * nova mensagem chegar em tempo real (sem precisar de F5).
 *
 * Retorna { conectado } pra dar feedback visual discreto se necessário.
 */
export function useChamadoSocket(chamadoId, onMensagem) {
  const [conectado, setConectado] = useState(false);
  const clientRef = useRef(null);
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;

  useEffect(() => {
    if (!chamadoId) return;

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
        client.subscribe(`/topic/chamados/${chamadoId}/comentarios`, (frame) => {
          try {
            const mensagem = JSON.parse(frame.body);
            onMensagemRef.current?.(mensagem);
          } catch (error) {
            console.log("Erro ao processar mensagem em tempo real:", error);
          }
        });
      },
      onDisconnect: () => setConectado(false),
      onWebSocketClose: () => setConectado(false),
      onStompError: (frame) => {
        console.log("Erro STOMP:", frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConectado(false);
    };
  }, [chamadoId]);

  return { conectado };
}
