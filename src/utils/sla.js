// Calcula o estado do SLA de um chamado num dado instante.
// Retorna um objeto com "estado": 'sem_sla' | 'concluido' | 'vencido' | 'ativo'
export function calcularSla(chamado, agoraMs) {
  if (!chamado.slaFim) return { estado: "sem_sla" };

  const fimMs = new Date(chamado.slaFim).getTime();
  const inicioMs = new Date(chamado.slaInicio || chamado.createdAt).getTime();

  const finalizado = chamado.status === "RESOLVIDO" || chamado.status === "FECHADO";

  if (finalizado) {
    const conclusaoMs = chamado.dataFechamento
      ? new Date(chamado.dataFechamento).getTime()
      : chamado.updatedAt
      ? new Date(chamado.updatedAt).getTime()
      : agoraMs;
    return {
      estado: "concluido",
      dentroDoPrazo: conclusaoMs <= fimMs,
    };
  }

  const restanteMs = fimMs - agoraMs;

  if (restanteMs <= 0) {
    return { estado: "vencido", excedidoMs: -restanteMs };
  }

  const duracaoTotalMs = fimMs - inicioMs;
  const percentualRestante = duracaoTotalMs > 0 ? restanteMs / duracaoTotalMs : 1;

  let nivel = "no_prazo";
  if (percentualRestante <= 0.15) nivel = "critico";
  else if (percentualRestante <= 0.35) nivel = "atencao";

  return { estado: "ativo", nivel, restanteMs };
}

// Chave numérica pra ordenar: quanto MENOR, mais urgente (aparece primeiro).
// Vencidos vêm antes de tudo (mais atrasado = mais urgente); depois os
// ativos por tempo restante; resolvidos/fechados sempre por último.
export function chaveUrgenciaSla(chamado, agoraMs) {
  const finalizado = chamado.status === "RESOLVIDO" || chamado.status === "FECHADO";
  if (finalizado) return Number.MAX_SAFE_INTEGER;

  // Chamado sem prioridade ainda (aguardando triagem) é o mais urgente de
  // todos — ninguém nem olhou pra ele ainda.
  if (!chamado.prioridade) return -Number.MAX_SAFE_INTEGER;

  const sla = calcularSla(chamado, agoraMs);
  if (sla.estado === "sem_sla") return Number.MAX_SAFE_INTEGER - 1;
  if (sla.estado === "vencido") return -sla.excedidoMs; // mais atrasado = mais negativo = primeiro
  return sla.restanteMs;
}

export function formatarDuracao(ms) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const pad = (n) => String(n).padStart(2, "0");

  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return `${dias}d ${pad(horasRestantes)}h`;
  }

  return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
}
