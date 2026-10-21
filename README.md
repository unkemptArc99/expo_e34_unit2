# Interview Atlas

A static React / TypeScript explorer of company-tagged coding question **coverage**. The workspace has an overview matrix, ranked company topic bars, dated-collection history, recency-window comparisons, and two- or three-company comparison views. Questions and classification details sit below the insights. Search, shared URLs, keyboard navigation, and mobile layouts are included.

## Run locally

Requires Node 24 and npm. The real imported data is included; no credentials or LeetCode subscription are needed.

```sh
npm ci
npm run dev
```

Open the printed localhost URL. `npm test` checks aggregation, both CSV adapters, link validation, enrichment, mirror deduplication, repeat imports, failed imports, and the publication gate. `npm run build` performs type checking and creates `dist/`. `npm run preview` serves that build.

`npm run test:e2e` runs desktop/mobile browser scenarios for drill-downs, ranking, practice links, time modes, company selection, filters, URL reloads, and overflow. It requires Chromium installed with `npx playwright install chromium`. The CI workflow installs it automatically. The browser suite covers the overview matrix, topic drill-downs, time modes, shared questions, the three-company limit, global search, accessible question details, saved filters, and desktop/mobile overflow. Server-rendered screen checks and unit tests independently validate real-data views and metric definitions. The current environment blocks Playwright localhost connections and Chromium startup, so these browser scenarios still need to be run on a machine that permits browser processes.

## Data

The explorer focuses on Meta, Google, Apple, Microsoft, and Bloomberg: 2,728 unique questions (2,669 with source topic tags). Broader retained raw imports remain available locally; the active manifest and catalog contain only the five selected companies. Original source tags are enriched from the retained collections before the focused catalog is selected, so narrowing the company list does not discard known tag evidence. Company names differing only in capitalization, spaces, or punctuation are consolidated. These are community-maintained datasets, not independently verified interview records. Three real snapshots are imported:

- `liquidslr/leetcode-company-wise-problems`, pinned at `03850eb5d16892514491cf1381c32ec0330a2719`: topic-bearing CSVs; June 2025 is advertised but the precise date is inconsistent, so the snapshot has no verified date. It contributes to the merged collection with this limitation recorded under About the data.
- `snehasishroy/leetcode-companywise-interview-questions`, pinned at `d1b6b443f496c39b3145a416617580c4e6a7bfdd`: February 21, 2026, as stated by its README.
- The same repository at `e095c259cfd036e3ddb6886e84d7075c2faac477`: July 12, 2026, as stated by its README, despite an August commit date.

Raw CSVs and provenance are retained in `data/raw`. `data/sources.json` configures adapters and verified dates. Generated immutable JSON files live in `public/data`; `manifest.json` points to the current topic catalog and snapshots. Only structurally valid HTTPS LeetCode practice URLs are retained. We do not scrape LeetCode, replicate problem statements/solutions, infer interview dates, or correct source acceptance-rate errors (acceptance rates are deliberately omitted).

The shared topic catalog uses canonical problem slugs and explicit source tags, deduplicates topic aliases, and enriches topic-less snapshots. Unknown questions remain Unclassified. Every manifest fixes one catalog version for consistent comparisons. A graph traversal tag does not automatically imply a Graph tag. Classification source repositories appear in question tag tooltips.

The customer-facing view assigns each classified question to one focus topic. Original source tags are retained internally for the audit. Question-bank filters do not change the overview denominator. For each company/window, questions from every source and snapshot are merged by canonical URL. Repeated snapshots of one repository count as one source. The Sources column counts distinct repositories listing a question; original frequency scores are retained in raw data but are not compared or summed across repositories. All time unions all available buckets. Identical raw-content mirrors are deduplicated. Recency windows overlap and cannot be subtracted to produce interview counts.

## Import and refresh

```sh
npm run ingest                   # rebuild JSON from retained raw imports
npm run ingest -- --fetch        # fetch configured pinned revisions if missing
npm run refresh                  # fetch pins and check current upstream branches
npm run ingest -- --import /absolute/questions.csv --source my-source --company Meta --window 30d --date 2026-07-12
```

Local imports accept either documented CSV adapter format; omit `--date` when unverified. Windows are `30d`, `3m`, `6m`, `older6m`, and `all`. An importer-provided date must be backed by source evidence.

JSON imports use a `.json` filename and an array of `{ "title": "Two Sum", "url": "https://leetcode.com/problems/two-sum/", "difficulty": "Easy", "topics": ["Array", "Hash Table"], "score": 75 }` records. Topics and scores are optional; scores can be null. The original JSON and its normalized CSV are both retained.

Refresh verifies each upstream file before storing a raw snapshot. Unchanged content creates no new historical observation. A new upstream revision is initially **undated**; record its snapshot date and evidence in its raw metadata only after review. Retrieval and commit dates never substitute for a source date. After confirming an undated snapshot, rerun ingestion.

The manifest is replaced only after every input is normalized and immutable output files are written. The website checks for changed manifests every 15 minutes and on focus; failed refreshes preserve the loaded dataset. The daily GitHub workflow runs at 04:17 UTC, checks/tests/builds, commits successful data updates, and dispatches the Pages workflow. Enable Actions write permission for that refresh workflow. GitHub schedules can be delayed and disabled after 60 days without repository activity; re-enable or manually dispatch when needed. The hosted site continues serving its last deployment independently of ingestion.

## Publication and GitHub Pages

**Public deployment is intentionally gated on the dataset reuse review agreed in the plan.** Public repositories are not automatically licensed for redistribution, and these source datasets have no verified permission in this checkout. Local development and tests work normally.

Record actual verified permission evidence for every repository in `data/permissions.json` (do not approve merely because it is publicly accessible):

```json
{
  "owner/repository": {
    "status": "approved",
    "evidence": "Reference to verified dataset permission covering this publication"
  }
}
```

Run `npm run ingest` and `npm run check:publish`. The Pages workflow fails before uploading artifacts if any imported source remains unverified. If permission is unavailable, keep these imports local or replace them with an authorized dataset.

After the review, push this project to a GitHub repository with a `main` branch. In Settings → Pages, choose GitHub Actions; run the `Deploy explorer to GitHub Pages` workflow. The build uses the repository name as its base path. Set `BASE_PATH=/` for a root-domain site. No GitHub repository/remote or deployment credentials were supplied with this workspace, so hosting must be connected there first.

## Interface and limitations

- Overview opens with a company × topic matrix. Switch between share and over-index. On phones, ranked bars are shown first; the full matrix remains available in a horizontally scrollable table.
- Company profiles show the leading and most distinctive topics, a fingerprint bar ordered by that company's share in the selected recency window, and topic bars ranked by the same share. Selecting a topic filters the question bank without changing the overview's denominator. Difficulty and text filters affect the question bank only.
- A single horizontal recency slider controls the selected bucket across the workspace. Recency remains relative to each source collection date, not today. All time is the default.
- Over time offers **Collection history** (the February 21 and July 12, 2026 collections; undated imports omitted) and **Recency windows** (the five overlapping source buckets). Each historical point merges collections at that exact date, not all past records. The fixed study-topic catalog is used at both dates. The historical question bank shows the latest plotted collection and labels its date. No daily/monthly interview counts are inferred.
- Comparisons accept up to three companies. Two companies use opposing horizontal bars; three use aligned bars in a table. Bars share one scale and a common topic order. The explicit sort control switches between largest share gap and global topic order. Aligned fingerprints use identical segment order.
- Over-index is topic share divided by the equally weighted average of available, nonempty companies, rather than a question-count-weighted average. Topic similarity is distribution overlap (`sum(min(shareA, shareB))`). Question-bank overlap is the Jaccard overlap of canonical question URLs. These are separate metrics.
- Samples below ten questions and matrix cells with fewer than ten tagged questions are marked as low data. Missing windows remain Unavailable, rather than observations of zero activity.
- The question bank supports text, topic, difficulty, sorting, and shared-only filters. Its Sources column counts repositories, not reported interviews. Question details expose the existing classification rationale, company membership across retained collections, related questions, and the original LeetCode link.
- Sidebar companies are sorted alphabetically. The Questions column counts unique questions in the selected recency window; unavailable coverage is shown as a dash. Search has a bordered input with a focus ring, and Share view is a distinct action button.
- The header's sun/moon button switches between light and dark mode. The first visit defaults to light mode; an explicit choice is saved locally and applied before the app renders. Charts, tables, search, and question details follow the selected theme.
- Global search finds companies and question titles/slugs. Questions open on LeetCode, where some may require Premium. No accounts, fabricated activity metrics, question statements, code execution, or community submissions are introduced.
- `.gitignore` excludes dependencies, builds, test artifacts, local environment files, logs, caches, and machine-local credentials. Source code, datasets, reports, and the reference PDF remain trackable.

## Primary study topics and audit

The site consistently uses the cleaned topic classification. Tagging-mode controls, internal review statuses, and audit report links are not exposed in the customer UI; legacy `tagging=source` URLs are ignored. Original CSV tags remain unchanged in the catalog `topics` field; `primaryTopic` and `topicReview` store the separate study classification for maintenance.

`data/topic-reviews.json` contains question-specific LLM decisions using only the existing topic vocabulary, with rationale, review basis, confidence, and public-statement evidence where actually checked. The current five-company catalog includes 13 public-statement reads and 261 concept-based question reviews. These are not 274 full-statement reviews. The mapping also retains five concept reviews from the previous company scope. Remaining multi-tag records receive explicitly marked low-confidence metadata suggestions from `scripts/curation.ts`. A single source tag is retained; insufficient evidence stays Unclassified. No Array-reduction quota is imposed.

Run `npm run ingest` after editing the review mapping. This regenerates `reports/tagging-summary.md`, the complete `reports/tagging-audit.json`, and a searchable HTML report for internal maintenance. Every question records original and primary tags, additions and omissions in the study view, company membership, method, confidence, and reason. The review version participates in the immutable catalog content, so refreshes retain decisions and load changed mappings. New questions remain suggestions until reviewed.
