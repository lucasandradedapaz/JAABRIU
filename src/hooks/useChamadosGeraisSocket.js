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
 * Conecta pra receber chamados criados/atualizados em tempo real, usados
 * pela lista de Chamados.
 *
 * - Técnico/admin assinam "/topic/chamados/equipe" (tópico público, único
 *   mecanismo STOMP que não depende de mapear usuário -> sessão, então é
 *   o mais confiável pra manter a lista sempre certa).
 * - Usuário comum assina só a fila privada dele ("/user/queue/chamados"),
 *   recebendo somente os PRÓPRIOS chamados.
 */
export function useChamadosGeraisSocket(ativo, podeGerenciar, onEvento) {
  const [conectado, setConectado] = useState(false);
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;

  useEffect(() => {
    if (!ativo) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[WS chamados] sem token, não conecta.");
      return;
    }

    let client;

    try {
      const apiBaseURL = api.defaults.baseURL || "http://localhost:8081/api";
      const wsUrl = montarUrlWebSocket(apiBaseURL);
      console.log("[WS chamados] conectando em", wsUrl);

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
          const destino = podeGerenciar ? "/topic/chamados/equipe" : "/user/queue/chamados";
          console.log("[WS chamados] conectado! Assinando", destino);

          try {
            client.subscribe(destino, (frame) => {
              console.log("[WS chamados] frame recebido:", frame.body);
              try {
                const evento = JSON.parse(frame.body);
                console.log("[WS chamados] evento convertido:", evento);
                onEventoRef.current?.(evento);
              } catch (error) {
                console.log("[WS chamados] erro ao converter evento:", error);
              }
            });
          } catch (error) {
            console.log("[WS chamados] erro ao assinar tópico:", error);
          }
        },
        onDisconnect: () => {
          console.log("[WS chamados] desconectado.");
          setConectado(false);
        },
        onWebSocketClose: () => {
          console.log("[WS chamados] conexão fechada.");
          setConectado(false);
        },
        onStompError: (frame) => {
          console.log("[WS chamados] erro STOMP:", frame.headers?.message);
        },
      });

      client.activate();
    } catch (error) {
      console.log("[WS chamados] erro ao iniciar conexão:", error);
    }

    return () => {
      try {
        client?.deactivate();
      } catch (error) {
        console.log("[WS chamados] erro ao encerrar conexão:", error);
      }
      setConectado(false);
    };
  }, [ativo, podeGerenciar]);

  return { conectado };
}

