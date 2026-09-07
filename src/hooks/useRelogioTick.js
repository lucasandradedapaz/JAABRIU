import { useEffect, useState } from "react";

// Um único setInterval global, compartilhado por todos os componentes que
// usam este hook — evita ter dezenas de timers rodando ao mesmo tempo
// quando a lista de chamados tem muitos itens, cada um com seu contador.
let assinantes = new Set();
let intervaloId = null;

function garantirIntervalo() {
  if (intervaloId) return;
  intervaloId = setInterval(() => {
    const agora = Date.now();
    assinantes.forEach((cb) => cb(agora));
  }, 1000);
}

export function useRelogioTick() {
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    assinantes.add(setAgora);
    garantirIntervalo();

    return () => {
      assinantes.delete(setAgora);
      if (assinantes.size === 0 && intervaloId) {
        clearInterval(intervaloId);
        intervaloId = null;
      }
    };
  }, []);

  return agora;
}
