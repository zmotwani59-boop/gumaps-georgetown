# GUMAPS Website

Official website for the Georgetown University Minority Association of Pre-Health Students (GUMAPS).

## Board website editor

The editing dashboard is at **/admin/** on the hosted website, or [gumaps/admin/index.html](gumaps/admin/index.html) in this repository.

Board members can update:
- GUMAPS events
- Volunteer and service opportunities, capacity and registration links
- Board names, responsibilities, and photo URLs
- Research group listings and recruiting status

How publishing works:
1. The board member must be an **invited collaborator** on this GitHub repository.
2. Open `/admin/`, select or add an item, and edit the form fields.
3. Click **Submit update**. This opens a prefilled GitHub issue in a new tab.
4. Sign in to GitHub and click **Submit new issue**.
5. The [publishing workflow](.github/workflows/publish-site-edits.yml) checks GitHub's collaborator status, validates the input, updates [site-content.json](gumaps/site-content.json) and closes the issue with a confirmation.
6. The hosting provider redeploys the updated website if automatic deployment is enabled.

No API tokens, passwords or private keys are used or stored by the dashboard. GitHub collaborator membership is the editing authorization. To revoke editing, remove the person as a repository collaborator.

If a submitted update does not appear, check the issue and the repository's Actions tab. The publisher needs GitHub Actions enabled and permission to write repository contents.

## Site layout

- `gumaps/index.html` — homepage
- `gumaps/volunteer.html` — volunteer opportunities page
- `gumaps/research-fair.html` — Undergraduate Research Opportunities Fair directory (November 4, 2026)
- `gumaps/research-fair-print.html` — existing static printable fair guide
- `gumaps/research-qr.svg` — fair QR graphic
- `gumaps/site-content.json` — structured public content edited through the dashboard
- `gumaps/content-renderer.js` — renders the structured content on public pages
- `gumaps/admin/index.html` — board-friendly editing interface
- `.github/scripts/apply-website-update.js` — validates submissions and saves content

## Hosting

Use the new repository `zmotwani59-boop/gumaps-georgetown`, branch `main`, with static publish directory `gumaps`. GitHub updates should automatically trigger hosting redeployment when configured.

The original repository `mcat-study-timer` and its Zahra HQ backend should not be deleted as part of this migration.

## Limitations

Board photos currently accept direct publicly accessible image URLs; there is no built-in image file uploader.

The Research Fair's printable guide is currently static and does not automatically regenerate from editing the directory. Recheck the printed guide before printing.

The board dashboard does not publish immediately on clicking Submit update: the board member must submit the prepared GitHub issue in the newly opened tab.
