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

// Donations are processed by the foundation's own Zeffy form. While this is
// set, the "Complete Your Gift" button sends donors straight there and the
// Wix checkout flow above is skipped entirely; setting it back to '' restores
// the Wix flow. Keep the URL free of tracking parameters such as
// `?fromOnboarding=true`, which Zeffy appends inside its own dashboard.
var DONATION_PROVIDER_URL = 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-25558';

var freqButtons = document.querySelectorAll('.freq-btn');
var tierGrids = {
  'one-time': document.getElementById('tiers-one-time'),
  monthly: document.getElementById('tiers-monthly')
};
var summary = document.getElementById('gift-summary');
var donateBtn = document.getElementById('donate-btn');
var monthlyHint = document.getElementById('monthly-hint');

if (freqButtons.length && tierGrids['one-time'] && tierGrids.monthly) {
  var state = { freq: 'one-time', amount: 100 };

  function cardsIn(freq) {
    return Array.prototype.slice.call(
      tierGrids[freq].querySelectorAll('.tier[data-amount]')
    );
  }

  function amountOf(card) {
    return parseInt(card.dataset.amount, 10);
  }

  // Each grid's starting card, captured before any clicks move the selection.
  var defaultAmount = {};
  Object.keys(tierGrids).forEach(function (freq) {
    var cards = cardsIn(freq);
    var preselected = tierGrids[freq].querySelector('.tier.selected');
    defaultAmount[freq] = amountOf(preselected || cards[0]);
  });

  // Show the grid for the current frequency and highlight the right card in it.
  // Zeffy presets different amounts per frequency, so the donor's current choice
  // may not exist in the grid being switched to; keep it when it does and fall
  // back to that grid's own default when it does not.
  function showActiveGrid() {
    Object.keys(tierGrids).forEach(function (freq) {
      tierGrids[freq].hidden = freq !== state.freq;
    });

    var cards = cardsIn(state.freq);
    var match = null;
    cards.forEach(function (card) {
      if (amountOf(card) === state.amount) match = card;
    });
    if (!match) {
      cards.forEach(function (card) {
        if (amountOf(card) === defaultAmount[state.freq]) match = card;
      });
    }
    if (!match) match = cards[0];

    cards.forEach(function (card) { card.classList.remove('selected'); });
    match.classList.add('selected');
    state.amount = amountOf(match);
  }

  // Zeffy prefills the gift amount from an `amount` query parameter, so the
  // tier selected here carries over to its form. Zeffy has no equivalent
  // parameter for the giving frequency, so monthly donors get an on-page note
  // asking them to pick "Monthly" once they arrive.
  function providerUrlForGift() {
    if (!DONATION_PROVIDER_URL) return FALLBACK_DONATE_URL;
    var separator = DONATION_PROVIDER_URL.indexOf('?') === -1 ? '?' : '&';
    return DONATION_PROVIDER_URL + separator + 'amount=' + encodeURIComponent(state.amount);
  }

  function updateSummary() {
    if (summary) {
      var freqLabel = state.freq === 'monthly' ? 'monthly gift' : 'one-time gift';
      summary.textContent = 'Selected: ' + freqLabel + ' of $' + state.amount;
    }
    if (donateBtn) {
      donateBtn.href = providerUrlForGift();
    }
    if (monthlyHint) {
      monthlyHint.hidden = !(DONATION_PROVIDER_URL && state.freq === 'monthly');
    }
  }

  freqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      freqButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.freq = btn.dataset.freq;
      showActiveGrid();
      updateSummary();
    });
  });

  Object.keys(tierGrids).forEach(function (freq) {
    cardsIn(freq).forEach(function (card) {
      card.addEventListener('click', function () {
        cardsIn(freq).forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        state.amount = amountOf(card);
        updateSummary();
      });
    });
  });

  showActiveGrid();
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
