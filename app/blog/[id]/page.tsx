import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/server';

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKindLabel(fileType: string) {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('word')) return 'Word';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PowerPoint';
  return 'File';
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, cover_image_url, category, body, published, published_at, profiles(full_name)')
    .eq('id', params.id)
    .single();

  if (!post || !post.published) notFound();

  const { data: attachments } = await supabase
    .from('blog_attachments')
    .select('id, file_name, file_url, file_type, file_size_bytes')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  return (
    <article className="max-w-2xl mx-auto">
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt="" className="w-full h-56 object-cover rounded-none mb-6" />
      )}
      {post.category && (
        <span className="inline-block font-condensed font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-g100 text-navy mb-3">
          {post.category}
        </span>
      )}
      <p className="font-condensed text-xs uppercase tracking-wide text-gold mb-2">
        {(post.profiles as any)?.full_name ?? 'Distinction Library'} ·{' '}
        {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
      </p>
      <h1 className="font-display font-bold text-3xl text-navy mb-6">{post.title}</h1>

      <div className="font-body text-[15px] leading-relaxed text-g800 prose-blog">
        <ReactMarkdown
          components={{
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ''} className="w-full rounded-none my-4" />
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline hover:text-gold-light transition-colors"
              >
                {children}
              </a>
            ),
            p: ({ children }) => <p className="mb-4 whitespace-pre-wrap">{children}</p>,
          }}
        >
          {post.body}
        </ReactMarkdown>
      </div>

      {attachments && attachments.length > 0 && (
        <div className="mt-10 pt-6 border-t border-g100">
          <h2 className="font-condensed font-bold text-xs uppercase tracking-wide text-g600 mb-3">Attachments</h2>
          <div className="space-y-2">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={a.file_name}
                className="flex items-center justify-between gap-3 bg-off-white rounded-none px-4 py-3 hover:bg-g100 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-condensed font-semibold text-sm text-g800 truncate">{a.file_name}</div>
                  <div className="font-body text-xs text-g600">
                    {fileKindLabel(a.file_type)}
                    {a.file_size_bytes ? ` · ${formatBytes(a.file_size_bytes)}` : ''}
                  </div>
                </div>
                <span className="font-condensed font-bold text-xs uppercase text-gold flex-shrink-0">Download</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
