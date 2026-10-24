---
description: "Workspace governance: complete. Use the documented CLI recipe and report the evidence."
---

# complete

Read the decision first. Record only external completion the operator actually verified. The verifier must differ from the decision actor. This does not execute a Microsoft change.

Run:

```bash
npm run gov -- complete --tenant=DEMO --review=REVIEW-ID --evidence="External verification reference" --actor="Verifier"
```

Replace example values with operator-provided values. Add --json for machine output. If a reference is ambiguous, show the candidates and ask which one. Never send, change permissions, archive a Microsoft workspace or claim compliance from these records.
