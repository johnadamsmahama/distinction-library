# Deploying Distinction Library

This is the last stage — getting from code you can run on your laptop to a
real site at your own domain. I can't run these steps for you (no live
network access from where I build), but every step below is exact — follow
them in order.

## 1. Prerequisites checklist

- [ ] Node.js 18+ installed locally, and `npm install` runs clean in the
      project folder
- [ ] A Supabase project created at supabase.com
- [ ] All five `supabase/*.sql` files run, **in this exact order**, in the
      Supabase SQL Editor:
      1. `schema.sql`
      2. `rls_policies.sql`
      3. `storage_setup.sql`
      4. `dashboard_functions.sql`
      5. `stage7_moderation.sql`
      6. `stage9_notifications.sql`
      7. `stage10_admin.sql`
      (`seed.sql` is optional — sample courses for testing.)
- [ ] An Anthropic API key from console.anthropic.com
- [ ] A GitHub account (Vercel deploys from a GitHub repo)
- [ ] A Vercel account (vercel.com) — the free Hobby tier is enough to start

## 2. Push the code to GitHub

```bash
cd distinction-library
git init
git add .
git commit -m "Distinction Library — initial build"
```

Create a new empty repository on GitHub (don't initialise it with a
README), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/distinction-library.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Vercel

1. Go to vercel.com → **Add New → Project** → import the GitHub repo you
   just pushed.
2. Vercel auto-detects Next.js — leave the build settings as default.
3. Before clicking Deploy, add these **Environment Variables** (from your
   `.env.local`):

   | Key | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (⚠️ keep secret) |
   | `ANTHROPIC_API_KEY` | console.anthropic.com |

4. Click **Deploy**. You'll get a live URL like
   `distinction-library-xyz.vercel.app` within a couple of minutes.

## 4. Point Supabase Auth at your live URL

Signup/login confirmation emails won't work until Supabase knows where to
redirect back to.

In Supabase → Authentication → URL Configuration:
- **Site URL**: `https://distinction-library-xyz.vercel.app` (your Vercel URL for now — update again once your custom domain is live)
- **Redirect URLs**, add: `https://distinction-library-xyz.vercel.app/auth/callback`

## 5. Buy and connect your domain

You mentioned you'd handle this part yourself — here's exactly what that
involves:

1. **Buy the domain** from any registrar (Namecheap, GoDaddy, or a Ghanaian
   registrar if you want a local presence). Something like
   `distinctionlibrary.com` or a UPSA-flavoured variant.
2. In Vercel → your project → **Settings → Domains**, add your domain.
3. Vercel will show you either:
   - An **A record** (if using the apex domain, e.g. `distinctionlibrary.com`), or
   - A **CNAME record** (if using a subdomain, e.g. `app.distinctionlibrary.com`)
4. Go to your domain registrar's DNS settings and add the record Vercel
   showed you. This part is registrar-specific but always in a
   "DNS Management" or "Advanced DNS" section.
5. Wait for DNS propagation (usually 10 minutes to a few hours). Vercel
   auto-issues an SSL certificate once it verifies the domain — no extra
   steps needed for HTTPS.
6. **Go back to Supabase Auth URL Configuration** (Step 4 above) and update
   the Site URL and Redirect URL to your real domain instead of the
   `.vercel.app` one.

## 6. First-run checklist, once it's live

1. Sign up for real, using your own 8-digit student ID.
2. In Supabase → Table Editor → `profiles`, find your row and manually set
   `role` to `admin`. (This is the one and only manual DB edit you should
   ever need — after this, use the Admin Dashboard for everything else,
   including granting other admins/moderators.)
3. Log back in, go to `/admin/courses`, and add your real UPSA course list
   (or run `supabase/seed.sql` beforehand for a starter set).
4. Do one full round-trip test: upload a past paper as a student → approve
   it as a moderator → confirm the watermark shows up in the downloaded
   file → confirm the notification arrived.
5. Test the AI Quiz Generator and Study Companion once — this is the first
   point real Anthropic API costs get incurred, so it's worth confirming
   the key works before telling students about it.
6. On your phone, visit the site in Chrome or Safari and use
   "Add to Home Screen" — confirm it installs and opens standalone (no
   browser chrome), confirming the PWA setup from Stage 11 works.

## 7. Costs to budget for, ongoing

- **Vercel**: free Hobby tier covers this comfortably at launch. Paid tier
  only becomes relevant at meaningfully higher traffic.
- **Supabase**: free tier includes 500MB database + 1GB file storage —
  fine to start, but past papers/materials will eventually exceed 1GB
  storage as the library grows. Watch this in Supabase → Settings → Usage.
- **Anthropic API**: usage-based billing per request. The Quiz Generator
  and Study Companion are the only features that call it. Worth setting a
  spending limit in the Anthropic console once real students start using
  it, just so a busy exam week doesn't produce a surprise bill.
- **Domain**: typically $10–15/year depending on the registrar and TLD.
