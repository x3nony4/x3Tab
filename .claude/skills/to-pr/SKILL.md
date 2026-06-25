---
name: to-pr
description: Create a PR following the project PR template.
disable-model-invocation: true
---

# To PR

Create a pull request using the project PR template.

## Process

### 1. Gather context

- Read the PR template from `docs/agents/pr-template.md`.
- Run `git log <base-branch>..HEAD --oneline` to collect commits.
- Extract issue references from commit messages (`#123`, `Closes #45`).
- If issue references found, fetch the issue body from the issue tracker to map acceptance criteria.

### 2. Fill the template

Replace the template placeholders:

- **What** — one-line summary + bullet list of key changes from the commit log.
- **Acceptance criteria** — copy ACs from the originating issue, prefixing `[x]` for completed ones. If no linked issue, write ACs based on what the commits accomplish.
- **Test plan** — fill in actual commands and manual steps. Default: `pnpm test:run`, `pnpm typecheck`, plus any manual flows relevant to the change.
- **Closes** — reference the issue(s) being closed.

### 3. Create the PR

Use `gh pr create`:

```bash
gh pr create --title "<title>" --body "<body>" --base <base-branch>
```

- Title: concise, from the `## What` one-liner.
- Base: default to `main`, or ask if uncertain.
- Body: the filled template.

### 4. Confirm

Show the PR URL. Do NOT merge.
