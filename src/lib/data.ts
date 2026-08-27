import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import "server-only";

export { statusLabel } from "@/lib/labels";
export async function getSiteConfig() {
  return prisma.siteConfig.findUnique({ where: { id: "main" } });
}

export type ProjectFilters = {
  year?: number;
  edition?: string;
  lifecycle?: string;
};

export async function getPublishedProjects(filters: ProjectFilters = {}) {
  const where: Prisma.ProjectWhereInput = { published: true };

  if (filters.year) where.cohortYear = filters.year;
  if (filters.edition) where.fundingEdition = { slug: filters.edition, published: true };
  if (filters.lifecycle && filters.lifecycle !== "TODOS") {
    where.lifecycle = filters.lifecycle;
  }

  return prisma.project.findMany({
    where,
    include: { fundingEdition: true },
    orderBy: [{ cohortYear: "desc" }, { featured: "desc" }, { order: "asc" }, { name: "asc" }],
  });
}

export async function getProjectFilterOptions() {
  const [years, editions] = await Promise.all([
    prisma.project.findMany({
      where: { published: true, cohortYear: { not: null } },
      select: { cohortYear: true },
      distinct: ["cohortYear"],
      orderBy: { cohortYear: "desc" },
    }),
    prisma.fundingEdition.findMany({
      where: { published: true },
      orderBy: { year: "desc" },
    }),
  ]);

  return {
    years: years.map((y) => y.cohortYear).filter((y): y is number => y != null),
    editions,
  };
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, published: true },
    include: {
      milestones: { orderBy: { date: "asc" } },
      gallery: { orderBy: { createdAt: "asc" } },
      fundingEdition: true,
    },
  });
}

export async function getPublishedEvents() {
  return prisma.event.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
  });
}

/** Próximos eventos (a partir de agora); se não houver, devolve o mais recente. */
export async function getHighlightEvent() {
  const upcoming = await prisma.event.findFirst({
    where: { published: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  if (upcoming) return upcoming;
  return prisma.event.findFirst({
    where: { published: true },
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findFirst({
    where: { slug, published: true },
  });
}

export async function getPublishedProjectSlugs() {
  const rows = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getPublishedEventSlugs() {
  const rows = await prisma.event.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getPublishedTimelineSlugs() {
  const rows = await prisma.timelineItem.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getPublishedFundingCallSlugs() {
  const rows = await prisma.fundingCall.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getCalendarEntries() {
  const [events, activities] = await Promise.all([
    prisma.event.findMany({
      where: { published: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.timelineItem.findMany({
      where: { published: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const fromEvents = events.map((e) => ({
    id: `evt-${e.id}`,
    kind: "EVENTO" as const,
    title: e.title,
    slug: e.slug,
    summary: e.summary,
    details: e.details,
    category: e.category,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    coverUrl: e.coverUrl,
    href: `/eventos/${e.slug}`,
  }));

  const fromActivities = activities.map((a) => ({
    id: `act-${a.id}`,
    kind: "ACTIVIDADE" as const,
    title: a.title,
    slug: a.slug,
    summary: a.description,
    details: a.details,
    category: a.category || "ACTIVIDADE",
    location: null as string | null,
    startsAt: a.date.toISOString(),
    endsAt: null as string | null,
    coverUrl: a.mediaUrl,
    href: `/actividades/${a.slug}`,
  }));

  return [...fromEvents, ...fromActivities].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export async function getPublishedFundingEditions() {
  return prisma.fundingEdition.findMany({
    where: { published: true },
    orderBy: { year: "desc" },
    include: {
      calls: {
        where: { published: true },
        orderBy: { deadline: "asc" },
      },
    },
  });
}

export async function getPublishedFundingCalls() {
  return prisma.fundingCall.findMany({
    where: { published: true },
    include: { edition: true },
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
  });
}

export async function getFundingCallBySlug(slug: string) {
  return prisma.fundingCall.findFirst({
    where: { slug, published: true },
    include: { edition: true },
  });
}

export async function getPublishedTimeline() {
  return prisma.timelineItem.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });
}

export async function getTimelineBySlug(slug: string) {
  return prisma.timelineItem.findFirst({
    where: { slug, published: true },
  });
}

export async function getPublishedHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
}

export async function getPublishedAnnouncements(limit?: number) {
  const now = new Date();
  const items = await prisma.announcement.findMany({
    where: {
      published: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  });
  return items;
}

export async function getPublishedAlbums() {
  return prisma.galleryAlbum.findMany({
    where: { published: true },
    include: { media: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export function parseValues(valuesJson: string): string[] {
  try {
    const parsed = JSON.parse(valuesJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
