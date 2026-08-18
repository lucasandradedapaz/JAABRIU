const CORES_AVATAR = [
  "bg-[#2563EB]",
  "bg-[#0F766E]",
  "bg-[#4675AF]",
  "bg-slate-600",
  "bg-sky-600",
  "bg-cyan-700",
  "bg-[#05204B]",
];

function corParaNome(nome = "") {
  const codigo = nome
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CORES_AVATAR[codigo % CORES_AVATAR.length] || CORES_AVATAR[0];
}

function iniciaisNome(nome = "") {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function Avatar({ nome, tamanho = 36, foto }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome}
        className="rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }

  return (
    <div
      title={nome}
      className={`${corParaNome(
        nome
      )} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm shrink-0`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
    >
      {iniciaisNome(nome)}
    </div>
  );
}