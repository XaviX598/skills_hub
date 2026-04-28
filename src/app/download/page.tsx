import { redirect } from 'next/navigation';

interface DownloadRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DownloadPage({ searchParams }: DownloadRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/app?${suffix}` : '/app');
}
