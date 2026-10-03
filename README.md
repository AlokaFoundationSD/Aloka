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
├── thank-you.html        Post-donation confirmation page (Zeffy redirect target)
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

1. **Donations** — see "Donations via Zeffy" below. The wiring is done; the remaining
   work is finishing the Zeffy account setup so the form can accept payments.
2. **Support request form** — `request-support.html` opens the visitor's email app with a
   pre-filled message addressed to `kirk@lifeworks-sls.com` (no third-party form service
   needed). To change the destination, update `SUPPORT_EMAIL` at the top of the support-form
   section in `js/main.js` and the fallback mailto link in `request-support.html`.

## Donations via Zeffy

The "Complete Your Gift" button sends donors to the foundation's Zeffy form:

```
https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-25558
```

Zeffy is free for nonprofits (0% fees; donors are invited to leave Zeffy an optional
tip), and money lands in the foundation's own bank account with receipts issued in the
foundation's name.

How the pieces fit:

- `DONATION_PROVIDER_URL` in `js/main.js` holds the form URL. While it is set, the Wix
  checkout code further up the file is skipped entirely. Setting it back to `''`
  restores the old Wix flow, which is why that code is still present.
- The same URL is also the static `href` on the button in `give.html`, so the button
  still reaches Zeffy if JavaScript fails to load.
- **The amount carries over.** Zeffy prefills its amount field from an `amount` query
  parameter, so clicking the $250 tier sends the donor to `…-25558?amount=250` with
  $250 already entered. This is why the site's tiers ($10–$500) do not need to match
  Zeffy's suggested buttons ($30 / $75 / $125 / $300) — the donor's chosen amount
  arrives in the "Other" field regardless.
- **The frequency does not carry over.** Zeffy has no query parameter for one-time vs.
  monthly (`frequency`, `recurrence`, `recurring`, and `interval` were all tested and
  ignored). When a donor picks Monthly on the site, `give.html` reveals the
  `#monthly-hint` paragraph telling them to choose **Monthly** on the Zeffy page.
- Do not paste URLs copied from the Zeffy dashboard straight into the code: they carry
  a `?fromOnboarding=true` parameter that should not be shown to donors.

### Remaining Zeffy setup

The campaign is live but **cannot accept payments yet**. Selecting any amount on the
form shows: "We're sorry, this campaign is not ready to accept payments yet. The
nonprofit must complete their account setup to start accepting payments on this
campaign." Finish the account setup in the Zeffy dashboard (organization verification
and bank details), then make one small real donation end to end to confirm the money
arrives and the receipt looks right.

### Hosting notes

Nothing about GitHub Pages constrains this. The link-out approach needs no server-side
code, and the alternative — embedding Zeffy's form in an `<iframe>` on `give.html` so
donors never leave the site — also works, because GitHub Pages serves no
`Content-Security-Policy` header to block it.

Two related points:

- Keep Cloudflare's proxy off (see the DNS step above). A proxied domain lets
  Cloudflare rewrite and defer scripts, which is a common cause of embedded donation
  forms failing to render.
- Zeffy can redirect donors to a custom page after a completed gift. `thank-you.html`
  exists for this. To switch it on, open the donation form in the Zeffy dashboard and
  set the post-donation redirect to:

  ```
  https://www.alokafoundationsd.org/thank-you.html
  ```

  The page is marked `noindex` and is deliberately left out of `sitemap.xml`, since it
  is only meaningful to someone who has just given. Until the redirect is configured,
  Zeffy shows its own confirmation screen and the page simply goes unused.

## Content sources

- Vision, mission, donation structure, and support-request form: the current
  [Aloka Foundation page](https://www.lifeworks-sls.com/thealokafoundation)
- Team bios and photos: the [Life Works team page](https://www.lifeworks-sls.com/team)
- Films: the three Vimeo shorts highlighting Life Works' work
- Visual identity (cream / brown / amber / teal, serif wordmark): the Aloka Foundation logo
