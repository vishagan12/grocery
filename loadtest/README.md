# Sri Amman Supermarket — Load Testing Guide (k6)

This directory contains automated performance and concurrency verification scripts powered by **[k6](https://k6.io/)** (Free & Open Source).

---

## ⚠️ Critical Testing Rules

1. **Target Environment**: Run tests against **local development (`http://localhost:3000`) or Staging ONLY**.
2. **NEVER RUN AGAINST PRODUCTION**: Do not execute load tests against live production infrastructure or third-party webhooks.
3. **Free-Tier Fair Use**: Stay within Supabase Free Tier fair-use limits. Do not exceed 50 virtual users without dedicated staging provisioning.

---

## 1. Prerequisites & Installation

Install the free k6 CLI on your system:

### Windows (winget or chocolatey)
```powershell
winget install k6 --source winget
# or
choco install k6
```

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian / Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## 2. Test Execution

### Default Smoke Test (Read-Only Browsing & Search)
Runs with 50 Virtual Users (simulating 200+ active browsing users over 1 minute):

```powershell
k6 run loadtest/k6-smoke.js
```

### Testing Against Staging URL
```powershell
k6 run -e TARGET_URL=https://staging.yourdomain.com loadtest/k6-smoke.js
```

### Optional: Enabling the Write Scenario (Order Intake)
```powershell
k6 run -e ENABLE_WRITE_SCENARIO=true loadtest/k6-smoke.js
```

---

## 3. How to Read and Interpret Results

When k6 finishes executing, it prints a summary table in your terminal:

```text
    ✓ catalog status is 200
    ✓ catalog response has products
    ✓ catalog responds fast (< 300ms)
    ✓ home status is 200
    ✓ resolve shop status is 200

    checks.........................: 100.00% ✓ 4500      ✗ 0
    data_received..................: 18 MB   300 kB/s
    http_req_duration..............: avg=64.2ms min=12.1ms med=48.5ms max=320ms p(90)=115ms p(95)=142ms
    http_req_failed................: 0.00%   ✓ 0         ✗ 4500
    vus............................: 50      min=50      max=50
```

### Pass / Fail Criteria:

| Metric | Target SLA | Meaning |
|---|---|---|
| `http_req_failed` | **< 1.00%** | Fewer than 1% of all requests returned HTTP 5xx or connection drops. |
| `http_req_duration (p95)` | **< 800 ms** | 95% of requests completed in under 800 milliseconds. For cached catalog routes, target is < 300 ms. |
| `checks` | **> 99.00%** | Integrity checks confirming valid response payloads and catalog arrays. |

If `http_req_failed` exceeds 1.0% or `p(95)` exceeds 800ms, inspect your server CPU usage, memory, and database connection pool settings.
