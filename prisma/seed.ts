import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { seedRbac } from "./seed-rbac";

function createSeedPrisma() {
  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_URL ||
    "";
  const authToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    "";

  if ((url.startsWith("libsql://") || url.startsWith("https://")) && authToken) {
    const libsql = createClient({ url, authToken });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }

  return new PrismaClient();
}

const prisma = createSeedPrisma();

async function main() {
  const passwordHash = await bcrypt.hash("ieul2026", 10);

  await prisma.user.upsert({
    where: { email: "coordenacao@ieul.ul.ac.mz" },
    update: {
      role: "INCUBATOR_COORDINATOR",
      status: "ACTIVE",
    },
    create: {
      name: "Coordenação Antena Beira",
      email: "coordenacao@ieul.ul.ac.mz",
      passwordHash,
      role: "INCUBATOR_COORDINATOR",
      status: "ACTIVE",
    },
  });

  const demoUsers: {
    email: string;
    name: string;
    role: string;
  }[] = [
    {
      email: "admin@ieul.ul.ac.mz",
      name: "Administrador Plataforma",
      role: "PLATFORM_ADMIN",
    },
    {
      email: "secretaria@ieul.ul.ac.mz",
      name: "Secretaria IEUL",
      role: "SECRETARIAT",
    },
    {
      email: "coach@ieul.ul.ac.mz",
      name: "Coach Demo",
      role: "COACH",
    },
    {
      email: "gestor@ieul.ul.ac.mz",
      name: "Gestor Projecto Demo",
      role: "PROJECT_MANAGER",
    },
    {
      email: "membro@ieul.ul.ac.mz",
      name: "Membro Equipa Demo",
      role: "TEAM_MEMBER",
    },
    {
      email: "avaliador@ieul.ul.ac.mz",
      name: "Avaliador Demo",
      role: "EVALUATOR",
    },
  ];

  for (const demo of demoUsers) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: { role: demo.role, status: "ACTIVE", name: demo.name },
      create: {
        name: demo.name,
        email: demo.email,
        passwordHash,
        role: demo.role,
        status: "ACTIVE",
      },
    });
  }

  await seedRbac(prisma);

  await prisma.siteConfig.upsert({
    where: { id: "main" },
    update: {
      whatsapp: "834610931",
      email: "cycode360@gmail.com",
    },
    create: {
      id: "main",
      brandName: "Incubadora de Empresas da Universidade Licungo",
      slogan: "Incubar hoje, inovar amanhã, transformar o futuro!",
      mission:
        "Apoiar empreendedores e start-ups através de incubação, coaching e acompanhamento técnico, promovendo negócios sustentáveis na região centro de Moçambique.",
      vision:
        "Ser a referência regional em incubação universitária, inovação e transformação económica inclusiva.",
      valuesJson: JSON.stringify([
        "Inovação com impacto",
        "Compromisso com a comunidade",
        "Transparência e boa governação",
        "Sustentabilidade ambiental e social",
        "Aprendizagem contínua",
      ]),
      address: "Rua D. Francisco de Almeida 737/751 — Beira, C.Postal 2100",
      phone: "82/84305623",
      whatsapp: "834610931",
      email: "cycode360@gmail.com",
      campus: "Campus da Ponta-Gêa, Beira — Moçambique",
      aboutText:
        "A Incubadora de Empresas da Universidade Licungo (IEUL), no âmbito do Projecto MozInkub N+1, acompanha projectos incubados nas áreas de Tecnologia Digital, Ambiente e Biodiversidade, Agricultura e outros sectores, com apoio da Embaixada de França em Moçambique e Eswatini.",
      heroTitle: "Incubar ideias. Crescer negócios. Transformar a Beira.",
      heroSubtitle:
        "Plataforma institucional da IEUL — Antena da Beira. Conheça projectos incubados, actividades, eventos e oportunidades de financiamento.",
    },
  });

  // Do not wipe milestones/media on re-seed — preserves admin uploads and edits.

  const editions = [
    {
      name: "MozInkub N+1 — 2024",
      slug: "mozinkub-n1-2024",
      year: 2024,
      funder: "Embaixada de França em Moçambique e Eswatini",
      summary: "Edição 2024 do apoio à incubação universitária na Antena da Beira.",
    },
    {
      name: "MozInkub N+1 — 2025",
      slug: "mozinkub-n1-2025",
      year: 2025,
      funder: "Embaixada de França em Moçambique e Eswatini",
      summary: "Edição 2025 — continuidade do acompanhamento a start-ups incubadas.",
    },
    {
      name: "MozInkub N+1 — 2026",
      slug: "mozinkub-n1-2026",
      year: 2026,
      funder: "Embaixada de França em Moçambique e Eswatini",
      summary: "Edição em curso — coorte activa da Antena da Beira.",
    },
  ];

  for (const e of editions) {
    await prisma.fundingEdition.upsert({
      where: { slug: e.slug },
      update: e,
      create: { ...e, published: true },
    });
  }

  const editionRows = await prisma.fundingEdition.findMany();
  const editionBySlug = Object.fromEntries(editionRows.map((e) => [e.slug, e]));

  const projects = [
    {
      name: "KuFaze",
      slug: "kufaze",
      area: "Tecnologia Digital",
      tagline: "Formação online curta, prática e acessível.",
      leader: "Galileo Ruben A. Gonçalves",
      team: null as string | null,
      contact: "82 017 2289",
      whatsapp: "820172289",
      email: null as string | null,
      website: null as string | null,
      facebook: null as string | null,
      instagram: null as string | null,
      linkedin: null as string | null,
      city: "Beira",
      summary:
        "Plataforma de formação online com cursos de curta duração e perspectiva de certificação oficial.",
      description:
        "A KuFaze nasceu para aproximar jovens e profissionais da Beira a conteúdos formativos digitais. O projecto está a consolidar o protótipo da plataforma, o catálogo de cursos e o modelo de certificação, com acompanhamento da IEUL no âmbito do MozInkub N+1.",
      offer:
        "Cursos online de curta duração, com potencial de certificação e acompanhamento pedagógico.",
      audience: "Estudantes, jovens profissionais e organizações que precisam de capacitar equipas.",
      lookingFor:
        "Formandos piloto, parcerias com instituições de formação, instrutores e apoio para legalização operacional.",
      status: "EM_INCUBACAO",
      maturity: "PROTOTIPO",
      lifecycle: "ATIVO",
      cohortYear: 2026,
      fundingEditionId: editionBySlug["mozinkub-n1-2026"]?.id ?? null,
      featured: true,
      published: true,
      order: 1,
      logoUrl: "/images/projects/kufaze-logo.svg",
      coverUrl: "/images/projects/kufaze-cover.svg",
      incubatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    {
      name: "Yafika Delivery-Market",
      slug: "yafika-delivery-market",
      area: "Tecnologia Digital",
      tagline: "Marketplace e delivery local na Beira.",
      leader: "Elton Isaias Mucavele",
      team: "Anastância Domingos",
      contact: "84 778 7409",
      whatsapp: "847787409",
      email: null as string | null,
      website: null as string | null,
      facebook: null as string | null,
      instagram: null as string | null,
      linkedin: null as string | null,
      city: "Beira",
      summary:
        "Marketplace e delivery local que liga fornecedores e consumidores na cidade da Beira.",
      description:
        "A Yafika Delivery-Market liga lojas, produtores e consumidores através de pedidos digitais e entrega. A equipa trabalha o protótipo da plataforma, a rede de fornecedores e a logística de last-mile, ainda em fase de incubação.",
      offer: "Pedidos online, entrega local e vitrine digital para negócios da Beira.",
      audience: "Consumidores urbanos, mercearias, restaurantes e pequenos fornecedores locais.",
      lookingFor:
        "Fornecedores locais, motoboys/parceiros de entrega, clientes piloto e apoio à operacionalização.",
      status: "EM_INCUBACAO",
      maturity: "PROTOTIPO",
      lifecycle: "ATIVO",
      cohortYear: 2026,
      fundingEditionId: editionBySlug["mozinkub-n1-2026"]?.id ?? null,
      featured: true,
      published: true,
      order: 2,
      logoUrl: "/images/projects/yafika-logo.svg",
      coverUrl: "/images/projects/yafika-cover.svg",
      incubatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    {
      name: "Reutilização de Paletes para Produção de Mobiliário",
      slug: "reutilizacao-de-paletes",
      area: "Ambiente e Biodiversidade",
      tagline: "Mobiliário sustentável a partir de paletes reutilizadas.",
      leader: "António Martins Domingos",
      team: null as string | null,
      contact: "84 736 4904",
      whatsapp: "847364904",
      email: null as string | null,
      website: null as string | null,
      facebook: null as string | null,
      instagram: null as string | null,
      linkedin: null as string | null,
      city: "Beira",
      summary:
        "Produção de mobiliário sustentável a partir da reutilização de paletes, com foco em licenciamento ambiental.",
      description:
        "O projecto transforma paletes usadas em mobiliário útil e acessível, com ênfase na economia circular. O acompanhamento actual centra-se no licenciamento ambiental, no desenho de produtos e na preparação da operação.",
      offer: "Mobiliário e peças úteis produzidas a partir de paletes reutilizadas.",
      audience: "Famílias, escritórios, escolas e clientes que valorizam produtos sustentáveis.",
      lookingFor:
        "Encomendas piloto, fornecimento de paletes usadas, apoio ao licenciamento ambiental e exposição comercial.",
      status: "EM_INCUBACAO",
      maturity: "VALIDACAO",
      lifecycle: "ATIVO",
      cohortYear: 2026,
      fundingEditionId: editionBySlug["mozinkub-n1-2026"]?.id ?? null,
      featured: true,
      published: true,
      order: 3,
      logoUrl: "/images/projects/paletes-logo.svg",
      coverUrl: "/images/projects/paletes-cover.svg",
      incubatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
    {
      name: "AgroBeira Fresh",
      slug: "agrobeira-fresh",
      area: "Agricultura",
      tagline: "Circuitos curtos de hortícolas frescas na Beira.",
      leader: "Maria Celeste Nhassengo",
      team: null as string | null,
      contact: "84 100 2001",
      whatsapp: "841002001",
      email: null as string | null,
      website: null as string | null,
      facebook: null as string | null,
      instagram: null as string | null,
      linkedin: null as string | null,
      city: "Beira",
      summary:
        "Projecto alumni (2025) de comercialização de hortícolas com foco em circuitos curtos e produtores periurbanos.",
      description:
        "Registo histórico da coorte 2025. O projecto acompanhou a organização de produtores e a logística de entrega a clientes urbanos.",
      offer: "Cestos de hortícolas e fornecimento a pequenos retalhistas.",
      audience: "Famílias e mercearias locais.",
      lookingFor: null as string | null,
      status: "OPERACIONAL",
      maturity: "OPERACIONAL",
      lifecycle: "ALUMNI",
      cohortYear: 2025,
      fundingEditionId: editionBySlug["mozinkub-n1-2025"]?.id ?? null,
      featured: false,
      published: true,
      order: 10,
      logoUrl: null as string | null,
      coverUrl: "/images/hero-actividades.svg",
      incubatedAt: new Date("2025-03-01T00:00:00.000Z"),
    },
    {
      name: "SoftPrint Beira",
      slug: "softprint-beira",
      area: "Tecnologia Digital",
      tagline: "Serviços digitais de impressão e comunicação visual.",
      leader: "Paulo André Macuácua",
      team: null as string | null,
      contact: "82 300 4002",
      whatsapp: "823004002",
      email: null as string | null,
      website: null as string | null,
      facebook: null as string | null,
      instagram: null as string | null,
      linkedin: null as string | null,
      city: "Beira",
      summary:
        "Projecto alumni (2024) de serviços de design, impressão e comunicação para PME locais.",
      description:
        "Registo histórico da coorte 2024. Consolidou oferta de identidade visual e materiais promocionais para pequenos negócios.",
      offer: "Design gráfico, impressão e pacotes de comunicação para PME.",
      audience: "Pequenas e médias empresas da Beira.",
      lookingFor: null as string | null,
      status: "OPERACIONAL",
      maturity: "OPERACIONAL",
      lifecycle: "ALUMNI",
      cohortYear: 2024,
      fundingEditionId: editionBySlug["mozinkub-n1-2024"]?.id ?? null,
      featured: false,
      published: true,
      order: 11,
      logoUrl: null as string | null,
      coverUrl: "/images/hero-campus.svg",
      incubatedAt: new Date("2024-04-01T00:00:00.000Z"),
    },
  ];

  for (const p of projects) {
    const { logoUrl, coverUrl, ...rest } = p;
    await prisma.project.upsert({
      where: { slug: p.slug },
      // Preserve media URLs if the project already exists (admin may have replaced them).
      update: rest,
      create: p,
    });
  }

  const seeded = await prisma.project.findMany({
    where: { slug: { in: projects.map((p) => p.slug) } },
  });
  const bySlug = Object.fromEntries(seeded.map((p) => [p.slug, p]));

  const milestones = [
    {
      slug: "kufaze",
      title: "Diagnóstico inicial na incubadora",
      description: "Alinhamento do plano de Julho e identificação de prioridades de produto.",
      date: new Date("2026-07-16T13:00:00.000Z"),
      kind: "COACHING",
    },
    {
      slug: "kufaze",
      title: "Orientações técnicas da plataforma",
      description: "Revisão do estado do protótipo digital e próximos passos de validação.",
      date: new Date("2026-07-24T12:00:00.000Z"),
      kind: "PRODUTO",
    },
    {
      slug: "kufaze",
      title: "Apoio à legalização",
      description: "Orientações documentais; operação ainda condicionada ao desembolso.",
      date: new Date("2026-07-31T13:00:00.000Z"),
      kind: "LEGAL",
    },
    {
      slug: "yafika-delivery-market",
      title: "Diagnóstico e alinhamento da equipa",
      description: "Definição de papéis e prioridades de marketplace/delivery para Julho.",
      date: new Date("2026-07-16T13:00:00.000Z"),
      kind: "COACHING",
    },
    {
      slug: "yafika-delivery-market",
      title: "Working meeting sobre plataforma e fornecedores",
      description: "Estado da plataforma digital e negociação de fornecedores locais.",
      date: new Date("2026-07-24T12:00:00.000Z"),
      kind: "PRODUTO",
    },
    {
      slug: "yafika-delivery-market",
      title: "Preparação documental",
      description: "Acompanhamento da legalização e arquivo na incubadora.",
      date: new Date("2026-07-31T13:00:00.000Z"),
      kind: "LEGAL",
    },
    {
      slug: "reutilizacao-de-paletes",
      title: "Diagnóstico de produção e ambiente",
      description: "Levantamento do modelo de reutilização de paletes e requisitos ambientais.",
      date: new Date("2026-07-16T13:00:00.000Z"),
      kind: "COACHING",
    },
    {
      slug: "reutilizacao-de-paletes",
      title: "Orientações de licenciamento ambiental",
      description: "Esclarecimentos sobre licenciamento e evidências necessárias.",
      date: new Date("2026-07-24T12:00:00.000Z"),
      kind: "LEGAL",
    },
    {
      slug: "reutilizacao-de-paletes",
      title: "Evolução do protótipo de mobiliário",
      description: "Acompanhamento da maturidade do produto e próximos passos operacionais.",
      date: new Date("2026-07-31T13:00:00.000Z"),
      kind: "PRODUTO",
    },
  ];

  for (const m of milestones) {
    const project = bySlug[m.slug];
    if (!project) continue;
    const existing = await prisma.projectMilestone.findFirst({
      where: { projectId: project.id, title: m.title },
    });
    if (existing) continue;
    await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        title: m.title,
        description: m.description,
        date: m.date,
        kind: m.kind,
      },
    });
  }

  const gallerySeed = [
    { slug: "kufaze", url: "/images/projects/kufaze-cover.svg", title: "Identidade visual KuFaze" },
    { slug: "kufaze", url: "/images/placeholder-meeting.svg", title: "Sessão de coaching — Julho 2026" },
    {
      slug: "yafika-delivery-market",
      url: "/images/projects/yafika-cover.svg",
      title: "Identidade visual Yafika",
    },
    {
      slug: "yafika-delivery-market",
      url: "/images/placeholder-meeting.svg",
      title: "Working meeting — Julho 2026",
    },
    {
      slug: "reutilizacao-de-paletes",
      url: "/images/projects/paletes-cover.svg",
      title: "Linha de mobiliário em paletes",
    },
    {
      slug: "reutilizacao-de-paletes",
      url: "/images/placeholder-meeting.svg",
      title: "Acompanhamento ambiental — Julho 2026",
    },
  ];

  for (const g of gallerySeed) {
    const project = bySlug[g.slug];
    if (!project) continue;
    const existing = await prisma.projectMedia.findFirst({
      where: { projectId: project.id, url: g.url },
    });
    if (existing) continue;
    await prisma.projectMedia.create({
      data: {
        projectId: project.id,
        url: g.url,
        title: g.title,
        type: "IMAGE",
      },
    });
  }


  const calendarEvents = [
    {
      title: "Preparação institucional para a FACIM",
      slug: "facim-preparacao-2026",
      summary:
        "Preparação de logo, QR Code e demonstrações dos projectos incubados para a Feira Internacional de Maputo.",
      details:
        "Sessão de alinhamento com os incubados sobre materiais de exposição, identidade visual e demonstrações práticas a apresentar na FACIM.",
      category: "FEIRA",
      location: "Campus Ponta-Gêa, Beira",
      startsAt: new Date("2026-08-01T09:00:00.000Z"),
      endsAt: new Date("2026-08-01T12:00:00.000Z"),
      coverUrl: "/images/hero-campus.svg",
      published: true,
    },
    {
      title: "FACIM 2026 — Participação da Antena da Beira",
      slug: "facim-2026",
      summary:
        "Participação institucional e dos projectos incubados na Feira Internacional de Maputo.",
      details:
        "A IEUL — Antena da Beira marca presença na FACIM com stand institucional e demonstrações dos projectos KuFaze, Yafika e Reutilização de Paletes.",
      category: "FEIRA",
      location: "Maputo",
      startsAt: new Date("2026-08-25T09:00:00.000Z"),
      endsAt: new Date("2026-08-31T18:00:00.000Z"),
      coverUrl: "/images/hero-mozinkub.svg",
      published: true,
    },
    {
      title: "Exposição de mobiliário em paletes",
      slug: "exposicao-mobiliario-paletes-2026",
      summary: "Mostra de protótipos de mobiliário sustentável dos incubados.",
      details:
        "Exposição aberta à comunidade universitária e visitantes, com foco na economia circular e no projecto de reutilização de paletes.",
      category: "EXPOSICAO",
      location: "Campus Ponta-Gêa, Beira",
      startsAt: new Date("2026-09-12T10:00:00.000Z"),
      endsAt: new Date("2026-09-12T16:00:00.000Z"),
      coverUrl: "/images/projects/paletes-cover.svg",
      published: true,
    },
    {
      title: "Visita de acompanhamento MozInkub",
      slug: "visita-acompanhamento-mozinkub-jul-2025",
      summary: "Registo histórico — visita de acompanhamento da edição 2025.",
      details:
        "Visita técnica aos projectos da coorte 2025, com registo fotográfico e recomendações de follow-up.",
      category: "VISITA",
      location: "Beira",
      startsAt: new Date("2025-07-18T09:00:00.000Z"),
      endsAt: new Date("2025-07-18T13:00:00.000Z"),
      coverUrl: "/images/hero-actividades.svg",
      published: true,
    },
  ];

  for (const ev of calendarEvents) {
    const { coverUrl, ...rest } = ev;
    await prisma.event.upsert({
      where: { slug: ev.slug },
      update: rest,
      create: ev,
    });
  }

  await prisma.fundingCall.upsert({
    where: { slug: "concurso-mozinkub-n1-2026" },
    update: {
      title: "Concurso MozInkub N+1 — Candidaturas 2026",
      summary:
        "Edital de concurso para submissão de projectos à incubação na Antena da Beira (IEUL), no âmbito do MozInkub N+1.",
      description:
        "A Incubadora de Empresas da Universidade Licungo — Antena da Beira abre concurso para projectos nas áreas de Tecnologia Digital, Ambiente e Biodiversidade, Agricultura e sectores afins.\n\nOs candidatos devem submeter a proposta em PDF através desta plataforma até ao prazo indicado. A coordenação procederá à apreciação técnica e contactará as equipas seleccionadas.",
      eligibility:
        "Empreendedores individuais ou equipas com ligação à região centro; projectos em fase de ideia avançada, protótipo ou pré-operação.",
      areas: "Tecnologia Digital; Ambiente e Biodiversidade; Agricultura; Economia circular",
      status: "ABERTO",
      acceptApplications: true,
      published: true,
      deadline: new Date("2026-09-30T23:59:59.000Z"),
      opensAt: new Date("2026-07-01T00:00:00.000Z"),
      editionId: editionBySlug["mozinkub-n1-2026"]?.id ?? null,
    },
    create: {
      title: "Concurso MozInkub N+1 — Candidaturas 2026",
      slug: "concurso-mozinkub-n1-2026",
      summary:
        "Edital de concurso para submissão de projectos à incubação na Antena da Beira (IEUL), no âmbito do MozInkub N+1.",
      description:
        "A Incubadora de Empresas da Universidade Licungo — Antena da Beira abre concurso para projectos nas áreas de Tecnologia Digital, Ambiente e Biodiversidade, Agricultura e sectores afins.\n\nOs candidatos devem submeter a proposta em PDF através desta plataforma até ao prazo indicado. A coordenação procederá à apreciação técnica e contactará as equipas seleccionadas.",
      eligibility:
        "Empreendedores individuais ou equipas com ligação à região centro; projectos em fase de ideia avançada, protótipo ou pré-operação.",
      areas: "Tecnologia Digital; Ambiente e Biodiversidade; Agricultura; Economia circular",
      status: "ABERTO",
      acceptApplications: true,
      published: true,
      deadline: new Date("2026-09-30T23:59:59.000Z"),
      opensAt: new Date("2026-07-01T00:00:00.000Z"),
      editionId: editionBySlug["mozinkub-n1-2026"]?.id ?? null,
    },
  });

  await prisma.fundingCall.upsert({
    where: { slug: "apoio-mozinkub-n1" },
    update: {
      status: "ENCERRADO",
      acceptApplications: false,
      published: true,
      editionId: editionBySlug["mozinkub-n1-2025"]?.id ?? null,
      summary:
        "Linha de apoio financeiro aos projectos incubados (referência histórica). Consulte o concurso activo de 2026 para novas candidaturas.",
    },
    create: {
      title: "Apoio MozInkub N+1 — Desembolso a incubados",
      slug: "apoio-mozinkub-n1",
      summary:
        "Linha de apoio financeiro aos projectos incubados (referência histórica). Consulte o concurso activo de 2026 para novas candidaturas.",
      description: "Edital de referência da edição anterior.",
      deadline: new Date("2025-09-30T23:59:59.000Z"),
      status: "ENCERRADO",
      acceptApplications: false,
      published: true,
      editionId: editionBySlug["mozinkub-n1-2025"]?.id ?? null,
    },
  });

  const timeline = [
    {
      title: "Sessão de diagnóstico e orientações gerais",
      slug: "sessao-diagnostico-orientacoes-16-07-2026",
      description:
        "Arranque do acompanhamento mensal de Julho — Campus Ponta-Gêa (13h–14h).",
      details:
        "Sessão presencial de diagnóstico e orientações iniciais aos projectos incubados (KuFaze, Yafika Delivery-Market e Reutilização de Paletes). Objectivo: esclarecer boas práticas no âmbito do Projecto MozInkub e alinhar o plano de Julho 2026.",
      date: new Date("2026-07-16T13:00:00.000Z"),
      category: "COACHING",
      mediaUrl: "/images/placeholder-meeting.svg",
      mediaType: "IMAGE",
    },
    {
      title: "Working Meeting online — orientações técnicas",
      slug: "working-meeting-orientacoes-tecnicas-24-07-2026",
      description:
        "Sessão sobre plataformas digitais e reutilização de paletes (Google Meet, 12h–13h).",
      details:
        "Meeting online com participação do coach e incubados. Temas: estado das plataformas digitais (KuFaze e Yafika), negociação de fornecedor, licenciamento ambiental da reutilização de paletes e preparação de evidências de acompanhamento.",
      date: new Date("2026-07-24T12:00:00.000Z"),
      category: "COACHING",
      mediaUrl: "/images/placeholder-meeting.svg",
      mediaType: "IMAGE",
    },
    {
      title: "Legalização e evolução dos empreendimentos",
      slug: "legalizacao-evolucao-empreendimentos-31-07-2026",
      description:
        "Orientações sobre documentação, alvará e estado de evolução dos projectos.",
      details:
        "Sessão de diagnóstico e orientações gerais sobre legalização das empresas incubadas, arquivo documental na incubadora e próximos passos operacionais. Registo: até final de Julho nenhuma empresa estava legalizada/operacional devido à demora no desembolso.",
      date: new Date("2026-07-31T13:00:00.000Z"),
      category: "COACHING",
      mediaUrl: null,
      mediaType: null,
    },
  ];

  // Never wipe admin-managed content on re-seed (Vercel builds run seed every deploy).
  if ((await prisma.timelineItem.count()) === 0) {
    for (const item of timeline) {
      await prisma.timelineItem.create({ data: { ...item, published: true } });
    }
  }

  if ((await prisma.heroSlide.count()) === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
          title: "Campus da Ponta-Gêa, Beira — Moçambique",
          subtitle:
            "Antena da Beira da Incubadora de Empresas da Universidade Licungo (IEUL).",
          imageUrl: "/images/hero-campus.svg",
          linkUrl: "/#sobre",
          order: 1,
          published: true,
        },
        {
          title: "Projecto MozInkub N+1 em acção",
          subtitle:
            "Acompanhamento de start-ups nas áreas de Tecnologia Digital e Ambiente.",
          imageUrl: "/images/hero-mozinkub.svg",
          linkUrl: "/projectos",
          order: 2,
          published: true,
        },
        {
          title: "Actividades e evidências de Julho 2026",
          subtitle: "Coaching, reuniões e preparação institucional para a FACIM.",
          imageUrl: "/images/hero-actividades.svg",
          linkUrl: "/actividades",
          order: 3,
          published: true,
        },
      ],
    });
  }

  const album = await prisma.galleryAlbum.upsert({
    where: { slug: "julho-2026" },
    update: {
      title: "Actividades — Julho 2026",
      description: "Evidências de coaching e reuniões do mês de Julho.",
      published: true,
    },
    create: {
      title: "Actividades — Julho 2026",
      slug: "julho-2026",
      description: "Evidências de coaching e reuniões do mês de Julho.",
      published: true,
    },
  });

  const galleryCount = await prisma.galleryMedia.count({
    where: { albumId: album.id },
  });
  if (galleryCount === 0) {
    await prisma.galleryMedia.create({
      data: {
        albumId: album.id,
        title: "Ekapacita Working Meeting — 24/07/2026",
        description:
          "Sessão de trabalho e coaching com incubados — Campus Ponta-Gêa, Beira.",
        url: "/images/placeholder-meeting.svg",
        type: "IMAGE",
      },
    });
  }

  // Atribuições demo para testes de escopo RBAC
  const coach = await prisma.user.findUnique({ where: { email: "coach@ieul.ul.ac.mz" } });
  const gestor = await prisma.user.findUnique({ where: { email: "gestor@ieul.ul.ac.mz" } });
  const membro = await prisma.user.findUnique({ where: { email: "membro@ieul.ul.ac.mz" } });
  const avaliador = await prisma.user.findUnique({ where: { email: "avaliador@ieul.ul.ac.mz" } });
  const firstProject = await prisma.project.findFirst({ orderBy: { order: "asc" } });
  const secondProject = await prisma.project.findFirst({
    where: firstProject ? { id: { not: firstProject.id } } : undefined,
    orderBy: { order: "asc" },
  });

  if (firstProject && coach) {
    await prisma.projectCoach.upsert({
      where: {
        projectId_coachId: { projectId: firstProject.id, coachId: coach.id },
      },
      update: { status: "ACTIVE" },
      create: {
        projectId: firstProject.id,
        coachId: coach.id,
        status: "ACTIVE",
      },
    });
  }
  if (firstProject && gestor) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: firstProject.id, userId: gestor.id },
      },
      update: { roleInProject: "PROJECT_MANAGER" },
      create: {
        projectId: firstProject.id,
        userId: gestor.id,
        roleInProject: "PROJECT_MANAGER",
      },
    });
  }
  if (firstProject && membro) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: firstProject.id, userId: membro.id },
      },
      update: { roleInProject: "TEAM_MEMBER" },
      create: {
        projectId: firstProject.id,
        userId: membro.id,
        roleInProject: "TEAM_MEMBER",
      },
    });
  }
  if (avaliador && firstProject) {
    const existingEval = await prisma.evaluationAssignment.findFirst({
      where: { evaluatorId: avaliador.id, projectId: firstProject.id },
    });
    if (!existingEval) {
      await prisma.evaluationAssignment.create({
        data: {
          evaluatorId: avaliador.id,
          projectId: firstProject.id,
          status: "OPEN",
        },
      });
    }
  }

  console.log("Seed OK");
  console.log("  Coordenador: coordenacao@ieul.ul.ac.mz / ieul2026");
  console.log("  Demos (mesma password): admin@, secretaria@, coach@, gestor@, membro@, avaliador@ieul.ul.ac.mz");
  if (firstProject) console.log("  Projecto atribuído (coach/gestor/membro):", firstProject.slug);
  if (secondProject) console.log("  Projecto NÃO atribuído ao coach:", secondProject.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
