# BMS Blog CMS — setup & usage

This adds a **staff-friendly blog editor** at `/admin` using **Decap CMS** (the open-source
successor to Netlify CMS) + a tiny build step. Staff write a post in a form, hit **Publish**,
and Netlify rebuilds the site — a real HTML page is generated (good for SEO), the blog grid on
the homepage updates automatically, and the post goes live. No code, no touching HTML.

## What was added to the repo
```
admin/index.html            → the /admin editor page (loads Decap + Netlify Identity)
admin/config.yml            → the blog form fields + where content is saved
content/blog/*.md           → the 6 existing posts, migrated to editable Markdown (source of truth)
scripts/build-blog.js       → turns each Markdown post into blog/<slug>.html + rebuilds homepage cards
scripts/post-template.html  → the page shell used to generate posts (do not publish as a page)
package.json                → declares the build (`npm run build`) + deps (marked, gray-matter)
netlify.toml                → now runs `npm run build` on every deploy
index.html                  → blog cards are now auto-generated between the BLOG:CARDS markers;
                              Netlify Identity widget added for staff login
.gitignore                  → ignores node_modules
```
Existing `blog/*.html` pages are now regenerated from `content/blog/*.md` on every build.

## One-time setup (≈10 minutes — these are the parts only you can do)

1. **Upload these files to the repo** (same drag-and-drop you already use), keeping the folder
   structure above. Do **not** upload `node_modules`.

2. **Enable Netlify Identity** — Netlify dashboard → your site → **Integrations / Identity** →
   **Enable Identity**.

3. **Enable Git Gateway** — Identity → **Services → Git Gateway → Enable**. (This lets the CMS
   commit posts back to GitHub on the editor's behalf.)

4. **Registration = Invite only** — Identity → **Registration preferences → Invite only**
   (so only staff you invite can log in).

5. **Invite your writers** — Identity → **Invite users** → enter each staff email. They get an
   email, click the link, set a password, and land on the editor. (You picked "several staff" —
   invite them all here; everyone has the same posting rights.)

6. Go to **https://www.barcelonamontessorischool.com/admin/** → log in → **Blog posts → New**.

> Optional: to require a review step before anything goes live, uncomment
> `publish_mode: editorial_workflow` in `admin/config.yml`. Posts then move Draft → In review →
> Ready, and only "Ready" posts publish.

## How staff post (day to day)
1. Open `/admin`, log in.
2. **Blog posts → New Blog post.**
3. Fill Title, Date, Author, Category, a short description, optionally a Hero image + gallery, then
   write the Body.
4. **Publish.** Netlify rebuilds (~1 min) and the post is live with its own page and a homepage card.

## Notes / follow-ups
- Post pages carry a pre-existing quirk from the current site: the top-left header logo uses an
  SVG symbol that isn't embedded in the standalone post pages, so it can render blank. It's
  unrelated to the CMS; happy to fix the post template separately.
- Generated pages now include **post-specific** social/SEO tags (title, description, canonical,
  Open Graph, Twitter) — an improvement over the old posts, which reused the generic site tags.
- Categories are a fixed list in `admin/config.yml` (Community, School Life, Arts, Celebrations,
  Montessori, Events, News) — easy to extend there.
