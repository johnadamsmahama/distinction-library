import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BlogManager from '@/components/admin/BlogManager';

export default async function AdminBlogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, body, cover_image_url, published, published_at')
    .order('created_at', { ascending: false });

  return <BlogManager posts={(posts as any) ?? []} authorId={user.id} />;
}
