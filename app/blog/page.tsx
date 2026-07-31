import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const CATEGORIES = ['Study Tips', 'Platform Updates', 'Opportunities Spotlight', 'Student Stories'];

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeCategory = searchParams.category && CATEGORIES.includes(searchParams.category)
    ? searchParams.category
    : null;

  let query = supabase
    .from('blog_posts')
    .select('id, title, cover_image_url, category, published_at, profiles(full_name)')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }

  const { data: posts } = await query;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Study Blog</h1>
      <p className="font-body text-sm text-g600 mb-6">Tips, guides, and updates from the team.</p>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Link
          href="/blog"
          className={`flex-shrink-0 font-condensed font-semibold text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
            !activeCategory ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/blog?category=${encodeURIComponent(c)}`}
            className={`flex-shrink-0 font-condensed font-semibold text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
              activeCategory === c ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {!posts || posts.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-16">
          {activeCategory ? 'Nothing published in this category yet — check back soon.' : 'Nothing published yet — check back soon.'}
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
                {post.category && (
                  <span className="inline-block font-condensed font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-g100 text-navy mb-2">
                    {post.category}
                  </span>
                )}
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
