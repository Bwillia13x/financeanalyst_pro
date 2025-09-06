# Vercel Preview Performance Audit

This workflow tests against a local preview (`vite preview`). To audit a Vercel Preview URL on pull requests:

1. In GitHub, add repository secrets:
   - `VERCEL_TOKEN` — your Vercel token
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (optional if project is linked automatically)

2. Add a job that waits for the Vercel Preview deployment and extracts its URL, then runs Lighthouse and budgets:

Example (add to a workflow):

```yaml
jobs:
  vercel-preview-audit:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel Preview
        id: vercel
        uses: patrickedqvist/wait-for-vercel-preview@v1.4.0
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          max_timeout: 900

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install deps
        run: npm ci

      - name: Run Lighthouse against preview
        run: |
          npx lighthouse ${{ steps.vercel.outputs.url }} \
            --output json --output-path perf-results.json --quiet --chrome-flags="--headless=new"
          node scripts/budget-check.js perf-results.json

      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: vercel-preview-perf
          path: perf-results.json
```

3. Optional: add budgets for other pages (workspace, portfolio) by looping through URLs.

Notes:
- Keep demo routes disabled in production to reflect real user experience (`VITE_ENABLE_DEMOS=false`).
- Preview performance is more realistic than localhost due to CDN/caching behavior.

