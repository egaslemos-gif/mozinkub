"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectMuralCard, type ProjectMuralItem } from "@/components/ProjectMuralCard";

type EditionOpt = { id: string; slug: string; name: string };
type MuralProject = ProjectMuralItem & { id: string };

export function ProjectosMural({
  projects,
  years,
  editions,
}: {
  projects: MuralProject[];
  years: number[];
  editions: EditionOpt[];
}) {
  const searchParams = useSearchParams();
  const ciclo = searchParams.get("ciclo") || "ATIVO";
  const ano = searchParams.get("ano") || "";
  const edicao = searchParams.get("edicao") || "";

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (ciclo !== "TODOS" && (p.lifecycle || "ATIVO") !== ciclo) return false;
      if (ano && String(p.cohortYear ?? "") !== ano) return false;
      if (edicao && p.fundingEdition?.slug !== edicao) return false;
      return true;
    });
  }, [projects, ciclo, ano, edicao]);

  function hrefFor(patch: { ano?: string | null; edicao?: string | null; ciclo?: string | null }) {
    const nextAno = patch.ano === "" || patch.ano === null ? undefined : (patch.ano ?? (ano || undefined));
    const nextEdicao =
      patch.edicao === "" || patch.edicao === null ? undefined : (patch.edicao ?? (edicao || undefined));
    const nextCiclo =
      patch.ciclo === "" || patch.ciclo === null ? undefined : (patch.ciclo ?? (ciclo || "ATIVO"));
    const q = new URLSearchParams();
    if (nextCiclo && nextCiclo !== "ATIVO") q.set("ciclo", nextCiclo);
    if (nextAno) q.set("ano", nextAno);
    if (nextEdicao) q.set("edicao", nextEdicao);
    const s = q.toString();
    return s ? `/projectos?${s}` : "/projectos";
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {[
          { ciclo: "ATIVO", label: "Em incubação" },
          { ciclo: "ALUMNI", label: "Histórico / Alumni" },
          { ciclo: "TODOS", label: "Todos" },
        ].map((t) => {
          const active = ciclo === t.ciclo;
          return (
            <Link
              key={t.ciclo}
              href={hrefFor({ ciclo: t.ciclo, ano: "", edicao: "" })}
              className={`px-4 py-2 text-sm font-semibold ${
                active ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-border"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={hrefFor({ ano: "", edicao: edicao || null })}
          className={`px-3 py-1.5 text-xs font-semibold ${
            !ano ? "bg-ul-blue text-white" : "bg-white text-muted ring-1 ring-border"
          }`}
        >
          Todos os anos
        </Link>
        {years.map((y) => (
          <Link
            key={y}
            href={hrefFor({ ano: String(y) })}
            className={`px-3 py-1.5 text-xs font-semibold ${
              ano === String(y) ? "bg-ul-blue text-white" : "bg-white text-muted ring-1 ring-border"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      {editions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={hrefFor({ edicao: "" })}
            className={`px-3 py-1.5 text-xs font-semibold ${
              !edicao ? "bg-ul-brown text-white" : "bg-white text-muted ring-1 ring-border"
            }`}
          >
            Todas as edições
          </Link>
          {editions.map((e) => (
            <Link
              key={e.id}
              href={hrefFor({ edicao: e.slug })}
              className={`px-3 py-1.5 text-xs font-semibold ${
                edicao === e.slug ? "bg-ul-brown text-white" : "bg-white text-muted ring-1 ring-border"
              }`}
            >
              {e.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted md:col-span-3">
            Nenhum projecto encontrado com estes filtros.
          </p>
        )}
        {filtered.map((p) => (
          <ProjectMuralCard key={p.id} project={p} />
        ))}
      </div>
    </>
  );
}
