# open-review

Read the records first and report unknowns explicitly. Use the selected scope, never infer one.

Run:

```bash
npm run gov -- open-review --tenant=DEMO --ref=SITE-05 --kind=inactivity --reviewer="Reviewer" --due-on=YYYY-MM-DD --actor="Operator"
```

Replace example values with operator-provided values. Add --json for machine output. If a reference is ambiguous, show the candidates and ask which one. Never send, change permissions, archive a Microsoft workspace or claim compliance from these records.
