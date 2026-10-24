# Verification

The isolated smoke suite checks the full CLI, atomic imports, idempotent seed, dates, duplicate records, CSV quoting, Excel sheets and formula rejection, scope isolation, unknown values, legal holds, stale snapshots, review transitions, drafts, exports and escaped HTML. It requires an empty disposable database when TEST_DATABASE_URL is supplied.

CI covers Node 20 and 22 on Windows and Linux with PGlite, and PostgreSQL 17 on Linux. The final run record below is updated after execution. A workflow definition alone is not proof of a passing run.

## Executed on 24 October 2026

- Linux, Node 22.23.1, PGlite: PASS, 27 commands and 89 assertions.
- Linux, PostgreSQL 16.2 in a disposable local database: PASS, 27 commands and 90 assertions. The server was stopped after the run.
- npm run demo, npm run docs and npm run view: PASS. Three documents and two dashboards rendered.
- npm audit after the ExcelJS uuid override: zero reported vulnerabilities.
- README brand lint and the prose scan: PASS.
- [GitHub matrix run](https://github.com/Enterprise-DNA-OS/workspace-governance-for-claude-code/actions/runs/40053472278): jobs did not start because GitHub reported an account payment or spending-limit restriction. No Windows, Node 20 or PostgreSQL 17 execution is claimed. The portable test workflow remains ready to run when that account restriction is resolved.

The dashboard was inspected in a headless browser. Generated outputs are deliberately not committed.
