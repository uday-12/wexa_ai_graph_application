import { NextResponse } from "next/server";
import { DbUnavailableError } from "./neo4j";

export async function apiRoute<T>(fn: () => Promise<T | NextResponse>): Promise<NextResponse> {
  try {
    const data = await fn();
    if (data instanceof NextResponse) return data;
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong on our end." }, { status: 500 });
  }
}
