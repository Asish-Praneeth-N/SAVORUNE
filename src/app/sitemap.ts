import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return ['', '/about', '/impact'].map((path) => ({ url: `${base}${path}`, changeFrequency: path === '/impact' ? 'daily' : 'monthly', priority: path === '' ? 1 : 0.7 }));
}
