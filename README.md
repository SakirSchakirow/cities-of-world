# Cities of World

An interactive 3D globe geography chain game: name a city that starts with the last letter of the previous one.
Distance scoring, misspelling tolerance, solo vs. computer or two-player shared-keyboard play.

Runs entirely in the browser — no backend and no API keys.

## Run locally

```bash
bun install   # or: npm install
bun run dev   # http://localhost:3000
```

## Build

```bash
bun run build   # static output in dist/
```

## Deploy

Pushing to `main` builds and publishes the site to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: repository **Settings → Pages → Source: GitHub Actions**.

## Legal

The same information is shown in the game under **Privacy & Disclaimer**.

### Legal notice (Impressum / Offenlegung)

Media owner (Medieninhaber): Zakir Shakirov, Graz, Austria.

Disclosure pursuant to § 25 of the Austrian Media Act (Mediengesetz): private, non-commercial geography game
with no intention of influencing public opinion.

### No warranty

This game is provided free of charge, "as is" and "as available", without any warranty of any kind, express or
implied, including warranties of correctness, completeness, availability, fitness for a particular purpose, or freedom
from errors. It may be changed, interrupted or taken offline at any time without notice.

### Limitation of liability

To the fullest extent permitted by applicable law, the creator accepts no liability for any direct, indirect,
incidental or consequential damages, losses or costs arising from the use of, or inability to use, this game, its
source code or the information it contains. This does not limit liability that cannot be excluded by law, in
particular for intent, gross negligence, or injury to life, body or health.

### Accuracy of geographic information

City names, spellings, coordinates, population figures, distances, scores and map outlines are for entertainment and
educational purposes only. They may be incomplete, outdated or inaccurate and must not be used for navigation, travel
planning, research or any other decision.

The names, borders and outlines shown do not imply any opinion concerning the legal status of any country, territory,
city or area, or of its authorities, or concerning the delimitation of its frontiers or boundaries.

### Privacy

- The game runs entirely in the browser. Player names, entries and scores exist only in memory and are gone when the
  page is closed or reloaded. Nothing is sent to or stored on a server by the game itself.
- No cookies, no analytics, no advertising, no tracking.
- **Hosting:** the site is served by GitHub Pages (GitHub, Inc.), which processes technical data such as IP address,
  browser type and access time to deliver the page. See the
  [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- **Fonts:** loaded from Google Fonts (Google LLC), so the browser sends the visitor's IP address to Google. See the
  [Google Privacy Policy](https://policies.google.com/privacy).
- **Share buttons:** LinkedIn, X and WhatsApp open only when clicked, under those platforms' own terms and privacy
  policies.

### External links

This project links to third-party websites. The creator has no influence over their content and accepts no
responsibility for it; the respective provider or operator is solely responsible. No unlawful content was apparent at
the time of linking. If any infringements become known, such links will be removed promptly.

### Trademarks and affiliation

All trademarks, service marks and names referenced — including "Google", "GDG", "Google Developers Group", "LinkedIn",
"X", "WhatsApp" and "GitHub" — are the property of their respective owners. This is an independent, non-commercial
project and is not affiliated with, sponsored by, or endorsed by Google LLC, any GDG chapter, or any other company
named here.

### Data sources and third-party licenses

| What | Source | License |
|---|---|---|
| City names, Latin-script spellings, coordinates, population (`src/data/worldCities.json`) | [GeoNames](https://www.geonames.org/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| A few German city names (e.g. Wien, Mailand), added by hand in `src/utils/cityEngine.ts` | — | Same as this project |
| Globe outlines | [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) | Public domain (data), ISC (package) |
| Libraries: React, Three.js | npm | MIT |
| Libraries: lucide-react, topojson-client | npm | ISC |
| Fonts: DM Sans, JetBrains Mono, Outfit | [Google Fonts](https://fonts.google.com/) | SIL Open Font License 1.1 |

The GeoNames data keeps its CC BY 4.0 license regardless of the license of this project's own code.

### Copyright

Copyright © 2026 Zakir Shakirov. All rights reserved.

No open-source license has been granted for this project's own source code. You may view and fork it on GitHub as
permitted by GitHub's Terms of Service; any other use requires permission.
