import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { TicketPlus, FileText, AlertTriangle, Layers, Send } from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

const PRIORIDADE_LABEL = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export default function NovoChamado() {
  const navigate = useNavigate();
  const { podeGerenciarChamados, isUsuario } = useAuth();
  const podeDefinirPrioridade = podeGerenciarChamados();
  const ehUsuarioComum = isUsuario();

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    prioridade: "MEDIA",
    categoria: "OUTROS",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      // Usuário comum não envia prioridade: o backend aplica MÉDIA
      // automaticamente. Status inicial também é sempre definido lá (ABERTO).
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        categoria: form.categoria,
        ...(podeDefinirPrioridade ? { prioridade: form.prioridade } : {}),
      };

      await api.post("/chamados", payload);

      toast.success("Chamado criado com sucesso!");
      navigate("/chamados");
    } catch (error) {
      console.log(error);

      if (error.response?.data?.campos) {
        toast.warn("Preencha todos os campos obrigatórios.");
      } else {
        toast.error(
          error?.response?.data?.mensagem || "Erro ao criar chamado."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="md:ml-64 w-full">
        <Header titulo="Novo Chamado" />

        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm ring-1 ring-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <TicketPlus className="text-blue-600" size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {ehUsuarioComum ? "Abrir um chamado" : "Abrir Novo Chamado"}
                  </h2>
                  <p className="text-slate-500">
                    {ehUsuarioComum
                      ? "Conte pra gente o que está acontecendo. Nossa equipe vai te ajudar o quanto antes."
                      : "Informe os detalhes do problema para registrar um novo atendimento."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* TITULO */}
                <div>
                  <label className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                    <FileText size={18} />
                    {ehUsuarioComum ? "Resuma em poucas palavras" : "Título"}
                  </label>

                  <input
                    type="text"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Ex: Computador não liga"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    required
                  />
                </div>

                {/* DESCRIÇÃO */}
                <div>
                  <label className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                    <FileText size={18} />
                    {ehUsuarioComum ? "O que está acontecendo?" : "Descrição detalhada"}
                  </label>

                  <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    rows={7}
                    placeholder={
                      ehUsuarioComum
                        ? "Descreva seu problema... quando começou, o que você já tentou fazer."
                        : "Descreva detalhadamente o problema, quando começou, mensagens de erro e impacto."
                    }
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    required
                  />
                </div>

                {/* SELECTS */}
                <div
                  className={`grid gap-5 ${
                    podeDefinirPrioridade ? "md:grid-cols-2" : "md:grid-cols-1"
                  }`}
                >
                  {podeDefinirPrioridade && (
                    <div>
                      <label className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Prioridade
                      </label>

                      <select
                        name="prioridade"
                        value={form.prioridade}
                        onChange={handleChange}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                      >
                        <option value="BAIXA">Baixa</option>
                        <option value="MEDIA">Média</option>
                        <option value="ALTA">Alta</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Layers size={16} />
                      Categoria
                    </label>

                    <select
                      name="categoria"
                      value={form.categoria}
                      onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    >
                      <option value="INFRAESTRUTURA">Infraestrutura</option>
                      <option value="SOFTWARE">Software</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="REDE">Rede</option>
                      <option value="ACESSO">Acesso</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>
                </div>

                {!podeDefinirPrioridade && (
                  <p className="text-xs text-slate-400 -mt-2">
                    A prioridade deste chamado será definida por um técnico.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition text-white px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {loading ? "Criando chamado..." : "Criar Chamado"}
                </button>
              </form>
            </div>

            {/* RESUMO LATERAL */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-200 p-8 h-fit">
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                Resumo do Chamado
              </h3>

              <div className="space-y-5 text-sm">
                <div>
                  <p className="text-slate-500">Título</p>
                  <p className="font-medium text-slate-800">
                    {form.titulo || "Não informado"}
                  </p>
                </div>

                {podeDefinirPrioridade && (
                  <div>
                    <p className="text-slate-500">Prioridade</p>
                    <p className="font-medium text-slate-800">
                      {PRIORIDADE_LABEL[form.prioridade]}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-slate-500">Categoria</p>
                  <p className="font-medium text-slate-800">
                    {form.categoria}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Status inicial</p>
                  <p className="font-medium text-slate-800">Aberto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}