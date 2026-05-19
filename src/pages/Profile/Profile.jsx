import Sidebar from "../../components/Sidebar";

export default function Profile() {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <main className="ml-64 p-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

        <div className="bg-white rounded-2xl shadow p-8 max-w-xl">
          <p className="mb-4">
            <strong>Usuário:</strong> Admin
          </p>

          <p className="mb-4">
            <strong>Email:</strong> admin@teste.com
          </p>

          <p>
            <strong>Perfil:</strong> Administrador
          </p>
        </div>
      </main>
    </div>
  );
}