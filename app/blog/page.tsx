import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function BlogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, cover_image_url, published_at, profiles(full_name)')
    .eq('published', true)
    .order('published_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Study Blog</h1>
      <p className="font-body text-sm text-g600 mb-6">Tips, guides, and updates from the team.</p>

      {!posts || posts.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-16">
          Nothing published yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="bg-white border border-g100 rounded-xl overflow-hidden hover:border-gold transition-colors"
            >
              {post.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-display font-bold text-base text-navy mb-1">{post.title}</h2>
                <p className="font-condensed text-[11px] uppercase tracking-wide text-g600">
                  {post.profiles?.full_name ?? 'Distinction Library'} ·{' '}
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
