# Workspace Governance for Claude Code

An evidence review desk for Microsoft 365 workspace owners. The fictional demo is not a customer. Configure brand.json with the operator’s business identity.

## Work from records

Read the CLI before answering. Require --tenant on every scoped operation. A tenant here is a named review scope, not an authenticated security boundary. Source dates, unknown fields and hold status must travel with every answer. Imported snapshots are preserved. A new snapshot does not carry forward old review decisions.

## One route for every job

| Request | Recipe |
|---|---|
| activity | /activity |
| attention | /attention |
| changes | /changes |
| complete | /complete |
| compliance | /compliance |
| configure | /configure |
| create tenant | /create-tenant |
| customise | /customise |
| decide | /decide |
| docs | /docs |
| draft decision | /draft-decision |
| draft owner | /draft-owner |
| export | /export |
| external sharing | /external-sharing |
| help | /help |
| import | /import |
| inactive | /inactive |
| list | /list |
| log | /log |
| new view | /new-view |
| open review | /open-review |
| owner gaps | /owner-gaps |
| reopen | /reopen |
| retention due | /retention-due |
| reviews | /reviews |
| show | /show |
| snapshots | /snapshots |
| summary | /summary |
| tenants | /tenants |
| view | /view |
| weekly review | /weekly-review |

## Boundaries

Use scripts/governance.mjs for writes. Identify the actor and record the supplied evidence. Names are not authentication or electronic signatures. Do not record decisions or completion without an operator instruction for the actual review. The completion step records external verification, never executes a tenant action. No sends, live connections, automated permission changes or deletion.

Use a dedicated database and a trusted operator account. Database owners can change history. RLS blocks ungranted roles, but this is not a hosted multi-user permission system. Reports include every scope. Never seed a real business database. Back up the database and source exports securely.

## Files and checks

Migrations live in supabase/migrations, the seed in supabase/seed.sql and one CLI in scripts/governance.mjs. AGENTS.md routes every coding agent to this file and the same .claude/commands library. npm test uses an isolated database. Read docs/compliance.md and docs/replace-rencore-governance.md.

Omni by Enterprise DNA installs, customises and runs this system for one setup fee, then a retainer: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=rencore-governance
