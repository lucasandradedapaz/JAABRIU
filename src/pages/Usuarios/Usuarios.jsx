import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  UserPlus,
  Pencil,
  Ban,
  RotateCcw,
  X,
  Save,
  Loader,
  ShieldCheck,
  Wrench,
  User as UserIcon,
  Building2,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Avatar from "../../components/Avatar";

const PERFIS = [
  { value: "USUARIO", label: "Usuário comum", icon: UserIcon },
  { value: "TECNICO", label: "Técnico de TI", icon: Wrench },
  { value: "ADMIN", label: "Administrador", icon: ShieldCheck },
];

const SETORES = [
  { value: "GEAS", label: "GEAS" },
  { value: "OBRAS", label: "Obras" },
  { value: "SERVICOS_PUBLICOS", label: "Serviços Públicos" },
];

const PERFIL_BADGE = {
  ADMIN: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  TECNICO: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  USUARIO: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function perfilLabel(perfil) {
  return PERFIS.find((p) => p.value === perfil)?.label || perfil;
}

function setorLabel(setor) {
  return SETORES.find((s) => s.value === setor)?.label || setor;
}

const FORM_VAZIO = { nome: "", email: "", senha: "", perfil: "USUARIO", setor: "" };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregarUsuarios() {
    setLoading(true);
    try {
      const response = await api.get("/usuarios");
      setUsuarios(response.data || []);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(usuario) {
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
      perfil: usuario.perfil,
      setor: usuario.setor || "",
    });
    setModalAberto(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e) {
    e.preventDefault();

    if (!form.nome.trim() || !form.email.trim()) {
      toast.warn("Preencha nome e email.");
      return;
    }

    if (!editandoId && !form.senha.trim()) {
      toast.warn("Defina uma senha para o novo usuário.");
      return;
    }

    setSalvando(true);
    try {
      if (editandoId) {
        const payload = {
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
          setor: form.perfil === "USUARIO" ? form.setor : "",
        };
        if (form.senha.trim()) payload.senha = form.senha;
        await api.put(`/usuarios/${editandoId}`, payload);
        toast.success("Usuário atualizado!");
      } else {
        await api.post("/usuarios", {
          ...form,
          setor: form.perfil === "USUARIO" ? form.setor : "",
        });
        toast.success("Usuário cadastrado!");
      }

      setModalAberto(false);
      await carregarUsuarios();
    } catch (error) {
      console.log(error);
      const campos = error?.response?.data?.campos;
      if (campos) {
        const primeiraMensagem = Object.values(campos)[0];
        toast.error(primeiraMensagem || "Dados inválidos.");
      } else {
        toast.error(error?.response?.data?.mensagem || "Erro ao salvar usuário");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(usuario) {
    try {
      if (usuario.ativo) {
        await api.delete(`/usuarios/${usuario.id}`);
        toast.success(`${usuario.nome} foi desativado.`);
      } else {
        await api.put(`/usuarios/${usuario.id}/reativar`);
        toast.success(`${usuario.nome} foi reativado.`);
      }
      await carregarUsuarios();
    } catch (error) {
      console.log(error);
      toast.error("Erro ao atualizar status do usuário");
    }
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="md:ml-64 w-full">
        <Header
          titulo="Cadastro de Usuários"
          subtitulo="Gerencie quem tem acesso ao sistema e qual o nível de permissão de cada um."
        />

        <div className="p-8 space-y-6">
          <div className="flex justify-end">
            <button
              onClick={abrirNovo}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-purple-200 transition"
            >
              <UserPlus size={18} />
              Novo usuário
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center gap-3 text-slate-500">
                <Loader className="animate-spin" size={20} />
                Carregando usuários...
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-8 text-slate-400 text-sm">
                Nenhum usuário cadastrado ainda.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Usuário</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Perfil</th>
                    <th className="px-6 py-3 font-medium">Setor</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar nome={usuario.nome} tamanho={34} />
                          <span className="font-medium text-slate-700">
                            {usuario.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            PERFIL_BADGE[usuario.perfil] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {perfilLabel(usuario.perfil)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {usuario.setor ? setorLabel(usuario.setor) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.ativo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEdicao(usuario)}
                            title="Editar"
                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => alternarStatus(usuario)}
                            title={usuario.ativo ? "Desativar" : "Reativar"}
                            className={`p-2 rounded-lg transition ${
                              usuario.ativo
                                ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {usuario.ativo ? (
                              <Ban size={16} />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* MODAL CRIAR/EDITAR */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editandoId ? "Editar usuário" : "Novo usuário"}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Senha {editandoId && "(deixe em branco para manter a atual)"}
                </label>
                <input
                  type="password"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                  placeholder={editandoId ? "••••••" : "Mínimo 6 caracteres"}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                  Perfil de acesso
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PERFIS.map((p) => {
                    const Icon = p.icon;
                    const selecionado = form.perfil === p.value;
                    return (
                      <button
                        type="button"
                        key={p.value}
                        onClick={() => setForm({ ...form, perfil: p.value })}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition text-xs font-medium ${
                          selecionado
                            ? "border-purple-400 bg-purple-50 text-purple-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <Icon size={18} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.perfil === "USUARIO" && (
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block flex items-center gap-1.5">
                    <Building2 size={14} />
                    Setor
                  </label>
                  <select
                    name="setor"
                    value={form.setor}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                  >
                    <option value="">Selecione o setor</option>
                    {SETORES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white transition"
                >
                  {salvando ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
