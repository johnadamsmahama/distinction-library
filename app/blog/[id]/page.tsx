import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, cover_image_url, body, published, published_at, profiles(full_name)')
    .eq('id', params.id)
    .single();

  if (!post || !post.published) notFound();

  return (
    <article className="max-w-2xl mx-auto">
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt="" className="w-full h-56 object-cover rounded-xl mb-6" />
      )}
      <p className="font-condensed text-xs uppercase tracking-wide text-gold mb-2">
        {(post.profiles as any)?.full_name ?? 'Distinction Library'} ·{' '}
        {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
      </p>
      <h1 className="font-display font-bold text-3xl text-navy mb-6">{post.title}</h1>
      <div className="font-body text-[15px] leading-relaxed text-g800 whitespace-pre-wrap">
        {post.body}
      </div>
    </article>
  );
}
