/**
 * Crédito de desenvolvimento — actualize a URL quando o site da CyberCode360 estiver online.
 * Também pode definir NEXT_PUBLIC_CYBERCODE_URL no Vercel.
 */
export const CYBERCODE = {
  name: "CyberCode360, SU, LDA",
  shortName: "CyberCode360",
  tagline: "Soluções digitais para organizações que querem crescer",
  /** URL pública — substituir quando o site estiver online */
  url:
    process.env.NEXT_PUBLIC_CYBERCODE_URL?.trim() ||
    "https://cybercode360.com",
  cta: "Conhecer a CyberCode360",
} as const;
