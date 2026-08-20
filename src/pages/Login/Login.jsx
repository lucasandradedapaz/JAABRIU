import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/jaabriu-branco.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !senha) {
      toast.warn("Preencha email e senha");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", { email, senha });

      // backend retorna string JWT
      const perfilLogado = await login(response.data);

      // Usuário comum não precisa de dashboard: vai direto para abrir um chamado.
      // Técnico/Admin vão para o painel de gestão.
      if (perfilLogado?.perfil === "USUARIO") {
        navigate("/novo-chamado");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log("ERRO LOGIN:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        "Email ou senha inválidos";

      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-xl rounded-2xl p-8 w-96"
      >
        <div className="flex justify-center mb-6">
          <img src={logo} alt="JaAbriu" className="w-48 object-contain" />
        </div>

        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl p-3 mb-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
        />

        <input
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl p-3 mb-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-xl font-medium transition"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}