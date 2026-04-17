'use server';

import { auth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function toggleFavorite(formData: FormData) {
  const session = await auth();
  const skillId = String(formData.get('skillId') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/skills');

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  if (!skillId) {
    throw new Error('Missing skill id');
  }

  const prisma = getPrisma();
  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        skillId,
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/skills');
  revalidatePath(`/skills/${skillId}`);
  revalidatePath('/profile');
}
