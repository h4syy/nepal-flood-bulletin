import { NextResponse } from "next/server";
import { getFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getFeed();
  return NextResponse.json(feed);
}
