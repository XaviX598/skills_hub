'use server';

import { auth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { extractGitHubRepository } from '@/lib/skills';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const skillSchema = z.object({
  name: z.string().trim().min(2, 'The name must be at least 2 characters long.').max(100),
  description: z.string().trim().min(30, 'The description must be at least 30 characters long.').max(2000),
  repositoryUrl: z.string().trim().url('Enter a valid URL.').refine((url) => {
    try {
      const parsed = new URL(url);
      return ['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }, 'For now, submissions must point to GitHub repositories.'),
  documentationUrl: z.preprocess(emptyToUndefined, z.string().trim().url('Documentation must be a valid URL.').optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  tags: z.string().optional(),
  agents: z.array(z.string().trim().min(1)).min(1, 'Select at least one compatible agent.'),
});

export type SubmitSkillState = {
  ok: boolean;
  message: string;
};

export async function submitSkill(_previousState: SubmitSkillState, formData: FormData): Promise<SubmitSkillState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/submit');
  }

  const parsed = skillSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    repositoryUrl: formData.get('repositoryUrl'),
    documentationUrl: formData.get('documentationUrl'),
    category: formData.get('category'),
    tags: formData.get('tags'),
    agents: formData.getAll('agents'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(' '),
    };
  }

  const { name, description, repositoryUrl, documentationUrl, category, agents } = parsed.data;
  const tags = (parsed.data.tags ?? '')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const { owner, repoName } = extractGitHubRepository(repositoryUrl);

  try {
    await getPrisma().skill.create({
      data: {
        name,
        description,
        repositoryUrl,
        documentationUrl: documentationUrl ?? null,
        category: category ?? null,
        tags,
        agents,
        owner: owner ?? null,
        repoName: repoName ?? null,
        installCommand: owner && repoName ? `npx skills add ${owner}/${repoName}` : null,
        authorId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Error submitting skill:', error);
    return {
      ok: false,
      message: 'The skill could not be saved. Check the database connection and environment variables.',
    };
  }

  revalidatePath('/');
  revalidatePath('/skills');
  revalidatePath('/profile');
  redirect('/skills');
}
