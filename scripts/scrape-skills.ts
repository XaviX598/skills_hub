// Script para scrape skills de skills.sh
// Usage: npx tsx scripts/scrape-skills.ts

import { writeFileSync } from 'node:fs';

const BASE_URL = 'https://skills.sh';

interface Skill {
  name: string;
  owner: string;
  repo: string;
  installs: number;
}

// Fetch y parse HTML
async function fetchPage(page: number = 1): Promise<Skill[]> {
  console.log(`Fetching page ${page}...`);

  const url = page === 1
    ? `${BASE_URL}/`
    : `${BASE_URL}/?page=${page}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Universal-Skills-Hub/1.0',
    },
  });

  const html = await res.text();

  // Parse skills del HTML
  // El patron es: /owner/repo skill-name installs
  const skills: Skill[] = [];

  // Match: href="/owner/repo" seguido de nombre y installs
  const skillRegex = /href="\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<(\d+(?:\.\d+)?[KMB]?)\s*<\/span>/g;

  let match;
  while ((match = skillRegex.exec(html)) !== null) {
    const owner = match[1];
    const repo = match[2];
    const installsStr = match[3];

    // Evitar duplicados
    if (skills.some(s => s.owner === owner && s.repo === repo)) {
      continue;
    }

    const installs = parseInstalls(installsStr);

    skills.push({
      name: repo,
      owner,
      repo,
      installs,
    });
  }


  console.log(`Found ${skills.length} skills on page ${page}`);
  return skills;
}

function parseInstalls(str: string): number {
  const num = parseFloat(str.replace(/[KMB]/g, ''));
  if (str.includes('M')) return Math.round(num * 1000000);
  if (str.includes('K')) return Math.round(num * 1000);
  return num;
}

// Fetch todas las pÃ¡ginas
async function scrapeAllSkills(): Promise<Skill[]> {
  const allSkills: Skill[] = [];

  // Skills.sh tiene muchas pÃ¡ginas, vamos a intentar las primeras 50 pÃ¡ginas
  // o hasta que no haya mÃ¡s skills
  for (let page = 1; page <= 100; page++) {
    const skills = await fetchPage(page);

    if (skills.length === 0) {
      console.log(`No more skills found on page ${page}, stopping.`);
      break;
    }

    allSkills.push(...skills);

    // Delay para no saturar el servidor
    await new Promise(r => setTimeout(r, 500));

    console.log(`Total so far: ${allSkills.length}`);
  }

  return allSkills;
}

// Dedupe por owner/repo
function dedupe(skills: Skill[]): Skill[] {
  const seen = new Set<string>();
  return skills.filter(s => {
    const key = `${s.owner}/${s.repo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Run
async function main() {
  console.log('Starting scrape of skills.sh...');

  const skills = await scrapeAllSkills();
  const uniqueSkills = dedupe(skills);

  console.log(`\nTotal unique skills: ${uniqueSkills.length}`);

  // Sort por installs (mayor primero)
  uniqueSkills.sort((a, b) => b.installs - a.installs);

  // Guardar a JSON
  const outputPath = './src/data/scraped-skills.ts';

  const content = `// scraped from skills.sh - ${new Date().toISOString()}
// Total: ${uniqueSkills.length} skills

export const SCRAPED_SKILLS = ${JSON.stringify(uniqueSkills, null, 2)} as const;

export type ScrapedSkill = typeof SCRAPED_SKILLS[number];
`;

  writeFileSync(outputPath, content);
  console.log(`Saved to ${outputPath}`);
}

main().catch(console.error);
