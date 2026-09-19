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
/**
 * Conecta ao(s) tópico(s) STOMP de um chamado: mensagens do chat
 * (onMensagem) e, na mesma conexão, eventos de atualização do próprio
 * chamado — status, prioridade, técnico atribuído etc. (onEvento) —
 * pra não abrir uma segunda conexão WebSocket à toa.
 *
 * Retorna { conectado } pra dar feedback visual discreto se necessário.
 */
export function useChamadoSocket(chamadoId, onMensagem, onEvento) {
  const [conectado, setConectado] = useState(false);
  const clientRef = useRef(null);
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;

  useEffect(() => {
    if (!chamadoId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let client;

    try {
      const apiBaseURL = api.defaults.baseURL || "http://localhost:8081/api";
      const wsUrl = montarUrlWebSocket(apiBaseURL);

      client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          setConectado(true);
          try {
            client.subscribe(`/topic/chamados/${chamadoId}/comentarios`, (frame) => {
              try {
                const mensagem = JSON.parse(frame.body);
                onMensagemRef.current?.(mensagem);
              } catch (error) {
                console.log("Erro ao processar mensagem em tempo real:", error);
              }
            });
            client.subscribe(`/topic/chamados/${chamadoId}/eventos`, (frame) => {
              try {
                const evento = JSON.parse(frame.body);
                onEventoRef.current?.(evento);
              } catch (error) {
                console.log("Erro ao processar evento do chamado:", error);
              }
            });
          } catch (error) {
            console.log("Erro ao assinar tópicos do chamado:", error);
          }
        },
        onDisconnect: () => setConectado(false),
        onWebSocketClose: () => setConectado(false),
        onStompError: (frame) => {
          console.log("Erro STOMP:", frame.headers?.message);
        },
      });

      client.activate();
      clientRef.current = client;
    } catch (error) {
      // Se o WebSocket falhar, chat/detalhes continuam funcionando via
      // REST (só sem atualização automática em tempo real).
      console.log("Erro ao iniciar conexão do chamado:", error);
    }

    return () => {
      try {
        client?.deactivate();
      } catch (error) {
        console.log("Erro ao encerrar conexão do chamado:", error);
      }
      clientRef.current = null;
      setConectado(false);
    };
  }, [chamadoId]);

  return { conectado };
}
