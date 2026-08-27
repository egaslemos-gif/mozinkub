import Link from "next/link";
import { announcementTypeLabel } from "@/lib/announcements";
import { toAppMediaUrl } from "@/lib/media-url";

export type AnnouncementCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  imageUrl: string;
  linkUrl: string | null;
  linkLabel: string | null;
  featured?: boolean;
  acceptRegistrations?: boolean;
};

export function AnnouncementCard({
  item,
  large = false,
}: {
  item: AnnouncementCardData;
  large?: boolean;
}) {
  const src = toAppMediaUrl(item.imageUrl) || item.imageUrl;
  const detailHref = `/actualizacoes/${item.slug}`;
  const wantsSignup = Boolean(item.acceptRegistrations);
  const href = wantsSignup
    ? `${detailHref}#inscricao`
    : item.linkUrl || detailHref;
  const cta =
    item.linkLabel ||
    (wantsSignup ? "Inscrever-se" : item.linkUrl ? "Saber mais" : "Ver detalhes");

  return (
    <article
      className={
        large
          ? "group grid border border-border bg-white md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
          : "group flex flex-col border border-border bg-white"
      }
    >
      <Link
        href={detailHref}
        className="relative flex items-center justify-center bg-[#eef3f0] p-3 md:p-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.title}
          className={
            large
              ? "h-auto max-h-[min(72vh,720px)] w-full object-contain"
              : "mx-auto h-auto max-h-72 w-full object-contain"
          }
        />
      </Link>
      <div className={large ? "flex flex-col justify-center p-5 md:p-7" : "flex flex-1 flex-col p-4"}>
        <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
          {announcementTypeLabel(item.type)}
          {item.featured ? " · Destaque" : ""}
        </p>
        <h3
          className={
            large
              ? "font-display mt-2 text-2xl font-semibold leading-snug"
              : "font-display mt-2 text-lg font-semibold leading-snug"
          }
        >
          <Link href={detailHref} className="hover:text-primary">
            {item.title}
          </Link>
        </h3>
        <p
          className={
            large
              ? "mt-3 text-sm leading-relaxed text-muted"
              : "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted"
          }
        >
          {item.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={href}
            className="inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {cta} →
          </Link>
          {wantsSignup && item.linkUrl && (
            <Link
              href={item.linkUrl}
              className="inline-flex text-sm font-medium text-muted hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Mais informação
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
