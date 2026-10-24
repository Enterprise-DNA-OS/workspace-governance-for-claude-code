# Workspace Governance for Claude Code

Know who owns each Microsoft 365 workspace, what has gone quiet and which sharing decisions still need evidence. Keep that review record in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free under MIT. Install and run the demo. | Your Rencore exports, review rules, fields and documents. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=rencore-governance) · [Instead of Rencore Governance](https://enterprisedna.co/omni/instead-of/rencore-governance?utm_source=github&utm_medium=readme&utm_campaign=rencore-governance)

## Start with the weekly review

Node 20 or later:

```bash
git clone https://github.com/Enterprise-DNA-OS/workspace-governance-for-claude-code.git
cd workspace-governance-for-claude-code
npm install
npm run demo
npm run gov -- owner-gaps --tenant=DEMO
npm run gov -- external-sharing --tenant=DEMO
npm run docs
npm run view
```

Open this folder with Claude Code, Codex, OpenCode or Cursor. They share CLAUDE.md, AGENTS.md and the recipes in .claude/commands. PGlite runs locally without installing a database server. DATABASE_URL selects PostgreSQL and DATA_DIR selects a different local directory. Use a dedicated database with a trusted owner connection. Never seed real business data.

The fictional Kauri Advisory example includes an ownerless SharePoint site on hold, confidential material shared externally, an overdue sharing review and incomplete evidence. A second scope has an old export. Unknown values remain unknown, so an incomplete export never becomes a clean result.

## The five weekly jobs

Check owner coverage, inspect inactive workspaces, review external sharing, review retention and holds, then close the evidence loop with the named reviewer. The Monday review combines the summary, attention list and review register. There are 27 CLI commands and 31 slash recipes, including drafts, documents, views and customisation.

Every scoped command needs --tenant. This selects a named review scope, not an authenticated tenant boundary. Use one export covering the agreed scope. The tool preserves each import as a dated snapshot and reconciles its row count. The latest snapshot drives current findings. Reviews stay attached to the snapshot that supported them and cannot be decided from superseded or stale evidence.

Decision actors must match the assigned reviewer and differ from the opener. Completion requires a different verifier and evidence of work done outside this system. Names are supplied by the operator, not authenticated signatures. Nothing here connects to Microsoft, revokes access, archives a site, deletes records or sends messages.

## Ten questions this build answers

These are tested questions, not claims that Rencore cannot answer them.

1. Which workspaces have no recorded accountable owner? owner-gaps
2. Which workspaces have activity older than our own threshold? inactive
3. Which externally shared workspaces hold confidential or restricted records? compliance
4. Which workspaces have an unknown sharing setting? external-sharing
5. Which retention reviews are due or missing? retention-due
6. Which inactive workspaces are on hold? inactive
7. Which review is overdue, and who owns it? reviews
8. Which source export is too old to support a decision? compliance
9. What changed between the last two imports? changes
10. Who recorded a decision, reopened it or verified completion? activity

## Bring your Rencore inventory

Export the inventory data grid to Excel, including the columns needed for your agreed review scope. Rencore's report-definition export is not the data. Review actual headings and values, then import in one command:

```bash
npm run gov -- import rencore --tenant=FIRM --file=imports/workspaces.xlsx --source-on=2026-10-24 --expected=50 --map=imports/our-map.json --actor="Your name" --dry-run
```

Create the empty FIRM scope first with create-tenant. Replace the example date, row count and mapping with your actual export details. Remove --dry-run to save the validated snapshot. CSV is also supported. [Export steps, mapping, supported values and reconciliation](docs/replace-rencore-governance.md).

The fixtures are synthetic importer examples, not genuine vendor exports. Configurable reports have different headings. Excel input accepts plain cells and dates, rejects formulas and rich content, and requires a sheet name when multiple sheets exist. The importer does not read files within a workspace, full member lists, permission inheritance, licensing invoices or automation definitions.

## Documents and views

Change brand.json for the business name, colours and logo. npm run docs renders a governance review pack per scope and a decision record per review. npm run view renders the weekly desk and sharing/retention dashboards. These are private read-only HTML files containing all scopes in the database. Review before sharing and print to PDF locally when needed.

Export current inventory to CSV or the complete scope history to JSON. Existing output files are never overwritten. JSON is an archive, not a database restore format. Back up the underlying database for recovery.

## Your first hour: ten things to ask for

1. Put our business name on the review pack.
2. Explain the ownerless site in the demo.
3. Show where confidential records are shared externally.
4. Check the headings in our inventory export.
5. Import one agreed review scope with its source date.
6. Set our internal inactivity threshold.
7. List retention reviews that need an owner decision.
8. Open a review for an inactive workspace on hold.
9. Draft an owner follow-up without sending it.
10. Add our internal business-unit field.

/customise writes a forward migration and tests the requested change. /new-view adds a report through the shared renderer. [What a screen adds](docs/why-no-front-end.md).

## Record checks and verification

[Compliance references and limits](docs/compliance.md) explain the NZ and AU privacy principles behind the review prompts. These are evidence checks, not legal findings or a substitute for Microsoft controls. Internal review periods are configurable business rules, not statutory deadlines. A hold blocks an archive recommendation even when the workspace is old.

npm test applies migrations and seed twice in a temporary database, then exercises all commands with spreadsheet imports, invalid rows, duplicate imports, scope isolation, stale snapshots, review transitions, drafts, exports and escaped HTML. The CI matrix runs Node 20/22 on Windows and Linux, plus PostgreSQL 17. [Verification record](docs/verification.md).

ExcelJS uses the patched uuid 11 dependency through an explicit override. Its used v4 interface is exercised by the spreadsheet tests. No paid service or API key is needed.

## Price context and fit

Rencore's current pricing is privately quoted. Historical UK procurement establishes a five-figure annualised bill, not a current public tariff or a verified NZ/AU small-business invoice. [Research, six scores and scope](docs/research.md).

This replaces an export-based workspace review process. Rencore also scans live environments and performs automated remediation. Enterprise DNA scopes those connections and controls separately when building your version. There is no claim of full platform parity.

## Built and run for you

Enterprise DNA maps the agreed history, builds your fields and review rules, and adds an authorised web view or live connections when agreed. Omni by Enterprise DNA runs it for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=rencore-governance).

MIT. Not affiliated with Rencore, Microsoft or Anthropic. Hosting and coding-agent usage have their own costs.
