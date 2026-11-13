# MONTHLY — audit-based Next.js reconstruction

Run on Windows from this folder in VS Code:
1. `npm.cmd install`
2. `npm.cmd run dev`
3. Open http://localhost:3000

Data is stored in browser localStorage. This is a reconstruction from the migration audit, not the original source or a pixel-perfect port. It does not connect to the original Lovable database. Auth, secure cloud sync and live Monty AI are not configured. Do not use as the sole store of real financial records until backup/restore, security, and all acceptance tests have been independently verified.

Restore validates the backup before changing current data. Compatible older backups may omit `openingOverrides`, `budgets`, `totalBudgets`, `goals`, `foodFunding`, or `chat`; those fields default to empty objects or arrays. An omitted transaction account defaults to `others`. An omitted version is treated as version 1; other unsupported versions or malformed data are rejected. Failed restore leaves current data unchanged. Invalid saved local data is not overwritten automatically; restore a valid backup to resume saving.
