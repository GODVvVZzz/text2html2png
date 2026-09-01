# GitHub repository setup

Recommended public repository metadata:

- **Name:** `text2html2png`
- **Description:** Turn structured text into polished HTML diagrams and high-resolution PNGs — 8 diagram types × 7 themes, local-first, agent-native.
- **Website:** `https://godvvvzzz.github.io/text2html2png/` — update this if you publish under a different account, and change `REPO_SLUG` in `scripts/build-gallery.mjs` to match.
- **Topics:** `agent-skills`, `claude-code`, `codex`, `cursor`, `diagram`, `data-visualization`, `html`, `png`, `flowchart`, `architecture-diagram`, `local-first`

Repository settings:

- enable Issues and Discussions;
- enable private vulnerability reporting;
- enable branch protection for `main` and require CI;
- enable Dependabot security updates;
- set **Pages → Source** to `Deploy from a branch`, branch `main`, folder `/docs`; the gallery is a static generated page with no build step;
- upload `assets/social-card.png` (1280×640) as the social preview image;
- publish the first reviewed commit as `v1.0.0` with the generated `.skill` asset.

After changing any example, regenerate the published page so the site matches the repository:

```bash
node scripts/build-gallery.mjs
```

Before making the repository public, confirm the license choice and confirm that every example, asset, and document is safe to publish.
