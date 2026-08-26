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
      className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[1.25rem] bg-[#0f3d45] text-white"
    >
      {project.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f6b63] to-[#123047]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#062428]/95 via-[#062428]/40 to-black/10" />

      {project.logoUrl && (
        <div className="absolute top-4 left-4 z-[1] grid h-14 w-14 place-items-center rounded-xl bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.logoUrl} alt="" className="max-h-11 max-w-11 object-contain" />
        </div>
      )}

      <div className="relative z-[1] mt-auto p-5">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#9fd4c8] uppercase">
          {project.area}
          {project.cohortYear ? ` · ${project.cohortYear}` : ""}
        </p>
        <h3 className="font-display mt-1 text-2xl font-semibold leading-tight">{project.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/85">{pitch}</p>
        {project.fundingEdition && (
          <p className="mt-2 text-xs text-white/70">{project.fundingEdition.name}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-white/15 px-2.5 py-1">{statusLabel(project.status)}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1">
            {maturityLabel(project.maturity)}
          </span>
          {project.lifecycle === "ALUMNI" && (
            <span className="rounded-full bg-white/15 px-2.5 py-1">Alumni</span>
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-[#9fd4c8]">Ver ficha →</p>
      </div>
    </Link>
  );
}
