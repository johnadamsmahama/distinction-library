'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Post = {
  id: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
};

export default function BlogManager({ posts: initialPosts, authorId }: { posts: Post[]; authorId: string }) {
  const [posts, setPosts] = useState(initialPosts);
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: insertErr } = await supabase
      .from('blog_posts')
      .insert({
        title: title.trim(),
        body: body.trim(),
        cover_image_url: coverUrl.trim() || null,
        author_id: authorId,
        published: false,
      })
      .select()
      .single();
    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setPosts((prev) => [data as Post, ...prev]);
    setTitle('');
    setBody('');
    setCoverUrl('');
  };

  const togglePublish = async (post: Post) => {
    const supabase = createClient();
    const nextPublished = !post.published;
    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update({
        published: nextPublished,
        published_at: nextPublished ? new Date().toISOString() : null,
      })
      .eq('id', post.id);

    if (updateErr) {
      alert(updateErr.message);
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: nextPublished } : p)));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    const supabase = createClient();
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={createPost} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
        <h2 className="font-display font-bold text-lg text-navy mb-1">New post</h2>
        <div>
          <label className={labelClass}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cover image URL (optional)</label>
          <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Body</label>
          <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} />
        </div>
        {error && <p className="font-body text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save as draft'}
        </button>
        <p className="font-body text-xs text-g600 text-center">
          New posts save as drafts — publish them from the list once you're happy.
        </p>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-navy mb-4">All posts ({posts.length})</h2>
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="bg-white border border-g100 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-condensed font-semibold text-sm text-g800 truncate">{p.title}</div>
                  <span
                    className={`inline-block mt-1 font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                      p.published ? 'bg-green-100 text-green-700' : 'bg-off-white text-g600'
                    }`}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(p)}
                    className="font-condensed font-bold text-xs uppercase px-3 py-1.5 rounded-lg border border-g100 hover:border-gold transition-colors"
                  >
                    {p.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="font-body text-sm text-g600">No posts yet.</p>}
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
