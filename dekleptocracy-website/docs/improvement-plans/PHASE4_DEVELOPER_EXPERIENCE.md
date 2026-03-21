# Phase 4: Developer Experience

## Context

Client has ESLint (flat config, React only) but server has none. No Prettier, no pre-commit hooks, no `.editorconfig`. CI only runs server tests — client build and linting aren't validated. No root README for developer onboarding. Code style is inconsistent across files (CRLF vs LF, mixed quote styles).

---

## Step 1: ESLint for Server

**New file:** `server/eslint.config.js`

- Use ESLint flat config (matches client convention)
- Target Node.js/ES modules
- Rules: `no-unused-vars` (ignore `_` prefix), `no-console` warn (logger.js exists), `no-undef`
- Add `"lint": "eslint ."` script to `server/package.json`
- Fix any violations surfaced by the initial run

---

## Step 2: Prettier (Client + Server)

**New file (root):** `.prettierrc`

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "semi": true
}
```

- Install `prettier` as root devDependency
- Add `eslint-config-prettier` to both client and server ESLint configs to disable conflicting rules
- Add root scripts: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`
- Add `.prettierignore` (dist, node_modules, coverage, .env*)
- Run `prettier --write .` once to normalize existing code, commit separately

---

## Step 3: `.editorconfig`

**New file (root):** `.editorconfig`

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

## Step 4: Pre-commit Hooks (Husky + lint-staged)

- Install `husky` and `lint-staged` as root devDependencies
- `npx husky init` — creates `.husky/` directory
- Configure `lint-staged` in root `package.json`:

```json
{
  "lint-staged": {
    "client/**/*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "server/**/*.js": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

- Pre-commit hook runs lint-staged; prevents broken code from landing

---

## Step 5: Expand CI/CD (GitHub Actions)

**File:** `.github/workflows/test.yml` (update)

Add jobs:
1. **lint** — runs `npm run lint` in both client/ and server/, `npm run format:check` at root
2. **build-client** — runs `npm run build` in client/ (catches build-breaking imports)
3. **test-server** — existing server test job (already works)

All three jobs run in parallel. PR checks require all three to pass.

---

## Step 6: Root README

**New file (root):** `dekleptocracy-website/README.md`

Sections:
- Project overview (1-2 sentences)
- Architecture diagram (already exists in docs/improvement-plans/README.md, move up)
- Prerequisites (Node 20+, MongoDB for local dev or use memory server)
- Quick start (`npm install`, `npm run dev`, env vars)
- Project structure (client/, server/, docs/)
- Running tests (`npm test` in client/ and server/)
- Deployment (Vercel frontend, Railway backend)
- Environment variables reference (point to .env.example files)

Keep it concise — link to detailed docs in `docs/` rather than duplicating.

---

## Implementation Order

```
Step 1 (server ESLint) → Step 2 (Prettier) → Step 3 (.editorconfig) → Step 4 (pre-commit hooks) → Step 5 (CI/CD) → Step 6 (README)
```

Steps 1-3 can be done in a single session. Steps 4-5 build on them. Step 6 is independent.

## Estimated Effort

| Step | Effort | Notes |
|------|--------|-------|
| 1. Server ESLint | 15 min | Config + fix violations |
| 2. Prettier | 20 min | Config + initial format pass |
| 3. .editorconfig | 2 min | Drop-in file |
| 4. Pre-commit hooks | 10 min | husky + lint-staged |
| 5. CI/CD expansion | 15 min | Add lint + build jobs |
| 6. Root README | 15 min | Write from scratch |

## Files Changed/Created

- `server/eslint.config.js` (new)
- `server/package.json` (add lint script)
- `.prettierrc` (new)
- `.prettierignore` (new)
- `.editorconfig` (new)
- `package.json` (root — add format scripts, husky, lint-staged)
- `.husky/pre-commit` (new)
- `.github/workflows/test.yml` (expand)
- `README.md` (new)
- Client + server ESLint configs (add prettier compat)
