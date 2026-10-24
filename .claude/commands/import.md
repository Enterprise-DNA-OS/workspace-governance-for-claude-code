---
description: "Workspace governance: import. Use the documented CLI recipe and report the evidence."
---

# import

Read docs/replace-rencore-governance.md. Reconcile the export row count and selected scope, inspect headings and value vocabularies, then do a dry run. Import only when the operator requested it. Never silently invent missing fields.

Run:

```bash
npm run gov -- import rencore --tenant=FIRM --file=imports/workspaces.xlsx --source-on=YYYY-MM-DD --expected=COUNT --map=fixtures/rencore-map.json --actor="Operator" --dry-run
```

Replace example values with operator-provided values. Add --json for machine output. If a reference is ambiguous, show the candidates and ask which one. Never send, change permissions, archive a Microsoft workspace or claim compliance from these records.
