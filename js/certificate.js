/* =====================================================================
   Summit Securities — Certificate renderer (dark premium design)
   ===================================================================== */
(function () {
  const CFG = window.SUMMIT_CONFIG;

  function formatAmount(amount, currency) {
    if (amount === null || amount === undefined || amount === "") return "";
    const str = String(amount);
    const num = Number(str.replace(/[^0-9.\-]/g, ""));
    if (!isFinite(num) || /[a-z]/i.test(str)) return str;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: currency || "USD", minimumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    const p = String(iso).split("-");
    const d = p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function buildSeal(accent) {
    // The center monogram is rendered as a real DOM <img> overlay (see buildCertificate),
    // because html2canvas does not rasterize external <image> elements inside inline SVG.
    // unique id per render so multiple seals on a page don't share the arc path
    const aid = "arc-" + Math.random().toString(36).slice(2);
    const ring = "SUMMIT SECURITIES · VERIFIED AUTHENTIC · ";
    return `
    <svg class="seal" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="${aid}" d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0"/>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="1" opacity="0.5"/>
      <circle cx="100" cy="100" r="85" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.28"/>
      <circle cx="100" cy="100" r="55" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.28"/>
      <text font-size="10" letter-spacing="2.1" font-weight="600" fill="${accent}" opacity="0.62" font-family="SF Pro Display,Inter,Helvetica,sans-serif">
        <textPath href="#${aid}" startOffset="0%">${ring}${ring}</textPath>
      </text>
    </svg>`;
  }

  function buildCertificate(data) {
    const type = CFG.certificateTypes[data.type] || CFG.certificateTypes.payout;
    const accent = "#e9ebef";  /* fog-white ink for the seal on dark paper */
    const certLogo = CFG.logoOnDark || CFG.logo;
    const amountStr = formatAmount(data.amount, data.currency);
    const dateStr = formatDate(data.date);
    const body = (type.body || "")
      .replace("{name}", `<strong>${escapeHtml(data.recipient || "")}</strong>`)
      .replace("{amount}", `<strong>${amountStr}</strong>`);

    const left = CFG.signatories.left;
    const right = CFG.signatories.right;

    const el = document.createElement("div");
    el.className = "certificate";

    el.innerHTML = `
      <div class="cert-watermark">${CFG.sealEmblem ? `<img src="${CFG.sealEmblem}" alt="" crossorigin="anonymous"/>` : ""}</div>

      <div class="cert-border">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>
      </div>

      <div class="cert-seal">
        ${buildSeal(accent)}
        ${CFG.sealEmblem ? `<img class="cert-seal-emblem" src="${CFG.sealEmblem}" alt="" crossorigin="anonymous"/>` : ""}
      </div>

      <div class="cert-inner">
        <img class="cert-logo" src="${certLogo}" alt="${escapeHtml(CFG.companyName)}" crossorigin="anonymous"/>
        <div class="cert-tagline">${escapeHtml(CFG.companyTagline || "")}</div>

        <div class="cert-rule"><span></span><i>◆</i><span></span></div>

        <div class="cert-type">${escapeHtml(type.label)}</div>
        <h1 class="cert-heading">${escapeHtml(type.heading)}</h1>

        <div class="cert-amount">${amountStr}</div>
        ${data.note ? `<div class="cert-note">${escapeHtml(data.note)}</div>` : ""}

        <p class="cert-body">${body}</p>

        <div class="cert-recipient">
          <div class="cert-recipient-name">${escapeHtml(data.recipient || "")}</div>
          <div class="cert-recipient-label">Recipient</div>
        </div>

        <div class="cert-rule-bottom"><span></span><i>◆</i><span></span></div>

        <div class="cert-signatures">
          <div class="cert-sig">
            ${left.signatureImage
              ? `<img class="cert-sig-img" src="${left.signatureImage}" alt="" crossorigin="anonymous" onerror="this.style.display='none'"/>`
              : `<div class="cert-sig-img placeholder"></div>`}
            <div class="cert-sig-line"></div>
            <div class="cert-sig-name">${escapeHtml(left.name)}</div>
            ${left.title && left.title !== left.name ? `<div class="cert-sig-title">${escapeHtml(left.title)}</div>` : ""}
          </div>

          <div class="cert-date">
            <div class="cert-date-value">${dateStr}</div>
            <div class="cert-date-label">Date of Issue</div>
          </div>

          <div class="cert-sig">
            ${right.signatureImage
              ? `<img class="cert-sig-img" src="${right.signatureImage}" alt="" crossorigin="anonymous" onerror="this.style.display='none'"/>`
              : `<div class="cert-sig-img placeholder"></div>`}
            <div class="cert-sig-line"></div>
            <div class="cert-sig-name">${escapeHtml(right.name)}</div>
            ${right.title && right.title !== right.name ? `<div class="cert-sig-title">${escapeHtml(right.title)}</div>` : ""}
          </div>
        </div>
      </div>

      <div class="cert-verify">
        <div class="cert-verify-code">${escapeHtml(data.code || "")}</div>
      </div>`;

    return el;
  }

  function verifyUrl(code) {
    try {
      const u = new URL("verify.html", window.location.href);
      u.searchParams.set("code", code);
      return u.href;
    } catch (e) { return "verify.html?code=" + encodeURIComponent(code); }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  window.SummitCert = { buildCertificate, formatAmount, formatDate, verifyUrl };
})();
