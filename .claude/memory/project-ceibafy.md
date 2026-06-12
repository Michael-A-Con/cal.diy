---
name: project-ceibafy
description: This is a cal.diy fork called Ceibafy. Tracks product direction and feature removal preferences.
metadata:
  type: project
---

This project is a fork of cal.diy named **Ceibafy**.

**Why:** Building a stripped-down, focused scheduling product on top of cal.diy.

**Feature removal approach:** Comment out or use conditional rendering rather than deleting inline code — this allows features to be re-enabled later. Only fully delete code when it lives in a completely separate, self-contained file or package that can be safely removed.

**How to apply:** When hiding UI elements, navigation items, route handlers, or feature flags, prefer `{/* ... */}` JSX comments, `if (false)` guards, or similar reversible techniques. Reserve hard deletes for isolated files/packages.

**Changes made so far:**
- Removed App Store link from sidebar navigation (`Navigation.tsx`) — code deleted inline (was a nav item block)
- Blocked `/apps` route via redirects in `next.config.ts`
- Filtered location picker to only "In Person" and "Phone" options (`packages/app-store/server.ts`) — removed third-party integrations block
- Google Calendar integration left untouched (needed for availability sync)
