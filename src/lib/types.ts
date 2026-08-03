export interface Person {
  id: string;
  name: string;
  title: string;
  email: string;
  bio: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed";
}

export interface PersonWithTeam extends Person {
  team: Team | null;
}

export interface PersonSkill extends Skill {
  level: number; // 1-5
  years: number;
}

export interface ProjectRequiredSkill extends Skill {
  priority: "must-have" | "nice-to-have";
}

export interface Collaborator extends Person {
  strength: number; // number of shared projects
  sharedProjects: string[]; // project names
}

export interface SkillGap {
  skill: Skill;
  priority: "must-have" | "nice-to-have";
  candidates: Array<Person & { level: number; years: number }>;
}

export interface BridgePerson extends Person {
  teamA: Team;
  teamB: Team;
  bridgeStrength: number;
}

export type GraphNodeType = "Person" | "Team" | "Skill" | "Project";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sub?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface OrgStats {
  people: number;
  teams: number;
  skills: number;
  projects: number;
}
