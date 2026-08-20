import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  const authenticated = !!token;

  async function carregarPerfil() {
    try {
      const response = await api.get("/usuarios/me");
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.log("Erro ao carregar perfil logado:", error);
      // token inválido/expirado -> desloga
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setLoading(true);
    // retorna o perfil recém-carregado para quem chamou (ex: tela de login)
    // decidir para onde navegar de acordo com o tipo de usuário.
    return await carregarPerfil();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  // perfil helpers
  function isAdmin() {
    return user?.perfil === "ADMIN";
  }

  function isTecnico() {
    return user?.perfil === "TECNICO";
  }

  function isUsuario() {
    return user?.perfil === "USUARIO";
  }

  function podeGerenciarChamados() {
    return user?.perfil === "ADMIN" || user?.perfil === "TECNICO";
  }

  useEffect(() => {
    if (token) {
      carregarPerfil();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        authenticated,
        login,
        logout,
        isAdmin,
        isTecnico,
        isUsuario,
        podeGerenciarChamados,
        recarregarPerfil: carregarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
