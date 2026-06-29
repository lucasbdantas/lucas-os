# Overnight Handoff - Phase 1

Date: 2026-06-29

## Implemented

- Added manual Domains CRUD at `/domains`.
- Domains can be created with name, description, color, and icon.
- Existing non-system domains can update description, color, and icon.
- Existing non-system domains can be activated or deactivated.
- Inbox is highlighted as a system domain and cannot be edited or deactivated through this UI.
- Domains page now shows per-domain project counts and open task counts.
- `/tasks` domain selector now includes active domains plus Inbox explicitly.
- README now includes a short Phase 1 checklist.

## Files Changed

- `src/app/(app)/domains/page.tsx`
- `src/app/(app)/tasks/page.tsx`
- `src/components/domains/domain-form.tsx`
- `src/components/domains/domain-list.tsx`
- `src/lib/domains/actions.ts`
- `README.md`
- `docs/overnight-handoff-phase-1.md`

## Manual Test Plan

1. Run `npm run dev`.
2. Log in with Supabase Auth.
3. Open `/domains`.
4. Create a new domain with a unique name.
5. Try creating another domain with the same name and confirm a friendly duplicate error appears.
6. Update description, color, and icon for a non-Inbox domain.
7. Deactivate and reactivate a non-Inbox domain.
8. Confirm Inbox remains system, highlighted, and cannot be deactivated.
9. Open `/projects` and confirm only active domains are available in the project form.
10. Open `/tasks` and confirm active domains plus Inbox are available in the task form.
11. Open `/today` and confirm domain/task/project counts still load.

## Still Missing In Phase 1

- Manual CRUD for notifications.
- Manual CRUD or display for app settings.
- Better task/project form filtering and client-side dependent selects.
- Broader empty/error states across all operational pages.
- More complete mobile polish.

## Known Limitations

- Domains cannot be renamed or deleted.
- Inbox cannot be edited in this phase.
- Domain deactivation does not move or alter existing projects/tasks.
- Project selection in the task form is not dynamically filtered by selected domain.
- Counts are computed in app code from RLS-filtered rows, which is fine for Phase 1 scale but may need RPC or views later.

## QA

Run before commit:

```powershell
npm run lint
npm run build
```

## Recommended Commit

```powershell
git add README.md docs/overnight-handoff-phase-1.md "src/app/(app)/domains/page.tsx" "src/app/(app)/tasks/page.tsx" src/components/domains src/lib/domains
git commit -m "feat: add manual domain CRUD"
```
