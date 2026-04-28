const DEFAULT_SITE_URL = 'https://universal-skills-hub.vercel.app';

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) {
    return DEFAULT_SITE_URL;
  }

  return rawUrl.trim().replace(/\/+$/, '');
}

function resolveSiteUrl(): string {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const normalizedVercelUrl = vercelUrl
    ? vercelUrl.startsWith('http')
      ? vercelUrl
      : `https://${vercelUrl}`
    : undefined;

  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL
      ?? process.env.AUTH_URL
      ?? normalizedVercelUrl
      ?? DEFAULT_SITE_URL,
  );
}

export const SITE_URL = resolveSiteUrl();
