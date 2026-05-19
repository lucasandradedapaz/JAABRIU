import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100">
      <h1 className="text-8xl font-bold text-blue-600">404</h1>
      <p className="text-xl text-gray-600 mt-4">
        Página não encontrada
      </p>

      <Link
        to="/dashboard"
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}