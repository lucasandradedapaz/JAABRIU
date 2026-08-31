import { Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { authenticated, user, loading } = useAuth();

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  // Ainda buscando o perfil do usuário logado
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader className="animate-spin" size={20} />
          Carregando...
        </div>
      </div>
    );
  }

  // Rota restrita a determinados perfis.
  // Usuário comum não tem "home" no dashboard — a home dele é abrir chamado.
  if (roles && roles.length > 0 && user && !roles.includes(user.perfil)) {
    const home = user.perfil === "USUARIO" ? "/novo-chamado" : "/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
}