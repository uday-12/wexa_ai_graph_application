import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });

// Imported after dotenv.config() so the driver singleton picks up the loaded env vars.
import { runRead, runWrite, closeDriver, checkConnectivity } from "../src/lib/neo4j";
import { generateGraph } from "./seed-data";

async function main() {
  console.log("Checking connectivity to CognoDB Cloud...");
  const ok = await checkConnectivity();
  if (!ok) {
    console.error(
      "Could not connect. Check NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD in .env.local (see .env.example)."
    );
    process.exit(1);
  }

  const graph = generateGraph();

  console.log("Wiping existing data...");
  await runWrite("MATCH (n) DETACH DELETE n");

  console.log("Creating uniqueness constraints...");
  for (const label of ["Person", "Team", "Skill", "Project"]) {
    await runWrite(`CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`);
  }

  console.log(`Loading ${graph.teams.length} teams...`);
  await runWrite(`UNWIND $rows AS row CREATE (t:Team) SET t = row`, { rows: graph.teams });

  console.log(`Loading ${graph.skills.length} skills...`);
  await runWrite(`UNWIND $rows AS row CREATE (s:Skill) SET s = row`, { rows: graph.skills });

  console.log(`Loading ${graph.people.length} people...`);
  const peopleRows = graph.people.map(({ teamIndex, seniority, ...rest }) => rest);
  await runWrite(`UNWIND $rows AS row CREATE (p:Person) SET p = row`, { rows: peopleRows });

  console.log(`Loading ${graph.projects.length} projects...`);
  const projectRows = graph.projects.map(({ teamIndex, ...rest }) => rest);
  await runWrite(`UNWIND $rows AS row CREATE (pr:Project) SET pr = row`, { rows: projectRows });

  console.log(`Loading ${graph.memberOf.length} MEMBER_OF edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (p:Person {id: row.personId}), (t:Team {id: row.teamId})
     CREATE (p)-[:MEMBER_OF]->(t)`,
    { rows: graph.memberOf }
  );

  console.log(`Loading ${graph.hasSkill.length} HAS_SKILL edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (p:Person {id: row.personId}), (s:Skill {id: row.skillId})
     CREATE (p)-[:HAS_SKILL {level: row.level, years: row.years}]->(s)`,
    { rows: graph.hasSkill }
  );

  console.log(`Loading ${graph.worksOn.length} WORKS_ON edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (p:Person {id: row.personId}), (pr:Project {id: row.projectId})
     CREATE (p)-[:WORKS_ON {role: row.role, since: row.since}]->(pr)`,
    { rows: graph.worksOn }
  );

  console.log(`Loading ${graph.requiresSkill.length} REQUIRES_SKILL edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (pr:Project {id: row.projectId}), (s:Skill {id: row.skillId})
     CREATE (pr)-[:REQUIRES_SKILL {priority: row.priority}]->(s)`,
    { rows: graph.requiresSkill }
  );

  console.log(`Loading ${graph.ownedBy.length} OWNED_BY edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (pr:Project {id: row.projectId}), (t:Team {id: row.teamId})
     CREATE (pr)-[:OWNED_BY]->(t)`,
    { rows: graph.ownedBy }
  );

  console.log(`Loading ${graph.mentors.length} MENTORS edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (a:Person {id: row.mentorId}), (b:Person {id: row.menteeId})
     CREATE (a)-[:MENTORS]->(b)`,
    { rows: graph.mentors }
  );

  console.log("Sanity-checking a few interesting patterns...");
  const [{ c: gapPairs }] = await runRead<{ c: number }>(`
    MATCH (pr:Project)-[:REQUIRES_SKILL]->(s:Skill)
    OPTIONAL MATCH (pr)<-[:WORKS_ON]-(coveringPerson:Person)-[:HAS_SKILL]->(s)
    WITH pr, s, count(coveringPerson) AS coveredCount
    WHERE coveredCount = 0
    RETURN count(*) AS c
  `);
  const [{ c: bridgePeople }] = await runRead<{ c: number }>(`
    MATCH (p1:Person)-[:MEMBER_OF]->(t1:Team)
    MATCH (p1)-[:WORKS_ON]->(proj:Project)<-[:WORKS_ON]-(p2:Person)-[:MEMBER_OF]->(t2:Team)
    WHERE t1.id < t2.id
    RETURN count(DISTINCT p1) AS c
  `);
  console.log(`  -> project/skill pairs with a genuine gap: ${gapPairs}`);
  console.log(`  -> distinct cross-team bridge people: ${bridgePeople}`);

  await closeDriver();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
