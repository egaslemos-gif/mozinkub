import Link from "next/link";
import { maturityLabel } from "@/lib/projects";
import { statusLabel } from "@/lib/labels";

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
      <div className="relative h-28 overflow-hidden bg-[#d9e2e0] sm:h-32">
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
        <div className="absolute inset-0 bg-[#1b2430]/10" />
        {project.logoUrl && (
          <div className="absolute right-2.5 bottom-2.5 z-[1] bg-white/90 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.logoUrl} alt="" className="h-8 w-8 object-contain" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3">
        <p className="text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
          {project.area}
          {project.cohortYear ? ` · ${project.cohortYear}` : ""}
        </p>
        <h3 className="font-display mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
          {project.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{pitch}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-[10px] font-semibold">
          <span className="border border-[#d0d8de] bg-[#eef3f1] px-2 py-0.5 text-primary">
            {statusLabel(project.status)}
          </span>
          <span className="border border-[#d0d8de] bg-[#eef2f5] px-2 py-0.5 text-ul-blue">
            {maturityLabel(project.maturity)}
          </span>
          {project.lifecycle === "ALUMNI" && (
            <span className="border border-[#d0d8de] bg-[#f3f0ec] px-2 py-0.5 text-ul-brown">
              Alumni
            </span>
          )}
          <span className="ml-auto text-xs font-semibold text-primary">Ver →</span>
        </div>
      </div>
    </Link>
  );
}
