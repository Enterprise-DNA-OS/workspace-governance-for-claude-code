---
description: "Workspace governance: new view. Use the documented CLI recipe and report the evidence."
---

# Add a read-only view

Translate the requested question into a SELECT over the existing views. Add it to views.json, with the review scope and source dates visible. Run npm run view, inspect the generated HTML and verify its rows against the CLI. Reuse scripts/lib/render.mjs. No server, no writes, no external assets containing private data.
