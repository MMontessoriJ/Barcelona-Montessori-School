# BMS Blog CMS + School Calendar — install & fix

## ⚠️ IMPORTANT: fix the folder nesting first
On the last upload, everything landed inside a **`bms-blog-cms/`** subfolder in the repo, so
Netlify served the old site and `/admin` returned 404. These files must sit at the **repo root**,
not inside a subfolder.

**To fix (one time):**
1. In GitHub, open the repo and **delete the `bms-blog-cms/` folder** (open it → ⋯ → delete, or
   delete the files inside it). 
2. **Upload the CONTENTS of this zip to the repo root** — when GitHub's "Add file → Upload files"
   opens, drag in the *individual items* below (or drag all of them together), NOT a wrapping
   folder:
   `index.html`, `netlify.toml`, `package.json`, `.gitignore`, `bms-calendar-2026-27.ics`,
   and the folders `admin/`, `scripts/`, `content/`, `blog/`.
3. Commit. Netlify auto-builds. `index.html` and `netlify.toml` here **replace** the old ones
   (they carry the build command, the auto-generated blog cards, the calendar section and the
   login widget).

You can confirm success: `https://<your-site>/admin/` loads the editor (not a 404).

## Netlify one-time setup (if not already done)
Dashboard → your site → **Identity → Enable**; then **Services → Git Gateway → Enable**;
**Registration → Invite only**; **Invite users** (add each staff writer). They accept the email,
set a password, and can post.

## What's included / changed
- **Blog CMS** at `/admin` (Decap CMS + Netlify Identity + Git Gateway).
  - **Draft → In review → Ready workflow is ON** (`publish_mode: editorial_workflow`): new posts
    are drafts; someone moves them to "Ready" to publish. To turn this off, remove that line in
    `admin/config.yml`.
- **6 existing posts** migrated to `content/blog/*.md` (the editable source).
- **Build step** (`npm run build`, run by Netlify): regenerates `blog/*.html` and the homepage
  blog cards on every publish.
- **Post-page logo fixed**: the brand owl/wordmark now renders on article pages (the SVG symbol is
  embedded in the post template).
- **School calendar** (`#school-calendar` section on the homepage):
  - Colour-coded key dates for 2026–27, a **link to the full PDF**, and an
    **"Add these dates to my calendar"** button (`bms-calendar-2026-27.ics`) that works with Apple
    Calendar, Outlook and any app, plus one-tap **Google Calendar** and **Apple subscribe** buttons.
  - The `.ics` is a real subscribable file — if you ever update it, subscribers get the changes.
  - Footer "School Calendar" now jumps to this section; the existing `/calendar` redirect resolves here.

## Posting a blog article (staff)
`/admin` → log in → **Blog posts → New** → fill the fields, add photos, write the body → **Publish**
(or "Set status: Ready" if the review workflow is on). Netlify rebuilds (~1 min) and it's live.

## Updating the calendar next year
Edit `bms-calendar-2026-27.ics` (or ask me to regenerate it) and the dates list in the
`#school-calendar` section of `index.html`.
