import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, BarChart3 } from "lucide-react";
import logo from "../assets/jaabriu-branco.png";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import NotificacaoSino from "./NotificacaoSino";

const PERFIL_LABEL = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  USUARIO: "Usuário",
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  function active(path) {
    return location.pathname.startsWith(path)
      ? "bg-blue-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 fixed left-0 top-0 flex flex-col print:hidden">
      <div className="mb-6 flex justify-center mt-4">
        <img
          src={logo}
          alt="JaAbriu"
          className="w-28 h-28 rounded-full object-cover"
        />
      </div>

      {user && (
        <div className="mx-4 mb-4 flex items-center gap-3 bg-slate-800/60 rounded-xl p-3">
          <Avatar nome={user.nome} tamanho={36} />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">
              {user.nome}
            </p>
            <p className="text-slate-400 text-xs">
              {PERFIL_LABEL[user.perfil] || user.perfil}
            </p>
          </div>
          <NotificacaoSino />
        </div>
      )}

      <nav className="flex flex-col gap-2 p-4 pt-0 flex-1">
        <Link
          to="/dashboard"
          className={`px-4 py-3 rounded-xl transition ${active("/dashboard")}`}
        >
          Dashboard
        </Link>

        <Link
          to="/chamados"
          className={`px-4 py-3 rounded-xl transition ${active("/chamados")}`}
        >
          Chamados
        </Link>

        <Link
          to="/novo-chamado"
          className={`px-4 py-3 rounded-xl transition ${active(
            "/novo-chamado"
          )}`}
        >
          Novo Chamado
        </Link>

        <Link
          to="/historico"
          className={`px-4 py-3 rounded-xl transition ${active("/historico")}`}
        >
          Histórico
        </Link>

        {user?.perfil === "ADMIN" && (
          <>
            <Link
              to="/relatorios"
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 ${active(
                "/relatorios"
              )}`}
            >
              <BarChart3 size={18} />
              Relatórios
            </Link>

            <Link
              to="/usuarios"
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 ${active(
                "/usuarios"
              )}`}
            >
              <Users size={18} />
              Usuários
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 transition rounded-xl py-3 font-medium text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
