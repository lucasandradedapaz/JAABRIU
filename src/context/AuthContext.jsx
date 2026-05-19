import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("token") || null
  );

  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setAuthenticated(false);
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        authenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}