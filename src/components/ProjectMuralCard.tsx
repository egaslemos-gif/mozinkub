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
      className="project-card group flex h-full flex-col text-foreground transition"
    >
      <div className="relative h-36 overflow-hidden bg-primary-soft sm:h-40">
        {project.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-[#1b2430]/15" />
        {project.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.logoUrl}
            alt=""
            className="absolute right-3 bottom-3 z-[1] h-10 w-10 object-contain"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-bold tracking-[0.12em] text-primary uppercase">
          {project.area}
          {project.cohortYear ? ` · ${project.cohortYear}` : ""}
        </p>
        <h3 className="font-display line-clamp-2 text-lg font-semibold leading-snug">
          {project.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{pitch}</p>
        {project.fundingEdition && (
          <p className="text-xs text-muted">{project.fundingEdition.name}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold">
          <span className="border border-border bg-primary-soft px-2 py-1 text-primary">
            {statusLabel(project.status)}
          </span>
          <span className="border border-border bg-[#f0f4f7] px-2 py-1 text-ul-blue">
            {maturityLabel(project.maturity)}
          </span>
          {project.lifecycle === "ALUMNI" && (
            <span className="border border-border bg-[#f4f1ee] px-2 py-1 text-ul-brown">
              Alumni
            </span>
          )}
          <span className="ml-auto text-sm font-semibold text-primary">Ver ficha →</span>
        </div>
      </div>
    </Link>
  );
}
