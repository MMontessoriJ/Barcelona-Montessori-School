# BMS Website — Deployment Notes (v8, self-hosted images)

## What changed in this build
1. **Back-to-top button fixed** — the floating "Talk to Admissions" widget no longer
   blocks clicks on the back-to-top button (contact-widget panel is now absolutely
   positioned, so the closed widget collapses to just its toggle button).
2. **Images self-hosted** — all 72 image references now point to a local `/images/`
   folder instead of Squarespace. You must run the download step below once.
3. **Launch files added** — `_redirects`, `netlify.toml`, rebuilt `sitemap.xml`,
   OG/Twitter preview image, removed obsolete `htaccess.txt`.

## Step 1 — download the images (run once, locally)
From this folder (the one containing index.html), run:

    bash download-images.sh

This creates ./images/ and downloads all 72 assets from Squarespace, named per
`image-manifest.json`. It reports how many succeeded/failed; re-run to retry failures.
(macOS/Linux have curl built in. On Windows, use Git Bash or WSL.)

After this, you no longer depend on Squarespace.

## Step 2 — deploy
### Netlify
- Drag this whole folder into the Netlify dashboard, OR connect the GitHub repo.
- `_redirects` and `netlify.toml` are picked up automatically.

### GitHub Pages
- Push this folder to a repo, enable Pages on the branch root.
- NOTE: GitHub Pages does NOT support `_redirects`/`netlify.toml` — the old-URL
  redirects will not work there. Netlify is recommended for that reason.

## Before you go live — still TODO (not code issues)
- Replace GA4 placeholder `G-XXXXXXXXXX` in index.html with the real Measurement ID.
- Governance/team section: India d'Urso is not listed; "Executive Committee" grouping
  and Tim's title differ from the CIM (see chat notes).
- Multilingual (EN/ES/CA/FR) support present on the live site is not in this build.
- Only 6 of the live blog posts are migrated; old blog URLs will 404 unless added.
