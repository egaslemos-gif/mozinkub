import Link from "next/link";
import { maturityLabel } from "@/lib/projects";
import { statusLabel } from "@/lib/data";

export type ProjectMuralItem = {
  slug: string;
  name: string;
  area: string;
  tagline: string | null;
  summary: string;
  status: string;
  maturity: string;
  lifecycle?: string;
  cohortYear?: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  lookingFor?: string | null;
  fundingEdition?: { name: string; year: number } | null;
};

export function ProjectMuralCard({ project }: { project: ProjectMuralItem }) {
  const pitch = project.tagline || project.summary;

  return (
    <Link
      href={`/projectos/${project.slug}`}
      className="project-card group flex h-full flex-col border border-border bg-white text-foreground transition hover:border-primary"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e8eeec]">
        {project.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#d7e3e0] via-[#e8eeec] to-[#dfe6ea]" />
        )}
        <div className="absolute inset-0 bg-[#1b2430]/18" />
        {project.logoUrl && (
          <div className="absolute bottom-0 left-4 z-[1] translate-y-1/2 border border-border bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.logoUrl}
              alt=""
              className="h-11 w-11 object-contain"
            />
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col px-5 pb-5 ${project.logoUrl ? "pt-10" : "pt-5"}`}>
        <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
          {project.area}
          {project.cohortYear ? ` · ${project.cohortYear}` : ""}
        </p>
        <h3 className="font-display mt-1.5 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {project.name}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{pitch}</p>
        {project.fundingEdition && (
          <p className="mt-2 text-xs text-muted">{project.fundingEdition.name}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="border border-border bg-[#f3f6f5] px-2.5 py-1 text-primary">
            {statusLabel(project.status)}
          </span>
          <span className="border border-border bg-[#f3f5f7] px-2.5 py-1 text-ul-blue">
            {maturityLabel(project.maturity)}
          </span>
          {project.lifecycle === "ALUMNI" && (
            <span className="border border-border bg-[#f5f4f2] px-2.5 py-1 text-ul-brown">
              Alumni
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-primary">Ver ficha →</p>
      </div>
    </Link>
  );
}
