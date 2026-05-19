import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TicketPlus,
  FileText,
  AlertTriangle,
  Layers,
  Send,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function NovoChamado() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    status: "ABERTO",
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

      await api.post("/chamados", form);

      alert("Chamado criado com sucesso!");
      navigate("/chamados");
    } catch (error) {
      console.log(error);

      if (error.response?.data?.campos) {
        alert("Preencha todos os campos obrigatórios.");
      } else {
        alert("Erro ao criar chamado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full">
        <Header titulo="Novo Chamado" />

        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <TicketPlus className="text-blue-600" size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Abrir Novo Chamado
                  </h2>
                  <p className="text-slate-500">
                    Informe os detalhes do problema para registrar
                    um novo atendimento.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* TITULO */}
                <div>
                  <label className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                    <FileText size={18} />
                    Título
                  </label>

                  <input
                    type="text"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Ex: Computador não liga"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* DESCRIÇÃO */}
                <div>
                  <label className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                    <FileText size={18} />
                    Descrição detalhada
                  </label>

                  <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    rows={7}
                    placeholder="Descreva detalhadamente o problema, quando começou, mensagens de erro e impacto."
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* SELECTS */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <label className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Layers size={16} />
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3"
                    >
                      <option value="ABERTO">ABERTO</option>
                      <option value="EM_ANDAMENTO">
                        EM ANDAMENTO
                      </option>
                      <option value="RESOLVIDO">RESOLVIDO</option>
                      <option value="FECHADO">FECHADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Prioridade
                    </label>

                    <select
                      name="prioridade"
                      value={form.prioridade}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3"
                    >
                      <option value="BAIXA">BAIXA</option>
                      <option value="MEDIA">MÉDIA</option>
                      <option value="ALTA">ALTA</option>
                      <option value="URGENTE">URGENTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Layers size={16} />
                      Categoria
                    </label>

                    <select
                      name="categoria"
                      value={form.categoria}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3"
                    >
                      <option value="INFRAESTRUTURA">
                        INFRAESTRUTURA
                      </option>
                      <option value="SOFTWARE">SOFTWARE</option>
                      <option value="HARDWARE">HARDWARE</option>
                      <option value="REDE">REDE</option>
                      <option value="ACESSO">ACESSO</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {loading ? "Criando chamado..." : "Criar Chamado"}
                </button>
              </form>
            </div>

            {/* RESUMO LATERAL */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 h-fit">
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

                <div>
                  <p className="text-slate-500">Prioridade</p>
                  <p className="font-medium text-slate-800">
                    {form.prioridade}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Categoria</p>
                  <p className="font-medium text-slate-800">
                    {form.categoria}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Status inicial</p>
                  <p className="font-medium text-slate-800">
                    {form.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}