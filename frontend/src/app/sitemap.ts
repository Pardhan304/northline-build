import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';
import { fetchPublicProjects } from '@/services/public-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.8 },
  ];

  try {
    const { items } = await fetchPublicProjects({ page: 1, limit: 100 });
    const projectRoutes: MetadataRoute.Sitemap = items.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
    return [...staticRoutes, ...projectRoutes];
  } catch {
    return staticRoutes;
  }
}
