import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementRegistrationForm } from "@/components/AnnouncementRegistrationForm";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { announcementTypeLabel } from "@/lib/announcements";
import { getAnnouncementBySlug, getSiteConfig } from "@/lib/data";
import { toAppMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

export default async function ActualizacaoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, item] = await Promise.all([
    getSiteConfig(),
    getAnnouncementBySlug(slug),
  ]);

  if (!item) notFound();

  const src = toAppMediaUrl(item.imageUrl) || item.imageUrl;
  const closed =
    Boolean(item.registrationClosesAt) &&
    item.registrationClosesAt!.getTime() < Date.now();

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main>
        <section className="section bg-white">
          <div className="section-inner">
            <p className="section-kicker">
              {announcementTypeLabel(item.type)}
              {item.featured ? " · Destaque" : ""}
            </p>
            <h1 className="section-title mt-2 max-w-3xl">{item.title}</h1>
            <p className="section-lead mt-3 max-w-2xl">{item.summary}</p>

            <div className="mt-8 border border-border bg-[#eef3f0] p-3 md:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={item.title}
                className="mx-auto h-auto w-full max-w-3xl object-contain"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/actualizacoes" className="section-link">
                ← Todas as actualizações
              </Link>
              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="section-link"
                >
                  {item.linkLabel || "Ligação externa"} →
                </a>
              )}
              {item.acceptRegistrations && !closed && (
                <a href="#inscricao" className="section-link">
                  Ir para inscrição →
                </a>
              )}
            </div>

            {item.acceptRegistrations && (
              <div className="mt-10 max-w-2xl">
                <AnnouncementRegistrationForm
                  announcementId={item.id}
                  title={item.title}
                  closed={closed}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      {config && (
        <SiteFooter
          brand={config.brandName}
          slogan={config.slogan}
          address={config.address}
          phone={config.phone}
          email={config.email}
        />
      )}
    </div>
  );
}
