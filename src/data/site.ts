// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all site content.
// Facts are design-direction agnostic; presentation lives in components.
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: "Malin Malliya Wadu",
  shortName: "Malin",
  initials: "MM",
  role: "Senior Full-Stack Engineer & Technical Lead",
  location: "Wellington, New Zealand",
  locationShort: "Wellington, NZ",
  timezone: "Pacific/Auckland (UTC+12)",
  domain: "malin.nz",
  yearsExperience: "15+",
  available: true,
  availabilityLabel: "Available for contract work",
  tagline:
    "I architect and ship scalable software for banks, government, and high-traffic marketplaces - and the platforms feeding communities across Aotearoa.",
  summary:
    "Senior technical leader with 15+ years architecting and delivering scalable software across the full stack. Deep, hands-on expertise in C#/.NET, TypeScript and React, paired with a track record of defining architecture, setting engineering standards, and leading high-performing teams in regulated, high-growth environments.",
  email: "malin.malliya.wadu@gmail.com",
  phone: "021 209 5657",
  cv: "/cv/Malin_CV.pdf",
  socials: {
    linkedin: "https://www.linkedin.com/in/malin-malliya-wadu-94956522/",
    github: "https://github.com/malinmalliyawadu",
    credly: "https://www.credly.com/users/malin-malliya-wadu",
  },
} as const;

// Service-oriented capabilities - what a client actually buys.
export const capabilities = [
  {
    id: "architecture",
    title: "Architecture & Cloud",
    blurb:
      "Designing scalable, secure systems on AWS and Azure - from open-banking APIs in regulated environments to data pipelines for the national census.",
    points: ["AWS / Azure", "API & system design", "Open banking · regulated", "Terraform / IaC"],
  },
  {
    id: "fullstack",
    title: "Full-Stack Product",
    blurb:
      "Building polished, accessible products end to end - React/Next.js front ends on .NET and Node back ends, shipped to web and native mobile.",
    points: ["React / Next.js", "C#/.NET · Node", "Native iOS & Android", "Design systems"],
  },
  {
    id: "delivery",
    title: "DevOps & Delivery",
    blurb:
      "Standing up CI/CD, containers and observability so teams ship with confidence - Kubernetes, ArgoCD, GitHub Actions, continuous delivery.",
    points: ["CI/CD pipelines", "Kubernetes / Docker", "ArgoCD · Helm", "Observability"],
  },
  {
    id: "leadership",
    title: "Technical Leadership",
    blurb:
      "Leading architecture, raising the engineering bar, and mentoring teams across onshore and offshore - without ever leaving the code.",
    points: ["Tech lead / architect", "Mentoring & standards", "Cross-team delivery", "R&D / prototyping"],
  },
] as const;

// Flagship work - proof, with real metrics.
export const projects = [
  {
    title: "Everybody Eats - Volunteer Portal",
    tag: "Charity · Web + Native Apps",
    year: "2024 - now",
    description:
      "Coordinates volunteer shifts across multiple kitchen locations for a charity rescuing surplus food to serve free restaurant-quality meals. Tracks achievements with a gamified badge-and-leaderboard system that drives engagement and retention. Shipped to web and as native iOS and Android apps.",
    image: "/screenshots/everybody-eats-hero.webp",
    imageW: 1600,
    imageH: 1200,
    phoneImage: "/screenshots/everybody-eats-app.webp",
    phoneImageW: 640,
    phoneImageH: 1391,
    phoneImageAlt: "Everybody Eats volunteer app - open shifts and What's-happening feed",
    github: "https://github.com/everybody-eats-nz/volunteer-portal",
    demo: "https://volunteers.everybodyeats.nz",
    appStore: "https://apps.apple.com/nz/app/everybody-eats-nz/id6760931588",
    playStore: "https://play.google.com/store/apps/details?id=com.everybodyeats.app",
    stack: ["Next.js", "React", "TypeScript", "Prisma", "Postgres", "Expo"],
    stats: [
      { label: "Volunteers", value: "10K+" },
      { label: "Monthly Active Users", value: "4.6K" },
    ],
  },
  {
    title: "Everybody Eats - Website",
    tag: "Charity · Marketing + CMS",
    year: "2025 - now",
    description:
      "The public-facing site for the NZ charity behind a network of pay-as-you-feel restaurants. Migrated off Webflow onto a fully open-source stack - Payload CMS with a Next.js front end - cutting subscription cost and giving the team total control across dining, fundraising, volunteering, impact reporting and events.",
    image: "/screenshots/everybody-eats-website.webp",
    imageW: 1600,
    imageH: 1000,
    github: "https://github.com/everybody-eats-nz/marketing-cms",
    demo: "https://everybodyeats.nz",
    stack: ["Next.js", "Payload CMS", "TypeScript", "Tailwind"],
    stats: [
      { label: "Monthly Visitors", value: "7K+" },
      { label: "Monthly Page Views", value: "22K+" },
    ],
  },
  {
    title: "Fair Food - Volunteer Portal",
    tag: "Charity · Accessibility-first",
    year: "2024 - now",
    description:
      "Built for an Auckland charity that has rescued 4.7M+ kilos of surplus food since 2011. Replaced SignUpGenius with a purpose-built platform coordinating volunteers across three programmes, with accessibility-first shift booking and bilingual English / te reo Māori content.",
    image: "/screenshots/fairfood.webp",
    imageW: 1440,
    imageH: 900,
    github: "https://github.com/fairfoodnz/fairfood-volunteer",
    demo: "https://volunteer.fairfood.org.nz/",
    stack: ["Next.js", "React", "Prisma", "Postgres", "Tailwind", "Playwright"],
    stats: [
      { label: "Active Volunteers", value: "600+" },
      { label: "Monthly Page Views", value: "9.7K" },
    ],
  },
  {
    title: "Compassion Soup Kitchen - Volunteer App",
    tag: "Charity · In progress",
    year: "2025 - now",
    wip: true,
    description:
      "A volunteer management app helping a kitchen serving the community for 125+ years coordinate meal-service shifts - simplifying sign-ups, tracking attendance, and keeping service running smoothly.",
    image: "/screenshots/compassion-volunteer-app.webp",
    imageW: 1280,
    imageH: 720,
    github: "https://github.com/compassion-soup-kitchen/volunteer-app",
    demo: "https://compassion.awhinatech.nz/",
    stack: ["Next.js", "React", "TypeScript"],
    stats: [{ label: "Serving the community", value: "125+ yrs" }],
  },
] as const;

// Career timeline - most recent first.
export const experience = [
  {
    id: "exp-statsnz",
    company: "Stats NZ",
    role: "Independent Contractor",
    period: "Mar 2026 - Present",
    current: true,
    description:
      "Building data pipelines for the New Zealand Census programme across Azure, Salesforce and .NET - leveraging Azure Function Apps and related services to deliver scalable, reliable data-processing infrastructure.",
    tech: ["Azure", "Azure Functions", "Salesforce", ".NET", "Data Pipelines"],
    logo: "/logos/statsnz.svg",
    logoBg: true,
  },
  {
    id: "exp-anz",
    company: "ANZ Bank",
    role: "Independent Contractor",
    period: "Aug 2025 - Mar 2026",
    description:
      "Led architecture and development of open-banking statement-retrieval services - defining technical approach and integration patterns, coordinating delivery across onshore NZ and offshore teams, and designing scalable, secure APIs in a regulated banking environment.",
    tech: ["Node.js", "API Architecture", "Open Banking", "OpenShift", "CI/CD"],
    logo: "/logos/anz.svg",
  },
  {
    id: "exp-partstrader",
    company: "PartsTrader Markets",
    role: "Technical Lead",
    period: "Oct 2022 - Jul 2025",
    description:
      "Led supplier-side architecture and delivery for the largest automotive-parts marketplace in the US. Architected full-stack solutions across React microfrontends, Node services and .NET back ends; defined standards; and mentored a cross-functional team.",
    tech: ["TypeScript", "React", "Node.js", "Fastify", "MySQL", "AWS", ".NET", "Microfrontends"],
    logo: "/logos/partstrader.svg",
  },
  {
    id: "exp-openpoly",
    company: "Open Polytechnic",
    role: "Independent Contractor",
    period: "Sep 2021 - Mar 2022",
    description:
      "Defined and implemented the organisation's first CI/CD pipeline and architected a migration from a legacy monolith to microservices on Azure - establishing automated code-quality and security standards.",
    tech: ["CI/CD", "Microservices", "Azure", ".NET", "SQL Server"],
    logo: "/logos/open-polytechnic.jpeg",
    border: true,
  },
  {
    id: "exp-kiwiwealth",
    company: "Kiwi Wealth",
    role: "Independent Contractor",
    period: "Mar 2019 - Aug 2020",
    description:
      "Led greenfield development of a customer-facing portal end to end. Built a shared React component library, drove adoption of MuleSoft API architecture, and implemented analytics and A/B testing that measurably improved conversion.",
    tech: ["React", "API Architecture", "Analytics", ".NET", "SQL Server"],
    logo: "/logos/kiwiwealth.svg",
  },
  {
    id: "exp-trademe",
    company: "Trade Me",
    role: "Developer → Lead Developer",
    period: "Oct 2011 - Mar 2019",
    description:
      "Grew from graduate to lead at New Zealand's largest online marketplace, contributing across Travel, Marketplace, Property and Jobs. Led technology for Trade Me Insurance and LifeDirect, directing the migration from on-premises to AWS and building a high-performing delivery team.",
    tech: ["AWS", ".NET", "SQL Server", "JavaScript", "Leadership"],
    logo: "/logos/trademe.png",
  },
] as const;

export const certifications = [
  {
    title: "AWS Solutions Architect - Professional",
    short: "Solutions Architect Pro",
    issuer: "Amazon Web Services",
    issueDate: "2023-01-14",
    expiryDate: "2026-01-14",
    image: "/certifications/sap.png",
    link: "https://www.credly.com/badges/7d90659b-4f2e-46f1-9616-40fbc0bce569",
  },
  {
    title: "AWS DevOps Engineer - Professional",
    short: "DevOps Engineer Pro",
    issuer: "Amazon Web Services",
    issueDate: "2022-11-19",
    expiryDate: "2025-11-19",
    image: "/certifications/devops.png",
    link: "https://www.credly.com/badges/36109172-3c10-469c-9894-50153247b5c7",
  },
  {
    title: "AWS Solutions Architect - Associate",
    short: "Solutions Architect Assoc.",
    issuer: "Amazon Web Services",
    issueDate: "2022-10-11",
    expiryDate: "2026-01-14",
    image: "/certifications/saa.png",
    link: "https://www.credly.com/badges/9700f122-9d55-4122-902d-58dec6b50f52",
  },
  {
    title: "AWS Developer - Associate",
    short: "Developer Associate",
    issuer: "Amazon Web Services",
    issueDate: "2022-09-05",
    expiryDate: "2026-11-19",
    image: "/certifications/da.png",
    link: "https://www.credly.com/badges/18c062c0-ced2-40ff-b39f-c714e807ec22",
  },
] as const;

// Tech stack, grouped. Icons live in /public/icons.
export const techStack = [
  {
    name: "Frontend",
    skills: [
      ["React", "/icons/react.svg"],
      ["TypeScript", "/icons/typescript.svg"],
      ["Next.js", "/icons/nextjs.svg"],
      ["Tailwind CSS", "/icons/tailwindcss.svg"],
      ["shadcn/ui", "/icons/shadcn.svg"],
      ["TanStack Query", "/icons/react-query.svg"],
      ["single-spa", "/icons/single-spa.svg"],
      ["Astro", "/icons/astro.svg"],
      ["Sass", "/icons/sass.svg"],
      ["tRPC", "/icons/trpc.svg"],
      ["Zod", "/icons/zod.svg"],
      ["Zustand", "/icons/zustand.svg"],
      ["Storybook", "/icons/storybook.svg"],
      ["Vite", "/icons/vite.svg"],
    ],
  },
  {
    name: "Backend",
    skills: [
      [".NET", "/icons/dotnetcore.svg"],
      ["C#", "/icons/csharp.svg"],
      ["Node.js", "/icons/nodejs.svg"],
      ["Fastify", "/icons/fastify.svg"],
      ["SQL Server", "/icons/sqlserver.svg"],
      ["PostgreSQL", "/icons/postgresql.svg"],
      ["MySQL", "/icons/mysql.svg"],
      ["Prisma", "/icons/prisma.svg"],
      ["RabbitMQ", "/icons/rabbitmq.svg"],
      ["Redis", "/icons/redis.svg"],
      ["OpenAPI", "/icons/openapi.svg"],
    ],
  },
  {
    name: "Cloud & DevOps",
    skills: [
      ["AWS", "/icons/aws.svg"],
      ["Azure", "/icons/azure.svg"],
      ["Terraform", "/icons/terraform.svg"],
      ["Docker", "/icons/docker.svg"],
      ["Kubernetes", "/icons/kubernetes.svg"],
      ["ArgoCD", "/icons/argocd.svg"],
      ["Helm", "/icons/helm.svg"],
      ["OpenShift", "/icons/openshift.svg"],
      ["GitHub Actions", "/icons/githubactions.svg"],
      ["TeamCity", "/icons/teamcity.svg"],
      ["Octopus Deploy", "/icons/octopusdeploy.svg"],
      ["Nx", "/icons/nx.svg"],
      ["New Relic", "/icons/new-relic.svg"],
      ["LaunchDarkly", "/icons/launchdarkly.svg"],
    ],
  },
  {
    name: "Testing & Mobile",
    skills: [
      ["Playwright", "/icons/playwright.svg"],
      ["Cypress", "/icons/cypress.svg"],
      ["Jest", "/icons/jest.svg"],
      ["Vitest", "/icons/vitest.svg"],
      ["Percy", "/icons/percy.svg"],
      ["MSW", "/icons/msw.svg"],
      ["Expo", "/icons/expo.svg"],
    ],
  },
] as const;
