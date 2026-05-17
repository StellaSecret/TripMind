# Husky pre-commit setup

## Install (once per machine)

```bash
cd e2e
npm install          # installs husky + playwright
npm run prepare      # registers .husky/ with git
```

That's it. The hook runs automatically on every `git commit`.

## What it checks (< 5 seconds)

| # | Check | Blocks commit? |
|---|---|---|
| 1 | **Secret scan** — hardcoded API keys, tokens, passwords in staged JS/HTML/TS/JSON | ✅ Yes |
| 2 | **JS syntax** — `node --check` on every staged `www/js/*.js` file | ✅ Yes |
| 3 | **Test coverage reminder** — warns if `www/js/` changed but `e2e/tests/` not staged | ⚠️ Warning only |

## What it does NOT do (lives in CI instead)

- Playwright tests → 60s+, run in GitHub Actions on every push
- `npm audit` → runs in the `npm-security` CI job
- CodeQL → runs in the `codeql-analysis` CI job
- TruffleHog deep scan → runs in the `scan-secrets` CI job

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
