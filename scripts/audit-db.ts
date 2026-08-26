import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const counts = {
    users: await p.user.count(),
    siteConfig: await p.siteConfig.count(),
    heroSlides: await p.heroSlide.count(),
    projects: await p.project.count(),
    milestones: await p.projectMilestone.count(),
    projectMedia: await p.projectMedia.count(),
    events: await p.event.count(),
    editions: await p.fundingEdition.count(),
    calls: await p.fundingCall.count(),
    applications: await p.callApplication.count(),
    timeline: await p.timelineItem.count(),
    albums: await p.galleryAlbum.count(),
    galleryMedia: await p.galleryMedia.count(),
    messages: await p.contactMessage.count(),
  };

  const openCalls = await p.fundingCall.findMany({
    where: { status: "ABERTO" },
    select: {
      title: true,
      documentUrl: true,
      acceptApplications: true,
      published: true,
    },
  });

  const projectsWithoutEdition = await p.project.count({
    where: { fundingEditionId: null },
  });
  const projectsWithEdition = await p.project.count({
    where: { fundingEditionId: { not: null } },
  });
  const publishedProjects = await p.project.count({ where: { published: true } });
  const publishedEvents = await p.event.count({ where: { published: true } });
  const upcomingEvents = await p.event.count({
    where: { published: true, startsAt: { gte: new Date() } },
  });

  console.log(
    JSON.stringify(
      {
        counts,
        openCalls,
        projectsWithoutEdition,
        projectsWithEdition,
        publishedProjects,
        publishedEvents,
        upcomingEvents,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
