import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Save, Loader, Clock, Info } from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const AZUL_PRINCIPAL = "#2563EB";

const PRIORIDADE_INFO = {
  URGENTE: { label: "Urgente (P1 — Crítico)", cor: "border-red-300 bg-red-50" },
  ALTA: { label: "Alta (P2 — Alto)", cor: "border-orange-300 bg-orange-50" },
  MEDIA: { label: "Média (P3 — Médio)", cor: "border-amber-300 bg-amber-50" },
  BAIXA: { label: "Baixa (P4 — Baixo)", cor: "border-emerald-300 bg-emerald-50" },
};

const ORDEM = ["URGENTE", "ALTA", "MEDIA", "BAIXA"];

function minutosParaTexto(minutos) {
  if (minutos % 1440 === 0) return `${minutos / 1440} dia(s)`;
  if (minutos % 60 === 0) return `${minutos / 60} hora(s)`;
  return `${minutos} min`;
}

export default function SlaConfiguracao() {
  const [configuracoes, setConfiguracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoPrioridade, setSalvandoPrioridade] = useState(null);

  async function carregar() {
    setLoading(true);
    try {
      const response = await api.get("/sla");
      const ordenado = [...(response.data || [])].sort(
        (a, b) => ORDEM.indexOf(a.prioridade) - ORDEM.indexOf(b.prioridade)
      );
      setConfiguracoes(ordenado);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar configurações de SLA");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarCampo(prioridade, campo, valor) {
    setConfiguracoes((atual) =>
      atual.map((c) =>
        c.prioridade === prioridade ? { ...c, [campo]: Number(valor) } : c
      )
    );
  }

  async function salvar(config) {
    if (!config.tempoRespostaMinutos || !config.tempoResolucaoMinutos) {
      toast.warn("Preencha os dois tempos com valores maiores que zero.");
      return;
    }

    setSalvandoPrioridade(config.prioridade);
    try {
      await api.put(`/sla/${config.prioridade}`, {
        tempoRespostaMinutos: config.tempoRespostaMinutos,
        tempoResolucaoMinutos: config.tempoResolucaoMinutos,
      });
      toast.success(`Prazos de ${PRIORIDADE_INFO[config.prioridade].label} atualizados!`);
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.mensagem || "Erro ao salvar");
    } finally {
      setSalvandoPrioridade(null);
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full">
        <Header
          titulo="Configuração de SLA"
          subtitulo="Defina os prazos de resposta e resolução para cada prioridade de chamado."
        />

        <div className="p-6 sm:p-8 max-w-4xl">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-blue-800">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p>
              Esses prazos são aplicados a todo chamado novo criado a partir de agora,
              de acordo com a prioridade dele. Chamados já abertos mantêm o prazo que
              tinham no momento em que foram criados.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 flex items-center gap-3 text-slate-500">
              <Loader className="animate-spin" size={20} />
              Carregando...
            </div>
          ) : (
            <div className="space-y-4">
              {configuracoes.map((config) => {
                const info = PRIORIDADE_INFO[config.prioridade] || {
                  label: config.prioridade,
                  cor: "border-slate-200 bg-slate-50",
                };

                return (
                  <div
                    key={config.prioridade}
                    className={`bg-white rounded-xl shadow-sm ring-1 ring-slate-200 border-l-4 p-6 ${info.cor}`}
                  >
                    <h3 className="font-bold text-slate-800 mb-4">{info.label}</h3>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                          <Clock size={13} />
                          Tempo de resposta (minutos)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={config.tempoRespostaMinutos}
                          onChange={(e) =>
                            atualizarCampo(config.prioridade, "tempoRespostaMinutos", e.target.value)
                          }
                          className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          ≈ {minutosParaTexto(config.tempoRespostaMinutos)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                          <Clock size={13} />
                          Tempo de resolução (minutos)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={config.tempoResolucaoMinutos}
                          onChange={(e) =>
                            atualizarCampo(config.prioridade, "tempoResolucaoMinutos", e.target.value)
                          }
                          className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          ≈ {minutosParaTexto(config.tempoResolucaoMinutos)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => salvar(config)}
                      disabled={salvandoPrioridade === config.prioridade}
                      className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-60 transition"
                      style={{ backgroundColor: AZUL_PRINCIPAL }}
                    >
                      {salvandoPrioridade === config.prioridade ? (
                        <Loader className="animate-spin" size={15} />
                      ) : (
                        <Save size={15} />
                      )}
                      Salvar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
