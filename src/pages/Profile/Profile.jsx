import { useState } from "react";
import { toast } from "react-toastify";
import { Building2, Save, Loader } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Avatar from "../../components/Avatar";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const PERFIL_LABEL = {
  ADMIN: "Administrador",
  TECNICO: "Técnico de TI",
  USUARIO: "Usuário comum",
};

const SETORES = [
  { value: "GEAS", label: "GEAS" },
  { value: "OBRAS", label: "Obras" },
  { value: "SERVICOS_PUBLICOS", label: "Serviços Públicos" },
];

function setorLabel(setor) {
  return SETORES.find((s) => s.value === setor)?.label || setor;
}

export default function Profile() {
  const { user, recarregarPerfil } = useAuth();

  const [editandoSetor, setEditandoSetor] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState(user?.setor || "");
  const [salvando, setSalvando] = useState(false);

  async function salvarSetor() {
    if (!setorSelecionado) {
      toast.warn("Selecione um setor.");
      return;
    }

    setSalvando(true);
    try {
      await api.put("/usuarios/me/setor", { setor: setorSelecionado });
      toast.success("Setor atualizado!");
      setEditandoSetor(false);
      await recarregarPerfil();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.mensagem || "Erro ao atualizar setor");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 p-8 w-full">
        <Header titulo="Meu Perfil" />

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 max-w-xl">
          <div className="flex items-center gap-4 mb-8">
            <Avatar nome={user?.nome} tamanho={56} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {user?.nome || "—"}
              </h2>
              <p className="text-slate-400 text-sm">
                {PERFIL_LABEL[user?.perfil] || user?.perfil || "—"}
              </p>
            </div>
          </div>

          <dl className="space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-800">
                {user?.email || "—"}
              </dd>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Perfil</dt>
              <dd className="font-medium text-slate-800">
                {PERFIL_LABEL[user?.perfil] || user?.perfil || "—"}
              </dd>
            </div>

            {/* Setor — só faz sentido pro usuário comum */}
            {user?.perfil === "USUARIO" && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Building2 size={15} />
                  Setor
                </dt>

                {editandoSetor ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={setorSelecionado}
                      onChange={(e) => setSetorSelecionado(e.target.value)}
                      className="border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition"
                    >
                      <option value="">Selecione</option>
                      {SETORES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={salvarSetor}
                      disabled={salvando}
                      className="inline-flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-60 transition"
                      style={{ backgroundColor: "#2563EB" }}
                    >
                      {salvando ? <Loader className="animate-spin" size={13} /> : <Save size={13} />}
                      Salvar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSetorSelecionado(user?.setor || "");
                      setEditandoSetor(true);
                    }}
                    className="font-medium text-[#2563EB] hover:underline text-sm"
                  >
                    {user?.setor ? setorLabel(user.setor) : "Definir setor"}
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd
                className={`font-medium ${
                  user?.ativo ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {user?.ativo ? "Ativo" : "Inativo"}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
