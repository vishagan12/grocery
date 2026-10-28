import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sriammansupermarket.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/rider', '/rider/', '/api/', '/checkout'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
