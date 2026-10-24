# Verification

The isolated smoke suite checks the full CLI, atomic imports, idempotent seed, dates, duplicate records, CSV quoting, Excel sheets and formula rejection, scope isolation, unknown values, legal holds, stale snapshots, review transitions, drafts, exports and escaped HTML. It requires an empty disposable database when TEST_DATABASE_URL is supplied.

CI covers Node 20 and 22 on Windows and Linux with PGlite, and PostgreSQL 17 on Linux. The final run record below is updated after execution. A workflow definition alone is not proof of a passing run.
