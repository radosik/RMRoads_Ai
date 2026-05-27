# Claude Code contributor guide

See [`AGENTS.md`](./AGENTS.md) in this directory — it follows the [agents.md](https://agents.md) open convention and applies equally to Claude Code, Cursor, Cline, Aider, Continue, and anyone driving them.

This file exists so Claude Code finds project guidance under its native filename. The content is intentionally not duplicated — keep one source of truth.

A few Claude-Code-specific notes that don't belong in the agent-neutral file:

- **No `Co-Authored-By: Claude` line** in commits or PRs. The project rule is that contributions appear as the human contributor's own work. Strip the footer Claude Code adds by default.
- **Skills:** the [`anthropic-agent-skills`](https://github.com/anthropics/skills) marketplace `frontend-design` skill pairs well with the landing/dashboard styling work. Install with `/plugin install frontend-design@anthropic-agent-skills` if you'll be doing UI passes.
- **Plan mode** is appropriate before any multi-file refactor (i18n sweeps, schema changes, admin surface changes). The codebase has tenant-scoping rules that are easy to violate during fast edits.
