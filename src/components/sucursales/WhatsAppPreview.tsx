interface Props {
  descripcion: string;
  photoUrls: string[];
  nombre: string;
}

function renderWhatsAppText(text: string) {
  // Bold: *text*
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    // Linkify URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments = part.split(urlRegex);
    return segments.map((seg, j) =>
      urlRegex.test(seg) ? (
        <a key={`${i}-${j}`} href={seg} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
          {seg}
        </a>
      ) : (
        <span key={`${i}-${j}`}>{seg}</span>
      )
    );
  });
}

export function WhatsAppPreview({ descripcion, photoUrls, nombre }: Props) {
  return (
    <div className="rounded-lg border border-border bg-[#0b141a] p-4 space-y-3">
      <p className="text-xs text-muted-foreground font-medium">Vista previa WhatsApp — {nombre}</p>
      {photoUrls.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {photoUrls.slice(0, 5).map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 w-16 rounded object-cover flex-shrink-0" />
          ))}
        </div>
      )}
      {descripcion ? (
        <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
          {renderWhatsAppText(descripcion)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Sin descripción</p>
      )}
    </div>
  );
}
