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
 * Conecta na fila privada de eventos de chamado do usuário logado
 * (/user/queue/chamados) e chama onEvento sempre que um chamado for criado
 * ou atualizado — sem precisar de F5. Usado pela lista de Chamados pra
 * manter tudo sincronizado em tempo real.
 *
 * O backend já filtra o que cada um recebe: usuário comum só recebe
 * eventos dos próprios chamados; técnico/admin recebem de todos.
 */
export function useChamadosGeraisSocket(ativo, onEvento) {
  const [conectado, setConectado] = useState(false);
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;

  useEffect(() => {
    if (!ativo) return;

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
            client.subscribe("/user/queue/chamados", (frame) => {
              try {
                const evento = JSON.parse(frame.body);
                onEventoRef.current?.(evento);
              } catch (error) {
                console.log("Erro ao processar evento de chamado:", error);
              }
            });
          } catch (error) {
            console.log("Erro ao assinar fila de chamados:", error);
          }
        },
        onDisconnect: () => setConectado(false),
        onWebSocketClose: () => setConectado(false),
        onStompError: (frame) => {
          console.log("Erro STOMP (chamados):", frame.headers?.message);
        },
      });

      client.activate();
    } catch (error) {
      // Se o WebSocket falhar, a lista continua funcionando via REST
      // (só sem atualização automática em tempo real).
      console.log("Erro ao iniciar conexão de chamados em tempo real:", error);
    }

    return () => {
      try {
        client?.deactivate();
      } catch (error) {
        console.log("Erro ao encerrar conexão de chamados:", error);
      }
      setConectado(false);
    };
  }, [ativo]);

  return { conectado };
}
