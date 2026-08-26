"use client";

export function WhatsAppFab({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("258")
    ? digits
    : digits.length <= 9
      ? `258${digits}`
      : digits;
  const href = `https://wa.me/${normalized}?text=${encodeURIComponent(
    "Olá IEUL / Antena da Beira. Gostaria de obter mais informações."
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar via WhatsApp"
      className="fixed right-4 bottom-5 z-50 flex items-center gap-2 rounded-full bg-[color:var(--wa)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[color:var(--wa-dark)] md:right-6 md:bottom-6"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-base">
        ✆
      </span>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
