'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Section 9.2 of the spec: "Categories: Study Tips, Platform Updates,
// Opportunities Spotlight, Student Stories" — must match the DB check
// constraint on blog_posts.category exactly.
const CATEGORIES = ['Study Tips', 'Platform Updates', 'Opportunities Spotlight', 'Student Stories'] as const;

type Category = (typeof CATEGORIES)[number];

type Post = {
  id: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  category: Category | null;
  published: boolean;
  published_at: string | null;
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

const ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx';
const MAX_ATTACHMENT_MB = 20;

function extensionFor(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : null;
  return (fromName || file.type.split('/').pop() || 'bin').toLowerCase();
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BlogManager({ posts: initialPosts, authorId }: { posts: Post[]; authorId: string }) {
  const [posts, setPosts] = useState(initialPosts);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Body insert-image (uploads immediately so a URL exists to insert)
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const [insertingImage, setInsertingImage] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Document attachments (queued, uploaded after the post is created)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setCategory('');
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setAttachmentFiles([]);
    setAttachmentWarning(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const uploadToBucket = async (file: File, bucket: string) => {
    const supabase = createClient();
    const path = `${crypto.randomUUID()}.${extensionFor(file)}`;
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file);
    if (uploadErr) throw new Error(uploadErr.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setError('Cover image must be JPEG, PNG, WebP, or GIF.');
      e.target.value = '';
      return;
    }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const insertAtCursor = (snippet: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => `${prev}${prev && !prev.endsWith('\n') ? '\n\n' : ''}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = `${el.value.slice(0, start)}${snippet}${el.value.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleInsertImageClick = () => {
    insertImageInputRef.current?.click();
  };

  const handleInsertImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setError('Images must be JPEG, PNG, WebP, or GIF.');
      return;
    }
    setError(null);
    setInsertingImage(true);
    try {
      const url = await uploadToBucket(file, 'blog-images');
      insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${url})`);
    } catch (err: any) {
      setError(err.message ?? 'Image upload failed.');
    } finally {
      setInsertingImage(false);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Link URL (e.g. https://distinctionlibrary.com/exams):');
    if (!url) return;
    const label = window.prompt('Link text:', url) || url;
    insertAtCursor(`[${label}](${url})`);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!ATTACHMENT_MIME_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        rejected.push(`${file.name} (over ${MAX_ATTACHMENT_MB}MB)`);
        continue;
      }
      accepted.push(file);
    }
    setAttachmentFiles((prev) => [...prev, ...accepted]);
    setAttachmentWarning(rejected.length ? `Skipped: ${rejected.join(', ')}` : null);
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    if (!category) {
      setError('Choose a category.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    let coverImageUrl: string | null = null;
    if (coverFile) {
      try {
        coverImageUrl = await uploadToBucket(coverFile, 'blog-images');
      } catch (err: any) {
        setLoading(false);
        setError(err.message ?? 'Cover image upload failed.');
        return;
      }
    }

    const { data, error: insertErr } = await supabase
      .from('blog_posts')
      .insert({
        title: title.trim(),
        body: body.trim(),
        cover_image_url: coverImageUrl,
        category,
        author_id: authorId,
        published: false,
      })
      .select()
      .single();

    if (insertErr) {
      setLoading(false);
      setError(insertErr.message);
      return;
    }

    const newPost = data as Post;

    // Upload attachments after the post exists, since blog_attachments.post_id
    // references it. If some fail, the post itself still saved successfully.
    if (attachmentFiles.length > 0) {
      const failures: string[] = [];
      for (const file of attachmentFiles) {
        try {
          const url = await uploadToBucket(file, 'blog-attachments');
          const { error: attachErr } = await supabase.from('blog_attachments').insert({
            post_id: newPost.id,
            file_name: file.name,
            file_url: url,
            file_type: file.type,
            file_size_bytes: file.size,
          });
          if (attachErr) failures.push(`${file.name} (${attachErr.message})`);
        } catch (err: any) {
          failures.push(`${file.name} (${err.message ?? 'upload failed'})`);
        }
      }
      if (failures.length) {
        setError(`Post saved, but some attachments failed: ${failures.join(', ')}`);
      }
    }

    setLoading(false);
    setPosts((prev) => [newPost, ...prev]);
    resetForm();
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

  const changeCategory = async (post: Post, nextCategory: Category) => {
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update({ category: nextCategory })
      .eq('id', post.id);

    if (updateErr) {
      alert(updateErr.message);
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, category: nextCategory } : p)));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    const supabase = createClient();
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={createPost} className="bg-white border border-g100 rounded-none p-6 space-y-4 h-fit">
        <h2 className="font-display font-bold text-lg text-navy mb-1">New post</h2>

        <div>
          <label className={labelClass}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Cover image (optional)</label>
          <input
            ref={coverInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={handleCoverChange}
            className="w-full font-body text-sm text-g600 file:mr-3 file:px-3 file:py-2 file:rounded-none file:border file:border-g100 file:bg-off-white file:font-condensed file:font-bold file:text-xs file:uppercase file:cursor-pointer"
          />
          <p className="font-body text-xs text-g600 mt-1">JPEG, PNG, WebP, or GIF.</p>
          {coverPreviewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreviewUrl} alt="" className="w-full h-32 object-cover rounded-none mt-2" />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Body</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInsertImageClick}
                disabled={insertingImage}
                className="font-condensed font-bold text-[11px] uppercase px-2.5 py-1 rounded-none border border-g100 hover:border-gold transition-colors disabled:opacity-60"
              >
                {insertingImage ? 'Uploading…' : 'Insert image'}
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="font-condensed font-bold text-[11px] uppercase px-2.5 py-1 rounded-none border border-g100 hover:border-gold transition-colors"
              >
                Insert link
              </button>
            </div>
          </div>
          <input
            ref={insertImageInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={handleInsertImageChange}
            className="hidden"
          />
          <textarea
            ref={bodyRef}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={inputClass}
          />
          <p className="font-body text-xs text-g600 mt-1">
            Supports markdown — the toolbar above inserts image and link syntax for you.
          </p>
        </div>

        <div>
          <label className={labelClass}>Attachments (optional)</label>
          <input
            ref={attachmentInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            onChange={handleAttachmentChange}
            className="w-full font-body text-sm text-g600 file:mr-3 file:px-3 file:py-2 file:rounded-none file:border file:border-g100 file:bg-off-white file:font-condensed file:font-bold file:text-xs file:uppercase file:cursor-pointer"
          />
          <p className="font-body text-xs text-g600 mt-1">PDF, Word, or PowerPoint — up to {MAX_ATTACHMENT_MB}MB each.</p>
          {attachmentWarning && <p className="font-body text-xs text-red-500 mt-1">{attachmentWarning}</p>}
          {attachmentFiles.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {attachmentFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 bg-off-white rounded-none px-3 py-1.5"
                >
                  <span className="font-body text-xs text-g800 truncate">
                    {f.name} <span className="text-g600">({formatBytes(f.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-none text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="font-body text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-none hover:bg-gold-light transition-colors disabled:opacity-60"
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
            <div key={p.id} className="bg-white border border-g100 rounded-none px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-condensed font-semibold text-sm text-g800 truncate">{p.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                        p.published ? 'bg-green-100 text-green-700' : 'bg-off-white text-g600'
                      }`}
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                    {p.category && (
                      <span className="inline-block font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-g100 text-navy">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={p.category ?? ''}
                    onChange={(e) => changeCategory(p, e.target.value as Category)}
                    className="font-condensed text-xs px-2 py-1.5 rounded-none border border-g100 outline-none focus:border-gold transition-colors"
                  >
                    <option value="" disabled>
                      No category
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => togglePublish(p)}
                    className="font-condensed font-bold text-xs uppercase px-3 py-1.5 rounded-none border border-g100 hover:border-gold transition-colors"
                  >
                    {p.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-none text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
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
  'w-full px-4 py-3 rounded-none border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
