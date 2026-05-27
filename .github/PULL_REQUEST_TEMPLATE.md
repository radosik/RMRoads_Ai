<!--
Thanks for the PR. Please fill in the sections below.
For style rules see CONTRIBUTING.md. For AI-agent contributions see app/AGENTS.md.
-->

## Summary

<!-- 1-3 lines: what does this change and why? -->

## Test plan

<!-- Numbered list of manual checks you ran. -->

1.
2.

## Screenshots

<!-- For UI changes. Before/after side-by-side preferred. Delete the section if not applicable. -->

## Checklist

- [ ] `npm exec tsc -- --noEmit` passes in `app/`
- [ ] `wasp start` runs without runtime errors
- [ ] New strings in **all four** locale files (`en.ts`, `de.ts`, `fr.ts`, `es.ts`)
- [ ] DB changes have a Prisma migration and the Wasp action's `entities: [...]` is updated
- [ ] Multi-tenant scoping preserved (every Prisma write is org-scoped)
- [ ] Commit messages follow the style in CONTRIBUTING.md (≤ 50 char subject, imperative, no AI attribution)
