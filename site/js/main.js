// The Aloka Foundation — site interactions

// Footer year
document.querySelectorAll('#year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Mobile navigation toggle
var navToggle = document.querySelector('.nav-toggle');
var navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
}

// Donation page: frequency toggle, tier selection, and checkout.
//
// When a donor clicks "Complete Your Gift", we call the Wix Headless APIs to
// create a fresh checkout for this donor with their chosen amount, then send
// them to Wix's secure checkout page. If any API call fails, the donor is
// sent to the existing donation form on the Life Works site instead, so the
// button always works.
//
// IMPORTANT: WIX_CLIENT_ID must be a headless OAuth client created on the
// SAME Wix site that hosts the donation campaign (lifeworks-sls.com), via
// that site's dashboard: Settings > Development & integrations > Headless
// Settings. A client created on a separate headless project cannot see the
// campaign, and every click will use the fallback URL. The new site's domain
// must also be added to the client's allowed redirect domains.
var WIX_CLIENT_ID = '0805087d-dec2-4d31-abf5-c4f03dc93882';
var DONATION_CAMPAIGN_ID = '5a511be7-ad8d-4993-8b2b-dda9a4ad98b7';
var WIX_DONATIONS_APP_ID = '333b456e-dd48-4d6b-b32b-9fd48d74e163';

// Fallback: the donation form on the current Aloka page, which generates a
// correct checkout for each donor (one extra click for the donor).
var FALLBACK_DONATE_URL = 'https://www.lifeworks-sls.com/thealokafoundation';

// To switch the donation backend to a dedicated processor (e.g. Zeffy or
// PayPal), paste the processor's donation page URL here. When this is set,
// the "Complete Your Gift" button sends donors straight to that page and the
// Wix checkout flow above is skipped entirely. See "Switching the donation
// backend to Zeffy or PayPal" in the README for full setup steps.
// Example: var DONATION_PROVIDER_URL = 'https://www.zeffy.com/en-US/donation-form/aloka';
var DONATION_PROVIDER_URL = '';

var freqButtons = document.querySelectorAll('.freq-btn');
var tierCards = document.querySelectorAll('.tier[data-amount]');
var summary = document.getElementById('gift-summary');
var donateBtn = document.getElementById('donate-btn');

if (freqButtons.length && tierCards.length) {
  var state = { freq: 'one-time', amount: 100 };

  function updateSummary() {
    if (summary) {
      var freqLabel = state.freq === 'monthly' ? 'monthly gift' : 'one-time gift';
      summary.textContent = 'Selected: ' + freqLabel + ' of $' + state.amount;
    }
    if (donateBtn) {
      donateBtn.href = DONATION_PROVIDER_URL || FALLBACK_DONATE_URL;
    }
  }

  freqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      freqButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.freq = btn.dataset.freq;
      updateSummary();
    });
  });

  tierCards.forEach(function (card) {
    card.addEventListener('click', function () {
      tierCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.amount = parseInt(card.dataset.amount, 10);
      updateSummary();
    });
  });

  updateSummary();

  // Wix Headless checkout flow: token -> create checkout -> redirect session.
  // See https://dev.wix.com/docs/go-headless for the underlying APIs.
  async function createDonationCheckoutUrl() {
    // 1. Anonymous visitor token (the client ID is public by design).
    var tokenRes = await fetch('https://www.wixapis.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: WIX_CLIENT_ID, grantType: 'anonymous' })
    });
    if (!tokenRes.ok) throw new Error('token request failed');
    var tokenData = await tokenRes.json();

    // 2. Create a checkout for this donor's chosen amount and frequency.
    var donationOptions = { amount: state.amount };
    if (state.freq === 'monthly') donationOptions.frequency = 'MONTH';

    var checkoutRes = await fetch('https://www.wixapis.com/ecom/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: tokenData.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelType: 'WEB',
        lineItems: [{
          quantity: 1,
          catalogReference: {
            appId: WIX_DONATIONS_APP_ID,
            catalogItemId: DONATION_CAMPAIGN_ID,
            options: donationOptions
          }
        }]
      })
    });
    if (!checkoutRes.ok) throw new Error('checkout creation failed');
    var checkoutData = await checkoutRes.json();

    // 3. Single-use redirect URL to Wix's secure checkout page. After the
    // donation (or if the donor backs out), Wix returns them to this page.
    var redirectRes = await fetch('https://www.wixapis.com/redirect-session/v1/redirect-session', {
      method: 'POST',
      headers: {
        Authorization: tokenData.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ecomCheckout: { checkoutId: checkoutData.checkout.id },
        callbacks: { postFlowUrl: window.location.href }
      })
    });
    if (!redirectRes.ok) throw new Error('redirect session failed');
    var redirectData = await redirectRes.json();
    return redirectData.redirectSession.fullUrl;
  }

  if (donateBtn) {
    donateBtn.addEventListener('click', async function (event) {
      // When a dedicated processor is configured, the button's href already
      // points at it; let the browser follow the link normally.
      if (DONATION_PROVIDER_URL) return;

      event.preventDefault();
      var originalText = donateBtn.textContent;
      donateBtn.textContent = 'Preparing your secure checkout\u2026';
      donateBtn.style.pointerEvents = 'none';
      try {
        var checkoutUrl = await createDonationCheckoutUrl();
        window.location.href = checkoutUrl;
      } catch (err) {
        // Any failure: send the donor to the donation form instead.
        window.location.href = FALLBACK_DONATE_URL;
      } finally {
        donateBtn.textContent = originalText;
        donateBtn.style.pointerEvents = '';
      }
    });
  }
}

// Request Support page: on submit, open the visitor's email app with a
// pre-filled message containing their answers, addressed to the foundation.
var SUPPORT_EMAIL = 'kirk@lifeworks-sls.com';
var supportForm = document.getElementById('support-form');

if (supportForm) {
  supportForm.addEventListener('submit', function (event) {
    event.preventDefault();

    function fieldValue(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    var subject = 'Aloka Foundation Support Request - ' + fieldValue('applicant');
    var body = [
      'Applicant Name or Name of Organization:',
      fieldValue('applicant'),
      '',
      'Support Need / Specific Ask:',
      fieldValue('need'),
      '',
      'Alignment with the Mission and Vision of the Aloka Foundation:',
      fieldValue('alignment'),
      '',
      'Timeline for the Request:',
      fieldValue('timeline'),
      '',
      'Main Point of Contact Moving Forward:',
      fieldValue('contact'),
      '',
      'Email Address:',
      fieldValue('email')
    ].join('\n');

    window.location.href = 'mailto:' + SUPPORT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  });
}
