import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getPublishedFundingCalls, getSiteConfig, statusLabel } from "@/lib/data";
import { isCallOpen } from "@/lib/funding";

export const dynamic = "force-dynamic";

export default async function EditaisPage() {
  const [config, calls] = await Promise.all([getSiteConfig(), getPublishedFundingCalls()]);
  const open = calls.filter((c) => isCallOpen(c));
  const others = calls.filter((c) => !isCallOpen(c));

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Financiamento</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Editais e concursos</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Divulgação de editais de financiamento da incubadora. Consulte as condições e submeta a
          candidatura do seu projecto em PDF.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Abertos a candidaturas</h2>
          <div className="mt-4 grid gap-4">
            {open.length === 0 && (
              <p className="text-sm text-muted">Neste momento não há editais abertos.</p>
            )}
            {open.map((c) => (
              <article key={c.id} className="card-surface p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                    {statusLabel(c.status)}
                  </span>
                  {c.edition && <span className="text-xs text-muted">{c.edition.name}</span>}
                  {c.deadline && (
                    <span className="text-xs text-muted">
                      Prazo: {new Date(c.deadline).toLocaleDateString("pt-MZ")}
                    </span>
                  )}
                </div>
                <h3 className="font-display mt-3 text-2xl font-semibold">{c.title}</h3>
                <p className="mt-3 text-sm text-muted">{c.summary}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/editais/${c.slug}`}
                    className="btn-primary inline-flex !py-2.5 text-sm"
                  >
                    Ver edital e candidatar-se →
                  </Link>
                  {c.documentUrl && (
                    <a
                      href={c.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost inline-flex !py-2.5 text-sm"
                    >
                      Documento oficial
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">Anteriores / encerrados</h2>
            <div className="mt-4 grid gap-4">
              {others.map((c) => (
                <article key={c.id} className="card-surface p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#e8f4fb] px-3 py-1 text-xs font-semibold text-ul-blue">
                      {statusLabel(c.status)}
                    </span>
                    {c.edition && <span className="text-xs text-muted">{c.edition.name}</span>}
                  </div>
                  <h3 className="font-display mt-3 text-xl font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted">{c.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href={`/editais/${c.slug}`}
                      className="text-sm font-semibold text-primary"
                    >
                      Ver informação →
                    </Link>
                    {c.documentUrl && (
                      <a
                        href={c.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-ul-blue"
                      >
                        Documento oficial →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
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
