function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url) || url.toLowerCase().includes("application/pdf");
}

/** Bloco público: descarregar / pré-visualizar o documento oficial do concurso. */
export function OfficialCallDocument({
  url,
  title = "Documento oficial do concurso",
}: {
  url: string;
  title?: string;
}) {
  const image = isImageUrl(url);
  const pdf = isPdfUrl(url);

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
          Edital oficial
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          {pdf
            ? "PDF do concurso — descarregue ou abra no browser."
            : image
              ? "Digitalização / imagem do edital oficial."
              : "Ficheiro oficial anexado pela coordenação."}
        </p>
      </div>
      {image && (
        <div className="bg-[#f4f7f5] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title}
            className="mx-auto max-h-[480px] w-full object-contain"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-3 px-5 py-4">
        <a href={url} target="_blank" rel="noreferrer" className="btn-primary !py-2.5 text-sm">
          {pdf ? "Abrir PDF" : image ? "Abrir imagem" : "Abrir documento"}
        </a>
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="btn-ghost !py-2.5 text-sm"
        >
          Descarregar
        </a>
      </div>
    </div>
  );
}
