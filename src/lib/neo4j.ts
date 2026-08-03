import neo4j, { Driver, Session, SessionMode, Node as Neo4jNode } from "neo4j-driver";

export class DbUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Could not reach the graph database. It may be paused, unreachable, or misconfigured.");
    this.name = "DbUnavailableError";
    this.cause = cause;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver: Driver | undefined;
}

function createDriver(): Driver {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error(
      "Missing NEO4J_URI, NEO4J_USERNAME or NEO4J_PASSWORD environment variables. Copy .env.example to .env.local and fill in your CognoDB Cloud credentials."
    );
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
    maxConnectionPoolSize: 10,
  });
}

function getDriver(): Driver {
  // Reuse a single driver instance across hot reloads / route invocations.
  if (!global.__neo4jDriver) {
    global.__neo4jDriver = createDriver();
  }
  return global.__neo4jDriver;
}

async function withSession<T>(mode: SessionMode, work: (session: Session) => Promise<T>): Promise<T> {
  let session: Session | undefined;
  try {
    const driver = getDriver();
    session = driver.session({ defaultAccessMode: mode });
    return await work(session);
  } catch (err) {
    throw new DbUnavailableError(err);
  } finally {
    await session?.close();
  }
}

export async function runRead<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(neo4j.session.READ, async (session) => {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map((r) => r.toObject() as T);
  });
}

export async function runWrite<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(neo4j.session.WRITE, async (session) => {
    const result = await session.executeWrite((tx) => tx.run(cypher, params));
    return result.records.map((r) => r.toObject() as T);
  });
}

export async function checkConnectivity(): Promise<boolean> {
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}

export function nodeProps<T>(node: Neo4jNode): T {
  return node.properties as T;
}

export async function closeDriver(): Promise<void> {
  if (global.__neo4jDriver) {
    await global.__neo4jDriver.close();
    global.__neo4jDriver = undefined;
  }
}
