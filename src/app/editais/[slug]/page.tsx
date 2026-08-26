import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CallApplicationForm } from "@/components/CallApplicationForm";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  getFundingCallBySlug,
  getPublishedFundingCallSlugs,
  getSiteConfig,
  statusLabel,
} from "@/lib/data";
import { isCallOpen } from "@/lib/funding";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getPublishedFundingCallSlugs();
  return slugs.map((slug) => ({ slug }));
}
export default async function EditalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, call] = await Promise.all([getSiteConfig(), getFundingCallBySlug(slug)]);
  if (!call) notFound();

  const open = isCallOpen(call);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <Link href="/editais" className="text-sm font-semibold text-primary">
          ← Todos os editais
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
                {statusLabel(call.status)}
              </span>
              {call.edition && (
                <span className="rounded-full bg-[#e8f4fb] px-3 py-1 text-ul-blue">
                  {call.edition.name}
                </span>
              )}
            </div>
            <h1 className="font-display mt-3 text-4xl font-semibold">{call.title}</h1>
            <p className="mt-4 text-lg text-muted">{call.summary}</p>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {call.opensAt && (
                <div className="card-surface p-4">
                  <p className="font-semibold">Abertura</p>
                  <p className="mt-1 text-muted">
                    {new Date(call.opensAt).toLocaleDateString("pt-MZ")}
                  </p>
                </div>
              )}
              {call.deadline && (
                <div className="card-surface p-4">
                  <p className="font-semibold">Prazo de submissão</p>
                  <p className="mt-1 text-muted">
                    {new Date(call.deadline).toLocaleDateString("pt-MZ")}
                  </p>
                </div>
              )}
            </div>

            {call.description && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold">Informação do concurso</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {call.description}
                </p>
              </div>
            )}
            {call.eligibility && (
              <div className="mt-6">
                <h2 className="font-display text-xl font-semibold">Elegibilidade</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {call.eligibility}
                </p>
              </div>
            )}
            {call.areas && (
              <div className="mt-6">
                <h2 className="font-display text-xl font-semibold">Áreas elegíveis</h2>
                <p className="mt-2 text-sm text-muted">{call.areas}</p>
              </div>
            )}
            {call.documentUrl && (
              <a
                href={call.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost mt-8 inline-flex"
              >
                Descarregar PDF do edital
              </a>
            )}
          </div>

          <aside>
            {open ? (
              <CallApplicationForm callId={call.id} callTitle={call.title} />
            ) : (
              <div className="card-surface p-6">
                <h3 className="font-display text-xl font-semibold">Candidaturas</h3>
                <p className="mt-3 text-sm text-muted">
                  Este edital não está a aceitar novas submissões neste momento.
                </p>
                {call.documentUrl && (
                  <a
                    href={call.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-primary"
                  >
                    Consultar documento →
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
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
