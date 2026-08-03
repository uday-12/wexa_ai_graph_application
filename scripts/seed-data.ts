import { faker } from "@faker-js/faker";

faker.seed(42); // reproducible dataset across runs

export interface PersonRow {
  id: string;
  name: string;
  title: string;
  email: string;
  bio: string;
  seniority: number; // 1-10, internal only, used to build believable mentorship
  teamIndex: number;
}
export interface TeamRow {
  id: string;
  name: string;
}
export interface SkillRow {
  id: string;
  name: string;
  category: string;
}
export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed";
  teamIndex: number;
}
export interface MemberOfRow {
  personId: string;
  teamId: string;
}
export interface HasSkillRow {
  personId: string;
  skillId: string;
  level: number;
  years: number;
}
export interface WorksOnRow {
  personId: string;
  projectId: string;
  role: string;
  since: string;
}
export interface RequiresSkillRow {
  projectId: string;
  skillId: string;
  priority: "must-have" | "nice-to-have";
}
export interface OwnedByRow {
  projectId: string;
  teamId: string;
}
export interface MentorsRow {
  mentorId: string;
  menteeId: string;
}

const TEAM_NAMES = [
  "Platform Engineering",
  "Growth",
  "Data & ML",
  "Product Design",
  "Mobile",
  "Infrastructure",
  "Security",
  "Product Management",
];

const SKILL_CATALOG: Record<string, string[]> = {
  Frontend: ["React", "TypeScript", "Next.js", "CSS & Tailwind", "Vue.js"],
  Backend: ["Node.js", "Python", "Go", "Java", "PostgreSQL"],
  Data: ["SQL", "Apache Spark", "Airflow", "dbt", "Snowflake"],
  "Machine Learning": ["PyTorch", "TensorFlow", "NLP", "Computer Vision", "MLOps"],
  Design: ["Figma", "UX Research", "Design Systems", "Prototyping", "Accessibility"],
  DevOps: ["Kubernetes", "Terraform", "AWS", "CI/CD Pipelines", "Docker"],
  Security: ["Threat Modeling", "Penetration Testing", "IAM", "Cryptography", "Incident Response"],
  Product: ["Roadmapping", "User Research", "A/B Testing", "Product Analytics", "Stakeholder Management"],
  Mobile: ["iOS / Swift", "Android / Kotlin", "React Native", "Flutter", "Mobile CI/CD"],
};

// Which skill categories a title mostly draws from (first = primary, rest = secondary/stretch).
const TITLES_BY_TEAM: Record<string, Array<{ title: string; categories: string[] }>> = {
  "Platform Engineering": [
    { title: "Backend Engineer", categories: ["Backend", "Data"] },
    { title: "Staff Backend Engineer", categories: ["Backend", "DevOps"] },
    { title: "DevOps Engineer", categories: ["DevOps", "Backend"] },
  ],
  Growth: [
    { title: "Frontend Engineer", categories: ["Frontend", "Product"] },
    { title: "Growth Product Manager", categories: ["Product", "Data"] },
    { title: "Data Analyst", categories: ["Data", "Product"] },
  ],
  "Data & ML": [
    { title: "Data Engineer", categories: ["Data", "Backend"] },
    { title: "ML Engineer", categories: ["Machine Learning", "Data"] },
    { title: "Data Scientist", categories: ["Machine Learning", "Data"] },
  ],
  "Product Design": [
    { title: "Product Designer", categories: ["Design", "Product"] },
    { title: "Senior Product Designer", categories: ["Design", "Product"] },
    { title: "UX Researcher", categories: ["Design", "Product"] },
  ],
  Mobile: [
    { title: "iOS Engineer", categories: ["Mobile", "Frontend"] },
    { title: "Android Engineer", categories: ["Mobile", "Frontend"] },
    { title: "Mobile Engineer", categories: ["Mobile", "Frontend"] },
  ],
  Infrastructure: [
    { title: "Site Reliability Engineer", categories: ["DevOps", "Backend"] },
    { title: "Infrastructure Engineer", categories: ["DevOps", "Security"] },
  ],
  Security: [
    { title: "Security Engineer", categories: ["Security", "DevOps"] },
    { title: "Security Analyst", categories: ["Security", "Data"] },
  ],
  "Product Management": [
    { title: "Product Manager", categories: ["Product", "Design"] },
    { title: "Senior Product Manager", categories: ["Product", "Data"] },
  ],
};

const TEAM_SIZES = [10, 6, 8, 6, 6, 7, 6, 6]; // sums to 55; a few extra sprinkled below

function slug(prefix: string, i: number) {
  return `${prefix}-${i.toString().padStart(3, "0")}`;
}

export function generateTeams(): TeamRow[] {
  return TEAM_NAMES.map((name, i) => ({ id: slug("team", i), name }));
}

export function generateSkills(): SkillRow[] {
  const rows: SkillRow[] = [];
  let i = 0;
  for (const [category, names] of Object.entries(SKILL_CATALOG)) {
    for (const name of names) {
      rows.push({ id: slug("skill", i), name, category });
      i++;
    }
  }
  return rows;
}

export function generatePeople(teams: TeamRow[]): PersonRow[] {
  const people: PersonRow[] = [];
  let idx = 0;
  const extra = 5; // spread a few bonus people across random teams for a rounder total
  teams.forEach((team, teamIndex) => {
    const size = TEAM_SIZES[teamIndex] + (teamIndex < extra ? 1 : 0);
    const titleOptions = TITLES_BY_TEAM[team.name];
    for (let i = 0; i < size; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = `${firstName} ${lastName}`;
      const { title } = faker.helpers.arrayElement(titleOptions);
      const yearsExp = faker.number.int({ min: 1, max: 15 });
      people.push({
        id: slug("person", idx),
        name,
        title,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        bio: `${title} with ${yearsExp} year${yearsExp === 1 ? "" : "s"} of experience, currently on ${team.name}. Focused on ${faker.company.buzzPhrase().toLowerCase()}.`,
        seniority: faker.number.int({ min: 1, max: 10 }),
        teamIndex,
      });
      idx++;
    }
  });
  return people;
}

export function generateProjects(teams: TeamRow[]): ProjectRow[] {
  const adjectives = [
    "Aurora",
    "Nimbus",
    "Beacon",
    "Cascade",
    "Horizon",
    "Compass",
    "Ember",
    "Lattice",
    "Meridian",
    "Orbit",
    "Prism",
    "Summit",
    "Vertex",
    "Zephyr",
    "Anchor",
    "Catalyst",
    "Drift",
    "Forge",
    "Harbor",
    "Ripple",
    "Signal",
    "Tandem",
    "Wayfinder",
    "Keystone",
    "Northstar",
  ];
  const nouns = [
    "Checkout",
    "Onboarding",
    "Insights",
    "Search",
    "Payments",
    "Recommender",
    "Notifications",
    "Analytics Suite",
    "Mobile App",
    "Growth Experiments",
    "Data Platform",
    "Identity",
    "Marketplace",
    "Billing",
    "Support Portal",
    "Design System",
    "API Gateway",
    "Fraud Detection",
    "Personalization",
    "Reporting",
    "Migration",
    "Localization",
    "Trust & Safety",
    "Internal Tools",
    "Performance Overhaul",
  ];
  const statuses: ProjectRow["status"][] = ["planning", "active", "active", "active", "completed"];

  return adjectives.map((adj, i) => ({
    id: slug("project", i),
    name: `${adj} ${nouns[i]}`,
    description: faker.company.catchPhrase(),
    status: faker.helpers.arrayElement(statuses),
    teamIndex: faker.number.int({ min: 0, max: teams.length - 1 }),
  }));
}

export interface GraphSeed {
  teams: TeamRow[];
  skills: SkillRow[];
  people: PersonRow[];
  projects: ProjectRow[];
  memberOf: MemberOfRow[];
  hasSkill: HasSkillRow[];
  worksOn: WorksOnRow[];
  requiresSkill: RequiresSkillRow[];
  ownedBy: OwnedByRow[];
  mentors: MentorsRow[];
}

export function generateGraph(): GraphSeed {
  const teams = generateTeams();
  const skills = generateSkills();
  const people = generatePeople(teams);
  const projects = generateProjects(teams);

  const skillsByCategory = new Map<string, SkillRow[]>();
  for (const s of skills) {
    if (!skillsByCategory.has(s.category)) skillsByCategory.set(s.category, []);
    skillsByCategory.get(s.category)!.push(s);
  }
  const categories = Object.keys(SKILL_CATALOG);

  const memberOf: MemberOfRow[] = people.map((p) => ({ personId: p.id, teamId: teams[p.teamIndex].id }));

  // Each person gets 3-6 skills: mostly from their title's primary/secondary categories,
  // plus an occasional wildcard from an unrelated category (keeps the org realistically diverse).
  const hasSkill: HasSkillRow[] = [];
  for (const person of people) {
    const titleInfo = TITLES_BY_TEAM[teams[person.teamIndex].name].find((t) => t.title === person.title)!;
    const pool = [
      ...titleInfo.categories.flatMap((c) => skillsByCategory.get(c) ?? []),
    ];
    const wildcardCategory = faker.helpers.arrayElement(categories);
    const wildcardPool = skillsByCategory.get(wildcardCategory) ?? [];
    const count = faker.number.int({ min: 3, max: 6 });
    const chosen = faker.helpers.arrayElements(pool, Math.min(count, pool.length));
    const chosenIds = new Set(chosen.map((s) => s.id));
    if (wildcardPool.length && faker.number.int({ min: 1, max: 100 }) <= 35) {
      const w = faker.helpers.arrayElement(wildcardPool);
      chosenIds.add(w.id);
    }
    for (const skillId of chosenIds) {
      hasSkill.push({
        personId: person.id,
        skillId,
        level: faker.number.int({ min: 1, max: 5 }),
        years: faker.number.int({ min: 0, max: 8 }),
      });
    }
  }

  const ownedBy: OwnedByRow[] = projects.map((p) => ({ projectId: p.id, teamId: teams[p.teamIndex].id }));

  // Required skills per project: primarily from the owning team's usual categories, plus 1-2 stretch
  // skills from elsewhere in the org -- these are the ones most likely to produce a genuine gap.
  const requiresSkill: RequiresSkillRow[] = [];
  for (const project of projects) {
    const teamName = teams[project.teamIndex].name;
    const teamCategories = new Set(TITLES_BY_TEAM[teamName].flatMap((t) => t.categories));
    const homePool = [...teamCategories].flatMap((c) => skillsByCategory.get(c) ?? []);
    const mustHaves = faker.helpers.arrayElements(homePool, Math.min(3, homePool.length));
    const stretchCategory = faker.helpers.arrayElement(categories.filter((c) => !teamCategories.has(c)));
    const stretchPool = skillsByCategory.get(stretchCategory) ?? [];
    const niceToHaves = faker.helpers.arrayElements(stretchPool, Math.min(2, stretchPool.length));

    const seen = new Set<string>();
    for (const s of mustHaves) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      requiresSkill.push({ projectId: project.id, skillId: s.id, priority: "must-have" });
    }
    for (const s of niceToHaves) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      requiresSkill.push({ projectId: project.id, skillId: s.id, priority: "nice-to-have" });
    }
  }

  // Staffing: 2-6 people per project, mostly from the owning team, with roughly 1 in 6 projects
  // pulling in someone from a different team entirely -- these people become the graph's bridges.
  const roles = ["Contributor", "Tech Lead", "Reviewer", "Consultant"];
  const worksOn: WorksOnRow[] = [];
  const peopleByTeam = new Map<number, PersonRow[]>();
  people.forEach((p) => {
    if (!peopleByTeam.has(p.teamIndex)) peopleByTeam.set(p.teamIndex, []);
    peopleByTeam.get(p.teamIndex)!.push(p);
  });

  for (const project of projects) {
    const homeTeamPeople = peopleByTeam.get(project.teamIndex) ?? [];
    const staffCount = faker.number.int({ min: 2, max: Math.min(6, homeTeamPeople.length) });
    const staff = faker.helpers.arrayElements(homeTeamPeople, staffCount);
    for (const person of staff) {
      worksOn.push({
        personId: person.id,
        projectId: project.id,
        role: faker.helpers.arrayElement(roles),
        since: faker.date.past({ years: 2 }).toISOString().slice(0, 10),
      });
    }
    if (faker.number.int({ min: 1, max: 6 }) === 1) {
      const otherTeamIndex = faker.number.int({ min: 0, max: teams.length - 1 });
      if (otherTeamIndex !== project.teamIndex) {
        const otherPool = peopleByTeam.get(otherTeamIndex) ?? [];
        if (otherPool.length) {
          const bridgePerson = faker.helpers.arrayElement(otherPool);
          worksOn.push({
            personId: bridgePerson.id,
            projectId: project.id,
            role: "Consultant",
            since: faker.date.past({ years: 1 }).toISOString().slice(0, 10),
          });
        }
      }
    }
  }

  // Mentorship: within-team pairs where seniority gap is meaningful, capped so no one mentors too many.
  const mentors: MentorsRow[] = [];
  const menteeCount = new Map<string, number>();
  const mentorCount = new Map<string, number>();
  for (const [, teamPeople] of peopleByTeam) {
    const sorted = [...teamPeople].sort((a, b) => b.seniority - a.seniority);
    for (const mentee of sorted) {
      if ((menteeCount.get(mentee.id) ?? 0) > 0) continue;
      const candidateMentors = sorted.filter(
        (m) => m.id !== mentee.id && m.seniority - mentee.seniority >= 3 && (mentorCount.get(m.id) ?? 0) < 3
      );
      if (candidateMentors.length && faker.number.int({ min: 1, max: 100 }) <= 55) {
        const mentor = faker.helpers.arrayElement(candidateMentors);
        mentors.push({ mentorId: mentor.id, menteeId: mentee.id });
        menteeCount.set(mentee.id, 1);
        mentorCount.set(mentor.id, (mentorCount.get(mentor.id) ?? 0) + 1);
      }
    }
  }

  // One deliberate cross-team mentorship chain so the "connect two people" shortest-path demo
  // always has a rich, non-obvious multi-hop example available even without shared project work.
  const chainPeople = [people[0], people[15], people[28], people[40]].filter(Boolean);
  for (let i = 0; i < chainPeople.length - 1; i++) {
    const mentorId = chainPeople[i].id;
    const menteeId = chainPeople[i + 1].id;
    if (!mentors.some((m) => m.mentorId === mentorId && m.menteeId === menteeId)) {
      mentors.push({ mentorId, menteeId });
    }
  }

  return { teams, skills, people, projects, memberOf, hasSkill, worksOn, requiresSkill, ownedBy, mentors };
}
