import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getPublishedTimelineSlugs, getSiteConfig, getTimelineBySlug } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getPublishedTimelineSlugs();
  return slugs.map((slug) => ({ slug }));
}
export default async function ActividadeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, item] = await Promise.all([getSiteConfig(), getTimelineBySlug(slug)]);
  if (!item) notFound();

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Link href="/actividades" className="text-sm font-semibold text-primary">
          ← Voltar às actividades
        </Link>
        <p className="mt-6 text-xs font-semibold tracking-wide text-primary uppercase">
          {new Date(item.date).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          · {item.category}
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold">{item.title}</h1>
        <p className="mt-4 text-lg text-muted">{item.description}</p>

        {item.details && (
          <div className="card-surface mt-8 p-6">
            <h2 className="font-display text-xl font-semibold">Detalhes</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {item.details}
            </p>
          </div>
        )}

        {item.mediaUrl && (
          <div className="card-surface mt-6 overflow-hidden">
            <div className="relative aspect-[16/10] bg-primary-soft">
              <Image
                src={item.mediaUrl}
                alt={item.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="p-4 text-sm text-muted">Evidência / registo fotográfico da actividade</p>
          </div>
        )}
      </main>
      {config && (
        <>
          <SiteFooter
            brand={config.brandName}
            slogan={config.slogan}
            address={config.address}
            phone={config.phone}
            email={config.email}
          />
          <WhatsAppFab phone={config.whatsapp || config.phone} />
        </>
      )}
    </div>
  );
}
