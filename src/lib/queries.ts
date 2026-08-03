import type { Node as Neo4jNode, Path } from "neo4j-driver";
import { runRead, nodeProps } from "./neo4j";
import type {
  Person,
  PersonWithTeam,
  Team,
  Skill,
  Project,
  PersonSkill,
  ProjectRequiredSkill,
  Collaborator,
  SkillGap,
  BridgePerson,
  GraphNode,
  GraphLink,
  GraphData,
  OrgStats,
} from "./types";

const toPerson = (n: Neo4jNode): Person => nodeProps<Person>(n);
const toTeam = (n: Neo4jNode): Team => nodeProps<Team>(n);
const toSkill = (n: Neo4jNode): Skill => nodeProps<Skill>(n);
const toProject = (n: Neo4jNode): Project => nodeProps<Project>(n);

function labelOf(n: Neo4jNode): string {
  return n.labels[0];
}

function personNode(n: Neo4jNode): GraphNode {
  const p = toPerson(n);
  return { id: p.id, type: "Person", label: p.name, sub: p.title };
}
function teamNode(n: Neo4jNode): GraphNode {
  const t = toTeam(n);
  return { id: t.id, type: "Team", label: t.name };
}
function skillNode(n: Neo4jNode): GraphNode {
  const s = toSkill(n);
  return { id: s.id, type: "Skill", label: s.name, sub: s.category };
}
function projectNode(n: Neo4jNode): GraphNode {
  const pr = toProject(n);
  return { id: pr.id, type: "Project", label: pr.name, sub: pr.status };
}
function anyNode(n: Neo4jNode): GraphNode {
  switch (labelOf(n)) {
    case "Person":
      return personNode(n);
    case "Team":
      return teamNode(n);
    case "Skill":
      return skillNode(n);
    case "Project":
      return projectNode(n);
    default:
      return { id: n.properties.id as string, type: "Person", label: String(n.properties.name ?? "?") };
  }
}

// ---------- Dashboard ----------

export async function getOrgStats(): Promise<OrgStats> {
  const [[people], [teams], [skills], [projects]] = await Promise.all([
    runRead<{ c: number }>("MATCH (p:Person) RETURN count(p) AS c"),
    runRead<{ c: number }>("MATCH (t:Team) RETURN count(t) AS c"),
    runRead<{ c: number }>("MATCH (s:Skill) RETURN count(s) AS c"),
    runRead<{ c: number }>("MATCH (pr:Project) RETURN count(pr) AS c"),
  ]);
  return { people: people.c, teams: teams.c, skills: skills.c, projects: projects.c };
}

export async function searchAll(
  term: string
): Promise<Array<{ id: string; label: string; type: "Person" | "Project" | "Skill" }>> {
  const cypher = `
    MATCH (p:Person) WHERE toLower(p.name) CONTAINS toLower($term)
    RETURN p.id AS id, p.name AS label, 'Person' AS type LIMIT 5
    UNION
    MATCH (pr:Project) WHERE toLower(pr.name) CONTAINS toLower($term)
    RETURN pr.id AS id, pr.name AS label, 'Project' AS type LIMIT 5
    UNION
    MATCH (s:Skill) WHERE toLower(s.name) CONTAINS toLower($term)
    RETURN s.id AS id, s.name AS label, 'Skill' AS type LIMIT 5
  `;
  return runRead(cypher, { term });
}

export async function listTeams(): Promise<Team[]> {
  const rows = await runRead<{ t: Neo4jNode }>("MATCH (t:Team) RETURN t ORDER BY t.name");
  return rows.map((r) => toTeam(r.t));
}

export async function listSkills(): Promise<Skill[]> {
  const rows = await runRead<{ s: Neo4jNode }>("MATCH (s:Skill) RETURN s ORDER BY s.category, s.name");
  return rows.map((r) => toSkill(r.s));
}

// ---------- People ----------

export async function listPeople(params: {
  search?: string;
  teamId?: string;
  skillId?: string;
}): Promise<PersonWithTeam[]> {
  const cypher = `
    MATCH (p:Person)
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    WITH p, t
    WHERE ($search IS NULL OR toLower(p.name) CONTAINS toLower($search))
      AND ($teamId IS NULL OR t.id = $teamId)
      AND ($skillId IS NULL OR (p)-[:HAS_SKILL]->(:Skill {id: $skillId}))
    RETURN p, t
    ORDER BY p.name
    LIMIT 200
  `;
  const rows = await runRead<{ p: Neo4jNode; t: Neo4jNode | null }>(cypher, {
    search: params.search ?? null,
    teamId: params.teamId ?? null,
    skillId: params.skillId ?? null,
  });
  return rows.map((r) => ({ ...toPerson(r.p), team: r.t ? toTeam(r.t) : null }));
}

export async function getPerson(id: string): Promise<PersonWithTeam | null> {
  const rows = await runRead<{ p: Neo4jNode; t: Neo4jNode | null }>(
    `MATCH (p:Person {id: $id}) OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team) RETURN p, t`,
    { id }
  );
  if (rows.length === 0) return null;
  return { ...toPerson(rows[0].p), team: rows[0].t ? toTeam(rows[0].t) : null };
}

export async function getPersonSkills(id: string): Promise<PersonSkill[]> {
  const rows = await runRead<{ s: Neo4jNode; level: number; years: number }>(
    `MATCH (p:Person {id: $id})-[hs:HAS_SKILL]->(s:Skill)
     RETURN s, hs.level AS level, hs.years AS years
     ORDER BY hs.level DESC, s.name`,
    { id }
  );
  return rows.map((r) => ({ ...toSkill(r.s), level: r.level, years: r.years }));
}

export async function getPersonProjects(
  id: string
): Promise<Array<Project & { role: string; since: string }>> {
  const rows = await runRead<{ pr: Neo4jNode; role: string; since: string }>(
    `MATCH (p:Person {id: $id})-[w:WORKS_ON]->(pr:Project)
     RETURN pr, w.role AS role, w.since AS since
     ORDER BY w.since DESC`,
    { id }
  );
  return rows.map((r) => ({ ...toProject(r.pr), role: r.role, since: r.since }));
}

export async function getMentorship(
  id: string
): Promise<{ mentors: Person[]; mentees: Person[] }> {
  const rows = await runRead<{ mentor: Neo4jNode | null; mentee: Neo4jNode | null }>(
    `OPTIONAL MATCH (mentor:Person)-[:MENTORS]->(p:Person {id: $id})
     OPTIONAL MATCH (p2:Person {id: $id})-[:MENTORS]->(mentee:Person)
     RETURN mentor, mentee`,
    { id }
  );
  const mentors = new Map<string, Person>();
  const mentees = new Map<string, Person>();
  for (const r of rows) {
    if (r.mentor) {
      const m = toPerson(r.mentor);
      mentors.set(m.id, m);
    }
    if (r.mentee) {
      const m = toPerson(r.mentee);
      mentees.set(m.id, m);
    }
  }
  return { mentors: [...mentors.values()], mentees: [...mentees.values()] };
}

// Collaborator neighborhood: people who share a project with `id`, ranked by overlap strength.
export async function getCollaborators(id: string): Promise<Collaborator[]> {
  const cypher = `
    MATCH (me:Person {id: $id})-[:WORKS_ON]->(proj:Project)<-[:WORKS_ON]-(collab:Person)
    WHERE collab.id <> $id
    RETURN collab, collect(DISTINCT proj.name) AS sharedProjects, count(DISTINCT proj) AS strength
    ORDER BY strength DESC
    LIMIT 25
  `;
  const rows = await runRead<{ collab: Neo4jNode; sharedProjects: string[]; strength: number }>(cypher, {
    id,
  });
  return rows.map((r) => ({ ...toPerson(r.collab), strength: r.strength, sharedProjects: r.sharedProjects }));
}

// Full neighborhood graph for a person's profile page: team, projects, skills, collaborators, mentorship.
export async function getPersonNeighborhoodGraph(id: string): Promise<GraphData> {
  const cypher = `
    MATCH (p:Person {id: $id})
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    OPTIONAL MATCH (p)-[:WORKS_ON]->(proj:Project)
    OPTIONAL MATCH (p)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH (proj)<-[:WORKS_ON]-(collab:Person) WHERE collab.id <> $id
    OPTIONAL MATCH (p)-[:MENTORS]->(mentee:Person)
    OPTIONAL MATCH (mentor:Person)-[:MENTORS]->(p)
    RETURN p, t,
      collect(DISTINCT proj) AS projects,
      collect(DISTINCT s) AS skills,
      collect(DISTINCT collab) AS collaborators,
      collect(DISTINCT CASE WHEN collab IS NOT NULL THEN {projId: proj.id, collabId: collab.id} END) AS collabLinks,
      collect(DISTINCT mentee) AS mentees,
      collect(DISTINCT mentor) AS mentors
  `;
  const rows = await runRead<{
    p: Neo4jNode;
    t: Neo4jNode | null;
    projects: Neo4jNode[];
    skills: Neo4jNode[];
    collaborators: Neo4jNode[];
    collabLinks: Array<{ projId: string; collabId: string }>;
    mentees: Neo4jNode[];
    mentors: Neo4jNode[];
  }>(cypher, { id });
  if (rows.length === 0) return { nodes: [], links: [] };
  const r = rows[0];

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const meNode = personNode(r.p);
  nodes.set(meNode.id, meNode);

  if (r.t) {
    const tn = teamNode(r.t);
    nodes.set(tn.id, tn);
    links.push({ source: meNode.id, target: tn.id, type: "MEMBER_OF" });
  }
  for (const proj of r.projects) {
    const pn = projectNode(proj);
    nodes.set(pn.id, pn);
    links.push({ source: meNode.id, target: pn.id, type: "WORKS_ON" });
  }
  for (const s of r.skills) {
    const sn = skillNode(s);
    nodes.set(sn.id, sn);
    links.push({ source: meNode.id, target: sn.id, type: "HAS_SKILL" });
  }
  for (const c of r.collaborators) {
    const cn = personNode(c);
    if (!nodes.has(cn.id)) nodes.set(cn.id, cn);
  }
  for (const pair of r.collabLinks) {
    if (pair?.projId && pair?.collabId) {
      links.push({ source: pair.projId, target: pair.collabId, type: "WORKS_ON" });
    }
  }
  for (const m of r.mentees) {
    const mn = personNode(m);
    nodes.set(mn.id, mn);
    links.push({ source: meNode.id, target: mn.id, type: "MENTORS" });
  }
  for (const m of r.mentors) {
    const mn = personNode(m);
    nodes.set(mn.id, mn);
    links.push({ source: mn.id, target: meNode.id, type: "MENTORS" });
  }
  return { nodes: [...nodes.values()], links };
}

// ---------- Projects ----------

export async function listProjects(params: {
  search?: string;
  teamId?: string;
  status?: string;
}): Promise<Array<Project & { team: Team | null }>> {
  const cypher = `
    MATCH (pr:Project)
    OPTIONAL MATCH (pr)-[:OWNED_BY]->(t:Team)
    WITH pr, t
    WHERE ($search IS NULL OR toLower(pr.name) CONTAINS toLower($search))
      AND ($teamId IS NULL OR t.id = $teamId)
      AND ($status IS NULL OR pr.status = $status)
    RETURN pr, t
    ORDER BY pr.name
    LIMIT 200
  `;
  const rows = await runRead<{ pr: Neo4jNode; t: Neo4jNode | null }>(cypher, {
    search: params.search ?? null,
    teamId: params.teamId ?? null,
    status: params.status ?? null,
  });
  return rows.map((r) => ({ ...toProject(r.pr), team: r.t ? toTeam(r.t) : null }));
}

export async function getProject(id: string): Promise<(Project & { team: Team | null }) | null> {
  const rows = await runRead<{ pr: Neo4jNode; t: Neo4jNode | null }>(
    `MATCH (pr:Project {id: $id}) OPTIONAL MATCH (pr)-[:OWNED_BY]->(t:Team) RETURN pr, t`,
    { id }
  );
  if (rows.length === 0) return null;
  return { ...toProject(rows[0].pr), team: rows[0].t ? toTeam(rows[0].t) : null };
}

export async function getProjectRequiredSkills(id: string): Promise<ProjectRequiredSkill[]> {
  const rows = await runRead<{ s: Neo4jNode; priority: "must-have" | "nice-to-have" }>(
    `MATCH (pr:Project {id: $id})-[r:REQUIRES_SKILL]->(s:Skill)
     RETURN s, r.priority AS priority
     ORDER BY r.priority, s.name`,
    { id }
  );
  return rows.map((r) => ({ ...toSkill(r.s), priority: r.priority }));
}

export async function getProjectMembers(
  id: string
): Promise<Array<Person & { role: string; since: string }>> {
  const rows = await runRead<{ p: Neo4jNode; role: string; since: string }>(
    `MATCH (pr:Project {id: $id})<-[w:WORKS_ON]-(p:Person)
     RETURN p, w.role AS role, w.since AS since
     ORDER BY w.role`,
    { id }
  );
  return rows.map((r) => ({ ...toPerson(r.p), role: r.role, since: r.since }));
}

// Flagship query: for a project, find required skills the current team lacks,
// then recommend org-wide candidates who have that skill and aren't already on the project.
export async function getProjectSkillGaps(id: string): Promise<SkillGap[]> {
  const cypher = `
    MATCH (pr:Project {id: $id})-[req:REQUIRES_SKILL]->(s:Skill)
    OPTIONAL MATCH (pr)<-[:WORKS_ON]-(coveringPerson:Person)-[:HAS_SKILL]->(s)
    WITH pr, s, req.priority AS priority, count(coveringPerson) AS coveredCount
    WHERE coveredCount = 0
    OPTIONAL MATCH (candidate:Person)-[hs:HAS_SKILL]->(s)
    WHERE NOT (candidate)-[:WORKS_ON]->(pr)
    WITH s, priority, candidate, hs
    ORDER BY hs.level DESC
    WITH s, priority, collect(CASE WHEN candidate IS NOT NULL THEN {
        id: candidate.id, name: candidate.name, title: candidate.title, email: candidate.email, bio: candidate.bio,
        level: hs.level, years: hs.years
      } END) AS allCandidates
    RETURN s, priority, allCandidates[0..5] AS candidates
    ORDER BY priority
  `;
  const rows = await runRead<{
    s: Neo4jNode;
    priority: "must-have" | "nice-to-have";
    candidates: Array<Person & { level: number; years: number }>;
  }>(cypher, { id });
  return rows.map((r) => ({ skill: toSkill(r.s), priority: r.priority, candidates: r.candidates }));
}

// ---------- Cross-cutting graph tools ----------

// Variable-length shortest path between two people through shared work, teams or mentorship.
export async function findShortestPath(fromId: string, toId: string): Promise<GraphData | null> {
  const cypher = `
    MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
    MATCH path = shortestPath((a)-[:WORKS_ON|MEMBER_OF|MENTORS*..10]-(b))
    RETURN path
  `;
  const rows = await runRead<{ path: Path }>(cypher, { fromId, toId });
  if (rows.length === 0) return null;

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const path = rows[0].path;
  nodes.set(anyNode(path.start).id, anyNode(path.start));
  for (const seg of path.segments) {
    const startN = anyNode(seg.start);
    const endN = anyNode(seg.end);
    nodes.set(startN.id, startN);
    nodes.set(endN.id, endN);
    // shortestPath() is undirected, so a segment may traverse a relationship backwards;
    // orient source/target to the relationship's real stored direction, not the walk order.
    const traversedForward = seg.relationship.startNodeElementId === seg.start.elementId;
    links.push({
      source: (traversedForward ? seg.start : seg.end).properties.id as string,
      target: (traversedForward ? seg.end : seg.start).properties.id as string,
      type: seg.relationship.type,
    });
  }
  return { nodes: [...nodes.values()], links };
}

// People who bridge two otherwise-separate teams through shared project work.
export async function findBridgePeople(limit = 12): Promise<BridgePerson[]> {
  const cypher = `
    MATCH (p1:Person)-[:MEMBER_OF]->(t1:Team)
    MATCH (p1)-[:WORKS_ON]->(proj:Project)<-[:WORKS_ON]-(p2:Person)-[:MEMBER_OF]->(t2:Team)
    WHERE t1.id < t2.id
    RETURN p1, t1, t2, count(DISTINCT proj) AS bridgeStrength
    ORDER BY bridgeStrength DESC
    LIMIT $limit
  `;
  const rows = await runRead<{ p1: Neo4jNode; t1: Neo4jNode; t2: Neo4jNode; bridgeStrength: number }>(
    cypher,
    { limit }
  );
  return rows.map((r) => ({
    ...toPerson(r.p1),
    teamA: toTeam(r.t1),
    teamB: toTeam(r.t2),
    bridgeStrength: r.bridgeStrength,
  }));
}

// Structural graph (people, teams, projects, mentorship) for the network explorer, optionally scoped to a team.
export async function getFullGraph(teamId?: string): Promise<GraphData> {
  const cypher = `
    MATCH (p:Person)
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    WITH p, t WHERE $teamId IS NULL OR t.id = $teamId
    OPTIONAL MATCH (p)-[:WORKS_ON]->(proj:Project)
    OPTIONAL MATCH (p)-[:MENTORS]->(mentee:Person)
    RETURN p, t, collect(DISTINCT proj) AS projects, collect(DISTINCT mentee) AS mentees
  `;
  const rows = await runRead<{
    p: Neo4jNode;
    t: Neo4jNode | null;
    projects: Neo4jNode[];
    mentees: Neo4jNode[];
  }>(cypher, { teamId: teamId ?? null });

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  for (const r of rows) {
    const pn = personNode(r.p);
    nodes.set(pn.id, pn);
    if (r.t) {
      const tn = teamNode(r.t);
      nodes.set(tn.id, tn);
      links.push({ source: pn.id, target: tn.id, type: "MEMBER_OF" });
    }
    for (const proj of r.projects) {
      const prn = projectNode(proj);
      nodes.set(prn.id, prn);
      links.push({ source: pn.id, target: prn.id, type: "WORKS_ON" });
    }
    for (const mentee of r.mentees) {
      const mn = personNode(mentee);
      nodes.set(mn.id, mn);
      links.push({ source: pn.id, target: mn.id, type: "MENTORS" });
    }
  }
  return { nodes: [...nodes.values()], links };
}
