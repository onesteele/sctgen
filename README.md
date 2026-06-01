# Summit Securities — Certificate Portal

A static website for issuing, downloading, and verifying client award certificates
(Payout, Trade, and Crypto Withdrawal). No server or database — it runs entirely in
the browser and deploys to **GitHub Pages**.

## Pages

| Page | Who | What it does |
|------|-----|--------------|
| `index.html` | Team (password) | Sign in + portal home |
| `generator.html` | Team (password) | Create a certificate, preview live, download **PDF + PNG**, add to the verification registry |
| `verify.html` | Public | Look up a certificate by its code to confirm it's genuine |

## How it works (the important part)

There's no database, so **verification is powered by `data/certificates.json`** — a file
committed to the repo. The flow for issuing a verifiable certificate:

1. Open **Create Certificate**, fill in the details, download the **PDF/PNG**.
2. Click **“Add to registry”**, then **“Download certificates.json”**.
3. Replace `data/certificates.json` in the repo with the downloaded file, then **commit & push**.
4. Once GitHub Pages redeploys, anyone can verify that certificate's code at `verify.html`.

Each certificate carries a unique code (e.g. `SS-PO-20260528-A1B2C3`) and a **QR code**
that links straight to the verify page.

## Configuration — `js/config.js`

Everything you'll normally change lives here:

- **Company name / tagline**
- **Signatory names & titles** (left = Head of Risk & Compliance, right = CEO)
- **Certificate wording** per type
- **Team password** — stored as a SHA-256 hash. Current password: `summit-admin-2026`.
  To change it, run:
  ```sh
  printf 'YOUR-NEW-PASSWORD' | shasum -a 256
  ```
  and paste the result into `passwordHash`.

> ⚠️ The password keeps casual visitors out, but a static site can't hide secrets from
> someone who reads the page source. It's a front-door lock, not a vault.

## Brand assets — `assets/`

- `logo.png` — main logo, centered on each certificate (currently the Full Logo)
- `monogram.png` — used inside the security seal + as the favicon
- `wordmark.png` — alternate, not used by default
- `signature-ceo.png`, `signature-risk.png` — *(optional)* drop in transparent PNGs of
  the real signatures; if absent, a blank signature line is shown.

Originals (6000×6000) are archived in `brand-source/`. To feature a different logo, just
replace `assets/logo.png`.

## Run locally

It's static, but `fetch()` needs a web server (not `file://`):

```sh
cd summitcertificates
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Your site goes live at `https://<user>.github.io/<repo>/`.

(`.nojekyll` is included so GitHub serves all files as-is.)
