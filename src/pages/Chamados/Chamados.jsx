import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Ticket,
  Filter,
} from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function Chamados() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("");

  async function carregarChamados() {
    try {
      setLoading(true);
      const response = await api.get("/chamados");
      setChamados(response.data || []);
    } catch (error) {
      console.log("Erro ao carregar chamados:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarChamados();
  }, []);

  function corStatus(status) {
    switch (status) {
      case "ABERTO":
        return "bg-blue-100 text-blue-700";
      case "EM_ANDAMENTO":
        return "bg-yellow-100 text-yellow-700";
      case "RESOLVIDO":
        return "bg-purple-100 text-purple-700";
      case "FECHADO":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function corPrioridade(prioridade) {
    switch (prioridade) {
      case "BAIXA":
        return "bg-slate-100 text-slate-700";
      case "MEDIA":
        return "bg-yellow-100 text-yellow-700";
      case "ALTA":
        return "bg-orange-100 text-orange-700";
      case "URGENTE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  const chamadosFiltrados = chamados.filter((item) => {
    const titulo = item.titulo || "";
    const descricao = item.descricao || "";

    const matchBusca =
      titulo.toLowerCase().includes(busca.toLowerCase()) ||
      descricao.toLowerCase().includes(busca.toLowerCase());

    const matchStatus = !statusFiltro || item.status === statusFiltro;
    const matchPrioridade =
      !prioridadeFiltro || item.prioridade === prioridadeFiltro;

    return matchBusca && matchStatus && matchPrioridade;
  });

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 w-full p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Ticket size={28} />
              Chamados
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie e acompanhe todos os chamados do sistema
            </p>
          </div>

          <Link
            to="/novo-chamado"
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 shadow"
          >
            <Plus size={18} />
            Novo Chamado
          </Link>
        </div>

        {/* FILTROS */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} />
            <h2 className="font-semibold text-slate-700">Filtros</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar chamado..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos status</option>
              <option value="ABERTO">Aberto</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="RESOLVIDO">Resolvido</option>
              <option value="FECHADO">Fechado</option>
            </select>

            <select
              value={prioridadeFiltro}
              onChange={(e) => setPrioridadeFiltro(e.target.value)}
              className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas prioridades</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        {/* LISTA */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-slate-500">Carregando chamados...</p>
          </div>
        ) : chamadosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-slate-500">Nenhum chamado encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {chamadosFiltrados.map((chamado) => (
              <div
                key={chamado.id}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition p-6"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">
                      #{chamado.id} - {chamado.titulo}
                    </h2>

                    <p className="text-slate-600 mt-3 leading-relaxed">
                      {chamado.descricao}
                    </p>

                    <div className="mt-4 text-sm text-slate-500 space-y-1">
                      <p>
                        <strong>Usuário:</strong>{" "}
                        {chamado.usuarioNome || "Não informado"}
                      </p>

                      <p>
                        <strong>Técnico:</strong>{" "}
                        {chamado.tecnicoNome || "Não atribuído"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${corStatus(
                        chamado.status
                      )}`}
                    >
                      {chamado.status}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${corPrioridade(
                        chamado.prioridade
                      )}`}
                    >
                      {chamado.prioridade}
                    </span>

                    <Link
                      to={`/chamados/${chamado.id}`}
                      className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
                    >
                      <Eye size={18} />
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}