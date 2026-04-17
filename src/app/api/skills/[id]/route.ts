/**
 * Single Skill API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSession } from '@/lib/session';
import { getSkillById } from '@/lib/skills';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOptionalSession();
  const skill = await getSkillById(id, session?.user?.id);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  return NextResponse.json({ skill });
}
