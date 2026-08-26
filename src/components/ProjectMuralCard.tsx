import Link from "next/link";
import { maturityLabel } from "@/lib/projects";
import { statusLabel } from "@/lib/data";

export type ProjectMuralItem = {
  id?: string;
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
  fundingEdition?: { name: string; year: number; slug?: string } | null;
};

export function ProjectMuralCard({ project }: { project: ProjectMuralItem }) {
  const pitch = project.tagline || project.summary;

  return (
    <Link
      href={`/projectos/${project.slug}`}
      className="project-card group flex h-full flex-col bg-white text-foreground transition hover:border-primary"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#d9e2e0]">
        {project.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#c5d4cf] via-[#d9e2e0] to-[#cfd7dc]" />
        )}
        <div className="absolute inset-0 bg-[#1b2430]/12" />
        {project.logoUrl && (
          <div className="absolute bottom-3 left-4 z-[1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.logoUrl}
              alt=""
              className="h-12 w-12 object-contain drop-shadow-none"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-[#d0d8de] px-5 py-5">
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
          <span className="border border-[#d0d8de] bg-[#eef3f1] px-2.5 py-1 text-primary">
            {statusLabel(project.status)}
          </span>
          <span className="border border-[#d0d8de] bg-[#eef2f5] px-2.5 py-1 text-ul-blue">
            {maturityLabel(project.maturity)}
          </span>
          {project.lifecycle === "ALUMNI" && (
            <span className="border border-[#d0d8de] bg-[#f3f0ec] px-2.5 py-1 text-ul-brown">
              Alumni
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-primary">Ver ficha →</p>
      </div>
    </Link>
  );
}
