---
name: project-looknbook
description: This is a cal.diy fork called looknbook (domain looknbook.app). Tracks product direction and feature removal preferences.
metadata:
  type: project
---

This project is a fork of cal.diy named **looknbook** (domain: **looknbook.app**). It was previously branded "Ceibafy" — rebranded to looknbook in the branding phase.

**Why:** Building a stripped-down, focused scheduling product on top of cal.diy.

**Feature removal approach:** Comment out or use conditional rendering rather than deleting inline code, marked with `// [ceibafy]` tags (the marker convention was kept even after the looknbook rename) — this allows features to be re-enabled later. Only fully delete code when it lives in a completely separate, self-contained file or package that can be safely removed.

**How to apply:** When hiding UI elements, navigation items, route handlers, or feature flags, prefer `{/* ... */}` JSX comments, commented blocks, or `if (false)` guards. Reserve hard deletes for isolated files/packages.

**Brand/theme:** Green palette — primary `#9AB17A`, hover `#C3CC9B`, accent fill `#E4DFB5` (dark `#2D3B22`), warm bg `#FBE8CE` (dark `#1E2A18`). Tokens live in `packages/config/theme/tokens.css`; brand name driven by `NEXT_PUBLIC_APP_NAME` in `.env`.

**Major changes so far (phases 1–9):** Removed App Store, third-party integrations (location picker limited to In Person/Phone), video conferencing, webhooks, the developer/API section, payments tab, and "powered by" branding — all via reversible `// [ceibafy]` comment-outs and `CEIBAFY_HIDE_*` redirect flags in `next.config.ts`. Deleted `apps/docs` (self-contained). Google Calendar integration left untouched (needed for availability sync).
