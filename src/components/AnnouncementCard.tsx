import Link from "next/link";
import { announcementTypeLabel } from "@/lib/announcements";
import { toAppMediaUrl } from "@/lib/media-url";

export type AnnouncementCardData = {
  id: string;
  title: string;
  summary: string;
  type: string;
  imageUrl: string;
  linkUrl: string | null;
  linkLabel: string | null;
  featured?: boolean;
};

export function AnnouncementCard({
  item,
  large = false,
}: {
  item: AnnouncementCardData;
  large?: boolean;
}) {
  const src = toAppMediaUrl(item.imageUrl) || item.imageUrl;
  const href = item.linkUrl || "/actualizacoes";
  const cta = item.linkLabel || (item.linkUrl ? "Saber mais" : "Ver actualizações");

  return (
    <article
      className={
        large
          ? "group grid overflow-hidden border border-border bg-white md:grid-cols-[1.15fr_1fr]"
          : "group flex flex-col overflow-hidden border border-border bg-white"
      }
    >
      <Link href={href} className="relative block overflow-hidden bg-[#e8eeea]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.title}
          className={
            large
              ? "aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.02] md:aspect-[3/4] md:max-h-[420px]"
              : "aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
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
          {item.title}
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
        <Link
          href={href}
          className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          {cta} →
        </Link>
      </div>
    </article>
  );
}
