const DEFAULT_SITE_URL = 'https://universal-skills-hub.vercel.app';

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) {
    return DEFAULT_SITE_URL;
  }

  return rawUrl.trim().replace(/\/+$/, '');
}

export const SITE_URL = normalizeSiteUrl(process.env.AUTH_URL);
