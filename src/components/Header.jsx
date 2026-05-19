export default function Header({ titulo, subtitulo }) {
  return (
    <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800">
          {titulo || "JaAbriu"}
        </h1>

        {subtitulo && (
          <p className="text-gray-500 text-sm md:text-base">
            {subtitulo}
          </p>
        )}
      </div>
    </header>
  );
}