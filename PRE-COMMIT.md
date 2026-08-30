# Husky pre-commit setup

## Install (once per machine)

```bash
cd e2e
npm install          # installs husky + playwright
npm run prepare      # registers .husky/ with git

cd ../unit
npm install          # installs vitest for unit tests
```

## What it checks (< 20 seconds)

| # | Check | Blocks commit? |
|---|---|---|
| 1 | **Secret scan** — hardcoded API keys, tokens, passwords in staged JS/HTML/TS/JSON | ✅ Yes |
| 2 | **JS syntax** — `node --check` on every staged `www/js/*.js` file | ✅ Yes |
| 3 | **Unit tests** — Vitest suite for `calcScore`, `LRUCache`, `classifyError`, `MODE_COSTS` (~2s) | ✅ Yes |
| 4 | **Test coverage reminder** — warns if `www/js/` changed but neither `e2e/tests/` nor `unit/tests/` staged | ⚠️ Warning only |
| 5 | **Capacitor sync reminder** — warns if `www/` changed but no `android/` file is staged (run `npx cap sync android` before building) | ⚠️ Warning only |

Unit tests are skipped automatically if `unit/node_modules` is not installed yet (e.g. first clone).
Run `cd unit && npm install` to enable them.

## What it does NOT do (lives in CI instead)

- Playwright tests → 60s+, run in GitHub Actions on every push
- `npm audit` → runs in the `npm-security` CI job
- CodeQL → runs in the `codeql-analysis` CI job
- TruffleHog deep scan → runs in the `scan-secrets` CI job
- Coverage report upload → runs in the `unit-tests` CI job
- Mutation tests → `cd unit && npm run test:mutation` (Stryker, ~1-2min per module)
  runs in the `mutation-tests` CI job (5 modules in parallel). **Non-blocking**: only
  an infrastructure failure fails the job; missed mutants are reported as warnings
  in the `mutation-summary` job summary table. 4 provably-equivalent mutants are
  excluded per module (`exclude_re` in the workflow matrix).

## CI job graph

```
scan-secrets ──┐
codeql ─────────┼──► playwright-tests ──┐
npm-audit ──────┘                        ├──► deploy-pages
                                         ├──► build-android ──► release
unit-tests ─────────────────────────┐
mutation-tests ─► mutation-summary ──┤ (warnings only, never blocks)
```

Unit tests and Playwright run **in parallel**. Both must pass before deploy or Android build.
Mutation tests run in parallel too but never block deploy.

## Bypass (use sparingly)

```bash
git commit --no-verify -m "your message"
```

## Uninstall

```bash
cd e2e && npm uninstall husky
rm -rf e2e/.husky
# Remove "prepare" script from e2e/package.json
```
