import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/jaabriu-branco.png";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !senha) {
      alert("Preencha email e senha");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        senha,
      });

      console.log("TOKEN:", response.data);

      // backend retorna string JWT
      localStorage.setItem("token", response.data);

      navigate("/dashboard");
    } catch (error) {
      console.log("ERRO LOGIN:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        "Email ou senha inválidos";

      alert(mensagem);
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
  <img
    src={logo}
    alt="JaAbriu"
    className="w-48 object-contain"
  />
</div>

        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded-xl p-3 mb-6 outline-none focus:ring-2 focus:ring-blue-500"
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