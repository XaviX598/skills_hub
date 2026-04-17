/**
 * Skills API Route
 *
 * GET /api/skills?agents=claude-code,codex&query=design
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSession } from '@/lib/session';
import { getDirectorySkills, parseCsvParam, parsePositiveIntegerParam } from '@/lib/skills';

export async function GET(request: NextRequest) {
  const session = await getOptionalSession();
  const agentParam = request.nextUrl.searchParams.get('agents') ?? request.nextUrl.searchParams.get('platform') ?? undefined;
  const agents = parseCsvParam(agentParam);
  const query = request.nextUrl.searchParams.get('query') ?? request.nextUrl.searchParams.get('search') ?? undefined;
  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  const page = parsePositiveIntegerParam(request.nextUrl.searchParams.get('page') ?? undefined);
  const pageSize = parsePositiveIntegerParam(request.nextUrl.searchParams.get('pageSize') ?? undefined, 30);

  const { skills, total, totalPages, source } = await getDirectorySkills({
    agents,
    query,
    category,
    page,
    pageSize,
    currentUserId: session?.user?.id,
  });

  return NextResponse.json(
    { skills, total, page, pageSize, totalPages, source },
    { headers: { 'X-Total-Count': String(total) } }
  );
}
