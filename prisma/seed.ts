/**
 * Seed Script for Universal Skills Hub catalog data.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { FEATURED_SKILLS } from '../src/data/skills';
import type { Skill } from '../src/types';

const prisma = new PrismaClient();

const LEGACY_SEED_IDS = [
  'seed-anthropics-frontend-design',
  'seed-vercel-labs-vercel-react-best-practices',
  'seed-obra-test-driven-development',
  'seed-vercel-labs-deploy-to-vercel',
];
const IMPORTED_TAG = 'skillful';
const BATCH_SIZE = 500;

function toPrismaSkillData(skill: Skill) {
  return {
    name: skill.name,
    description: skill.description,
    repositoryUrl: skill.repositoryUrl ?? skill.documentationUrl ?? 'https://skills.sh/',
    documentationUrl: skill.documentationUrl ?? null,
    category: skill.category ?? null,
    tags: skill.tags,
    agents: skill.agents,
    owner: skill.owner ?? null,
    repoName: skill.repoName ?? null,
    installCommand: skill.installCommand ?? null,
  };
}

function toPrismaSkillCreateData(skill: Skill, authorId: string) {
  return {
    id: skill.id,
    ...toPrismaSkillData(skill),
    authorId,
    createdAt: new Date(skill.createdAt),
    updatedAt: new Date(skill.updatedAt),
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function main() {
  console.log('Starting seed...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      githubUsername: 'demo',
      image: 'https://github.com/ghost.png',
    },
  });

  await prisma.skill.deleteMany({
    where: { id: { in: LEGACY_SEED_IDS } },
  });

  const curatedSkills = FEATURED_SKILLS.filter((skill) => !skill.tags.includes(IMPORTED_TAG));
  const importedSkills = FEATURED_SKILLS.filter((skill) => skill.tags.includes(IMPORTED_TAG));

  for (const skill of curatedSkills) {
    const data = toPrismaSkillData(skill);

    await prisma.skill.upsert({
      where: { id: skill.id },
      update: data,
      create: {
        id: skill.id,
        ...data,
        authorId: user.id,
        createdAt: new Date(skill.createdAt),
        updatedAt: new Date(skill.updatedAt),
      },
    });
  }

  let importedInserted = 0;

  for (const batch of chunk(importedSkills, BATCH_SIZE)) {
    const result = await prisma.skill.createMany({
      data: batch.map((skill) => toPrismaSkillCreateData(skill, user.id)),
      skipDuplicates: true,
    });

    importedInserted += result.count;
    console.log(`Imported seed batch: inserted ${importedInserted}/${importedSkills.length}`);
  }

  console.log(`Seed complete: ${curatedSkills.length} curated upserted, ${importedInserted}/${importedSkills.length} imported inserted or already present.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
