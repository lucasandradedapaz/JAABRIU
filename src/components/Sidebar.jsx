import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  BarChart3,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  History,
  UserRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logo from "../assets/jaabriu-branco.png";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const PERFIL_LABEL = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  USUARIO: "Usuário",
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);

  const ehUsuarioComum = user?.perfil === "USUARIO";

  function handleLogout() {
    logout();
    navigate("/");
  }

  function fechar() {
    setAberto(false);
  }

  function active(path) {
    return location.pathname.startsWith(path)
      ? "bg-blue-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";
  }

  // Navegação enxuta para o usuário comum: só o que ele realmente usa.
  const navUsuarioComum = [
    { to: "/novo-chamado", label: "Abrir chamado", icon: PlusCircle },
    { to: "/chamados", label: "Meus chamados", icon: Ticket },
    { to: "/profile", label: "Meu perfil", icon: UserRound },
  ];

  // Navegação completa para técnico/admin.
  const navEquipe = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/chamados", label: "Chamados", icon: Ticket },
    { to: "/novo-chamado", label: "Novo Chamado", icon: PlusCircle },
    { to: "/historico", label: "Histórico", icon: History },
  ];

  const itens = ehUsuarioComum ? navUsuarioComum : navEquipe;

  return (
    <>
      {/* BOTÃO HAMBÚRGUER — só aparece no mobile */}
      <button
        onClick={() => setAberto(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg print:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* OVERLAY — fecha o menu ao clicar fora, só no mobile */}
      {aberto && (
        <div
          onClick={fechar}
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
        />
      )}

      <aside
        className={`w-64 h-screen bg-slate-900 fixed left-0 top-0 flex flex-col print:hidden z-50 transition-transform duration-200
          ${aberto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <button
          onClick={fechar}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Fechar menu"
        >
          <X size={22} />
        </button>

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
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.nome}
              </p>
              <p className="text-slate-400 text-xs">
                {PERFIL_LABEL[user.perfil] || user.perfil}
              </p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2 p-4 pt-0 flex-1 overflow-y-auto">
          {itens.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={fechar}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2.5 ${active(
                item.to
              )}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          {user?.perfil === "ADMIN" && (
            <>
              <Link
                to="/relatorios"
                onClick={fechar}
                className={`px-4 py-3 rounded-xl transition flex items-center gap-2.5 ${active(
                  "/relatorios"
                )}`}
              >
                <BarChart3 size={18} />
                Relatórios
              </Link>

              <Link
                to="/usuarios"
                onClick={fechar}
                className={`px-4 py-3 rounded-xl transition flex items-center gap-2.5 ${active(
                  "/usuarios"
                )}`}
              >
                <Users size={18} />
                Usuários
              </Link>
            </>
          )}

          {!ehUsuarioComum && (
            <Link
              to="/profile"
              onClick={fechar}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2.5 ${active(
                "/profile"
              )}`}
            >
              <UserRound size={18} />
              Meu perfil
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 transition rounded-xl py-3 font-medium text-white flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
