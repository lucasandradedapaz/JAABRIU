import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/jaabriu.png";
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function active(path) {
    return location.pathname.startsWith(path)
      ? "bg-blue-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 fixed left-0 top-0 flex flex-col">
      <div className="mb-10 flex justify-center">
  
  <img
    src={logo}
    alt="JaAbriu"
    className="w-30 object-contain"
  />
</div>

      <nav className="flex flex-col gap-2 p-4 flex-1">
        <Link
          to="/dashboard"
          className={`px-4 py-3 rounded-xl transition ${active(
            "/dashboard"
          )}`}
        >
          Dashboard
        </Link>

        <Link
          to="/chamados"
          className={`px-4 py-3 rounded-xl transition ${active(
            "/chamados"
          )}`}
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
          className={`px-4 py-3 rounded-xl transition ${active(
            "/historico"
          )}`}
        >
          Histórico
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 transition rounded-xl py-3 font-medium"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}