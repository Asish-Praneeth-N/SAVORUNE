import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: { userAgent: '*', allow: ['/', '/about', '/impact'], disallow: ['/api/', '/dashboard', '/donations/', '/recommendations', '/pickups/', '/sign-in', '/sign-up'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
