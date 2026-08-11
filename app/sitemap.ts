import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

// Only pages reachable without a UPSA login belong here — everything behind
// auth (dashboard, ai-tools, papers, tutors, vault, etc.) is invisible to
// Google anyway since a crawler can't log in, so listing those would just
// be noise Search Console flags as "blocked by login."
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://distinctionlibrary.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Individual blog posts. blog_posts has no slug column, so posts are
  // routed by id (/blog/[id]) rather than a readable slug. Wrapped in
  // try/catch so a schema change later doesn't break the whole sitemap —
  // worst case, posts just don't get individually listed.
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient();
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, published_at, created_at')
      .eq('published', true);

    if (posts) {
      postRoutes = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.id}`,
        lastModified: new Date(post.published_at ?? post.created_at ?? Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Schema mismatch or query error — safe to skip individual post URLs.
  }

  return [...staticRoutes, ...postRoutes];
}
