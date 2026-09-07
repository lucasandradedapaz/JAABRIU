import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRelogioTick } from "../hooks/useRelogioTick";
import { calcularSla, formatarDuracao } from "../utils/sla";

const ESTILO_NIVEL = {
  critico: {
    fundo: "bg-red-50 border-red-200 text-red-700",
    icone: AlertTriangle,
    pulso: true,
  },
  atencao: {
    fundo: "bg-amber-50 border-amber-200 text-amber-700",
    icone: Clock,
    pulso: false,
  },
  no_prazo: {
    fundo: "bg-emerald-50 border-emerald-200 text-emerald-700",
    icone: Clock,
    pulso: false,
  },
};

/**
 * Mostra o estado do SLA de um chamado com contador ao vivo.
 * tamanho: "compacto" (pra linhas de lista) | "grande" (destaque na tela de detalhes)
 */
export default function SlaBadge({ chamado, tamanho = "compacto" }) {
  const agora = useRelogioTick();
  const sla = calcularSla(chamado, agora);

  if (sla.estado === "sem_sla") return null;

  if (sla.estado === "concluido") {
    const classe = sla.dentroDoPrazo
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-slate-100 border-slate-200 text-slate-500";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${classe}`}
      >
        <CheckCircle2 size={13} />
        {sla.dentroDoPrazo ? "Concluído dentro do prazo" : "Concluído fora do prazo"}
      </span>
    );
  }

  if (sla.estado === "vencido") {
    if (tamanho === "grande") {
      return (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 animate-pulse">
          <p className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <AlertTriangle size={18} />
            SLA VENCIDO
          </p>
          <p className="text-red-600 text-xs mt-1">
            Prazo excedido em {formatarDuracao(sla.excedidoMs)}
          </p>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 animate-pulse">
        <AlertTriangle size={13} />
        SLA VENCIDO · +{formatarDuracao(sla.excedidoMs)}
      </span>
    );
  }

  // ativo — dentro do prazo, com contador correndo
  const estilo = ESTILO_NIVEL[sla.nivel];
  const Icone = estilo.icone;

  if (tamanho === "grande") {
    return (
      <div className={`rounded-xl border-2 px-5 py-4 ${estilo.fundo} ${estilo.pulso ? "animate-pulse" : ""}`}>
        <p className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wide">
          <Icone size={15} />
          {sla.nivel === "critico" ? "Crítico — quase vencendo" : sla.nivel === "atencao" ? "Atenção" : "Dentro do prazo"}
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums">
          {formatarDuracao(sla.restanteMs)}
        </p>
        <p className="text-xs opacity-75">restantes para resolução</p>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${estilo.fundo} ${
        estilo.pulso ? "animate-pulse" : ""
      }`}
    >
      <Icone size={13} />
      {formatarDuracao(sla.restanteMs)} restantes
    </span>
  );
}
