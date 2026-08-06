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
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-[#081527] px-6 py-8 mb-6">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(201,162,75,0.16)_0%,rgba(201,162,75,0)_70%)]" />
        <p className="relative font-body text-[11px] font-semibold tracking-[0.14em] uppercase text-gold mb-3">
          Essentials
        </p>
        <h1 className="relative font-display font-bold text-3xl text-white mb-2">Study Blog</h1>
        <p className="relative font-body text-sm text-[#B7C0D4]">Tips, guides, and updates from the team.</p>
      </div>

      {/* Category chips, with a fade + arrow hint that more are scrollable */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#EAF3ED] to-[#DCEDE3] mb-6">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-4 scrollbar-none">
          <Link
            href="/blog"
            className={`flex-shrink-0 font-condensed font-semibold text-xs uppercase tracking-wide px-4 py-2.5 rounded-full transition-colors ${
              !activeCategory ? 'bg-navy text-[#E4C878]' : 'bg-white border border-g100 text-g600'
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              className={`flex-shrink-0 font-condensed font-semibold text-xs uppercase tracking-wide px-4 py-2.5 rounded-full transition-colors ${
                activeCategory === c ? 'bg-navy text-[#E4C878]' : 'bg-white border border-g100 text-g600'
              }`}
            >
              {c}
            </Link>
          ))}
          {/* spacer so the last chip can fully clear the fade */}
          <div className="flex-shrink-0 w-6" aria-hidden="true" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-r from-transparent to-[#DCEDE3]" />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white border border-g100 shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] stroke-gold" fill="none" strokeWidth={2.4}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-g100 bg-[#DCEDE3] py-11 px-6 text-center">
          <div className="w-[52px] h-[52px] mx-auto mb-4 rounded-2xl bg-navy flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#E4C878]" fill="none" strokeWidth={1.8}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M9 7h7M9 11h7M9 15h4" />
            </svg>
          </div>
          <h3 className="font-display font-medium text-lg text-navy mb-1.5">
            {activeCategory ? 'Nothing here yet' : 'Nothing published yet'}
          </h3>
          <p className="font-body text-sm text-g600 max-w-xs mx-auto leading-relaxed">
            {activeCategory
              ? `No posts in ${activeCategory} yet — check back soon.`
              : 'The team is working on the first posts — check back soon for tips, guides, and updates.'}
          </p>
          <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full bg-gold/10 text-gold font-body text-[11px] font-bold uppercase tracking-wide">
            <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] stroke-gold" fill="none" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            Coming soon
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="bg-white border border-g100 border-l-[3px] border-l-navy rounded-2xl overflow-hidden hover:border-gold hover:border-l-navy transition-colors"
            >
              {post.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                {post.category && (
                  <span className="inline-block font-condensed font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-gold/10 text-gold mb-2">
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
