# The Aloka Foundation — Website

A standalone website for **The Aloka Foundation**. The site is pure static HTML/CSS/JS.

## What's inside

```
site/
├── index.html            Home: vision, "Why Aloka" (complementary mission), pillars,
│                         giving-tier impact, Life Works films, team preview
├── team.html             Kirk Hinkleman (founder) + the Life Works community team
├── give.html             Donation page with one-time/monthly toggle and amount tiers
├── request-support.html  Formal support request form (mirrors the current Wix form)
├── 404.html              Not-found page served by GitHub Pages
├── css/style.css         All styling (palette drawn from the Aloka logo)
├── js/main.js            Mobile nav, donation checkout, tier selection, footer year
├── assets/               Logo and team photos reused from the existing site
├── CNAME                 Custom domain for GitHub Pages (www.alokafoundationsd.org)
├── .nojekyll             Disables Jekyll processing on GitHub Pages
├── robots.txt            Search-engine crawl rules
└── sitemap.xml           Sitemap for search engines

.github/workflows/
└── deploy-pages.yml      Publishes site/ to GitHub Pages on every push to main
```

## Preview locally

```bash
cd site
python3 -m http.server 8741
# open http://localhost:8741
```

## Hosting: GitHub Pages at www.alokafoundationsd.org

The site is set up to be hosted on GitHub Pages with the custom domain
`www.alokafoundationsd.org`. That domain is registered at Cloudflare, which also runs
its DNS, and as of this writing it has no DNS records at all — so nothing is published
there yet. Pointing it at GitHub is therefore a fresh DNS setup, not a redirect away
from an existing host.

`www` is the canonical address. Once the DNS records below are in place, GitHub Pages
automatically redirects the bare `alokafoundationsd.org` to `www.alokafoundationsd.org`,
so both spellings work and search engines only ever index one of them.

### How the repository is published

`.github/workflows/deploy-pages.yml` uploads the contents of `site/` to GitHub Pages on
every push to `main`. Only `site/` is published, so `index.html` is served at the domain
root while this README stays in the repository without being reachable on the public
site.

The local `scratchpad/` folder holds draft bios and project notes. It is listed in
`.gitignore` and is deliberately never committed, because the repository has to be
public for GitHub Pages to be free.

GitHub-specific files already in `site/`:

- `CNAME` — records the custom domain (`www.alokafoundationsd.org`). With the Actions
  workflow the authoritative setting is Settings → Pages → Custom domain; this file is
  a documented fallback that takes over if the site is ever switched to branch-based
  deployment.
- `.nojekyll` — disables GitHub's Jekyll processing so files are served exactly as-is.
- `404.html` — shown by GitHub Pages for any URL that doesn't exist (uses absolute
  paths since it can be served from any missing path).
- `robots.txt` / `sitemap.xml` — search-engine basics, pointing at
  www.alokafoundationsd.org.
- Each page has a `<link rel="canonical">` tag pointing at its
  www.alokafoundationsd.org URL.

### Deploy steps

1. Create a GitHub account (free) if there isn't one yet.
2. Get this project onto GitHub as a **public** repository on the `main` branch (Pages
   on a free account requires a public repo). The workflow picks `site/` out of it.

   **Using GitHub Desktop:** File → Add Local Repository → choose this folder, then
   click **Publish repository**. In the dialog, **untick "Keep this code private"** —
   it is ticked by default, and a private repo disables free Pages.

   **Using the command line:** create a new empty repository on GitHub first (no
   README, `.gitignore`, or license), then:

   ```bash
   cd "/Users/.../Aloka"
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```

3. In the repo: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
   The first deploy runs automatically; watch it on the Actions tab. The site then goes
   live at `https://USERNAME.github.io/REPO/` within a couple of minutes. Confirm it
   looks right there before touching the domain.
4. Point the domain at GitHub by adding DNS records in Cloudflare. Do this before
   setting the custom domain in GitHub, because once the domain is set GitHub starts
   redirecting the `github.io` address to it.

   **What this means:** DNS is the internet's address book. When someone types
   `www.alokafoundationsd.org`, their browser asks DNS "which server holds this site?"
   The records below answer that question with GitHub's servers. Without them, the
   domain doesn't point anywhere; with them, GitHub serves the site at the domain.

   **How to do it:** log in at [dash.cloudflare.com](https://dash.cloudflare.com),
   click the `alokafoundationsd.org` domain, then **DNS → Records → Add record**. Add
   five records:

   | Type  | Name  | Content/Target       | Proxy status |
   | ----- | ----- | -------------------- | ------------ |
   | A     | `@`   | `185.199.108.153`    | DNS only     |
   | A     | `@`   | `185.199.109.153`    | DNS only     |
   | A     | `@`   | `185.199.110.153`    | DNS only     |
   | A     | `@`   | `185.199.111.153`    | DNS only     |
   | CNAME | `www` | `USERNAME.github.io` | DNS only     |

   Notes:
   - `@` means the bare domain (`alokafoundationsd.org` with nothing in front). The
     four A records are GitHub Pages' four servers — add all four as four separate
     records with the same name, so the site stays up if one is down.
   - Replace `USERNAME` with the GitHub username that owns the repository. The value is
     that username's github.io address, **not** the repository name.
   - **Proxy status must be "DNS only" (grey cloud), not "Proxied" (orange cloud).**
     Cloudflare defaults new records to Proxied. Leaving it on blocks GitHub from
     validating the domain and issuing the HTTPS certificate, and Cloudflare's script
     rewriting can break embedded third-party widgets (including a Zeffy donation
     form). Click the cloud icon on each record to toggle it grey.
   - Leave TTL at Auto.
   - Delete any pre-existing records on `@` or `www` first — they conflict with these.
   - Changes usually take effect within minutes, but can take up to 48 hours to reach
     everyone.
5. In the repo: Settings → Pages → Custom domain: enter `www.alokafoundationsd.org`,
   wait for the DNS check to pass, then tick **Enforce HTTPS** (certificate
   provisioning can take up to an hour, and the checkbox stays greyed out until the
   certificate is ready).
6. In the Life Works site's Wix dashboard (Settings → Development & integrations →
   Headless Settings → the Aloka client), add `www.alokafoundationsd.org` to **Allowed
   redirect domains** so the donation checkout activates (see below). This step becomes
   unnecessary once donations move to Zeffy.

To update the site later, just edit the files and push — the workflow redeploys
automatically.

## Two things to configure before launch

1. **Donations** — The "Complete Your Gift" button on `give.html` uses the Wix Headless
   APIs to create a per-donor checkout (with the donor's chosen amount and frequency) on
   the Life Works Wix site, then sends the donor to Wix's secure checkout page. If the API
   flow fails for any reason, the donor is sent to the existing donation form at
   lifeworks-sls.com/thealokafoundation instead, so the button always works.
   Setup required for the API flow to activate (all in `js/main.js`):
   - `WIX_CLIENT_ID` must be a headless OAuth client created on the lifeworks-sls.com
     site itself (its dashboard → Settings → Development & integrations → Headless
     Settings), NOT on a separate headless project. A client from a separate project
     cannot see the donation campaign, and every click will fall back to the form.
   - The deployed site's domain must be added to the client's allowed redirect domains
     in the same Headless Settings screen.
   - `DONATION_CAMPAIGN_ID` is the Wix Donations campaign ID
     (currently `5a511be7-ad8d-4993-8b2b-dda9a4ad98b7`).
2. **Support request form** — `request-support.html` opens the visitor's email app with a
   pre-filled message addressed to `kirk@lifeworks-sls.com` (no third-party form service
   needed). To change the destination, update `SUPPORT_EMAIL` at the top of the support-form
   section in `js/main.js` and the fallback mailto link in `request-support.html`.

## Switching the donation backend to Zeffy or PayPal

The site is pre-wired for this switch: `js/main.js` has a `DONATION_PROVIDER_URL`
constant that is currently empty. As soon as a URL is pasted there, the "Complete Your
Gift" button sends donors straight to that page and the Wix checkout flow is skipped
entirely — no other code changes needed. The steps:

1. **Set up the processor account** (this is the real work — it requires the
   foundation's nonprofit paperwork):
   - **Zeffy** ([zeffy.com](https://www.zeffy.com)) — free for nonprofits (0% fees;
     donors are invited to leave Zeffy an optional tip). Sign up with the foundation's
     EIN/nonprofit registration and bank account, then create a **Donation form**. In
     the form settings, set the suggested amounts to match the site's tiers
     ($25 / $50 / $100 / $250 / $500) and enable **monthly giving** so the site's
     one-time/monthly toggle has an equivalent on the payment page.
   - **PayPal** ([paypal.com/nonprofit](https://www.paypal.com/us/non-profit)) — set up
     a business account, complete charity verification to get the discounted nonprofit
     rate (~1.99% + $0.49 per transaction), then create a **Donate button** at
     paypal.com/donate/buttons and copy its hosted donate link. Enable recurring
     donations in the button settings for monthly gifts.
2. **Paste the URL into the site**: in `js/main.js`, set
   `DONATION_PROVIDER_URL = 'https://...'` (the donation form / donate link URL from
   step 1). Commit and push — GitHub Pages redeploys automatically.
3. **Test with a real gift**: make one small donation end to end and confirm the money
   arrives in the foundation's account and the donor receipt looks right.

Things to know before switching:

- **Where the money goes changes.** The current Wix flow deposits donations into Life
  Works' account and receipts come from Life Works. Zeffy/PayPal deposit into the
  foundation's own bank account and issue receipts in the foundation's name — cleaner
  once Aloka's 501(c)(3) status is confirmed, and required for donors to see "The
  Aloka Foundation" on their receipts.
- **Monthly donors don't migrate.** Recurring gifts live inside whichever processor
  set them up; switching later means every monthly donor must re-enroll. Pick the
  long-term processor before promoting monthly giving.
- **Amounts are configured on the processor's side.** The tier cards on the give page
  remain as impact storytelling, but the amount the donor actually pays is chosen on
  the processor's page — so mirror the site's tiers in the Zeffy/PayPal settings.
- **The old flow remains as a safety net.** If `DONATION_PROVIDER_URL` is ever set
  back to `''`, the button returns to the Wix checkout + Life Works fallback exactly
  as before.

### How Zeffy fits the GitHub Pages setup

Nothing about hosting on GitHub Pages constrains the Zeffy integration, and no
server-side code is needed either way. Zeffy offers two integration styles and both
work on a static site:

- **Link out** — the "Complete Your Gift" button opens Zeffy's hosted form. This is
  what `DONATION_PROVIDER_URL` already does, so it is a one-line change.
- **Embed** — Zeffy's donation form in an `<iframe>` on `give.html`, so donors never
  leave the site. GitHub Pages serves no `Content-Security-Policy` header, so the
  iframe loads without any extra configuration.

Two things are worth setting up in the same pass when we do this:

- Keep Cloudflare's proxy off (see the DNS step above). A proxied domain lets
  Cloudflare rewrite and defer scripts, which is a common cause of embedded donation
  forms failing to render.
- Zeffy can redirect donors to a custom page after a completed gift. If we want that,
  add a `site/thank-you.html` page and paste its URL
  (`https://www.alokafoundationsd.org/thank-you.html`) into the Zeffy form settings.

## Content sources

- Vision, mission, donation structure, and support-request form: the current
  [Aloka Foundation page](https://www.lifeworks-sls.com/thealokafoundation)
- Team bios and photos: the [Life Works team page](https://www.lifeworks-sls.com/team)
- Films: the three Vimeo shorts highlighting Life Works' work
- Visual identity (cream / brown / amber / teal, serif wordmark): the Aloka Foundation logo
