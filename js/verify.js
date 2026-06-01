/* =====================================================================
   Public certificate verification.
   Looks up a code in data/certificates.json and renders the real
   certificate if found. No login required.
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);
  let registry = null;

  async function getRegistry() {
    if (registry) return registry;
    try {
      const res = await fetch("data/certificates.json", { cache: "no-store" });
      const j = res.ok ? await res.json() : [];
      registry = Array.isArray(j) ? j : (j.certificates || []);
    } catch (e) { registry = []; }
    return registry;
  }

  async function verify(code) {
    code = (code || "").trim().toUpperCase();
    const result = $("result");
    const banner = $("banner");
    const stage = $("cert-stage");
    result.classList.remove("hidden");
    banner.className = "status-banner";
    stage.innerHTML = "";

    if (!code) {
      banner.classList.add("invalid");
      banner.innerHTML = `<span class="ico">✕</span><div><strong>Enter a certificate code</strong><br>Type the code printed on the certificate (e.g. SS-PO-20260528-A1B2C3).</div>`;
      return;
    }

    const reg = await getRegistry();
    const match = reg.find(c => (c.code || "").toUpperCase() === code);

    if (!match) {
      banner.classList.add("invalid");
      banner.innerHTML = `<span class="ico">✕</span><div><strong>Not verified.</strong><br>No certificate with code <code>${escapeHtml(code)}</code> exists in the Summit Securities registry. It may be forged, mistyped, or not yet published.</div>`;
      return;
    }

    banner.classList.add("valid");
    const typeLabel = (window.SUMMIT_CONFIG.certificateTypes[match.type] || {}).label || match.type;
    banner.innerHTML = `<span class="ico">✔</span><div><strong>Authentic certificate.</strong><br>Issued by Summit Securities to <strong>${escapeHtml(match.recipient)}</strong> — ${escapeHtml(typeLabel)}.</div>`;

    const cert = window.SummitCert.buildCertificate(match);
    const scaler = document.createElement("div");
    scaler.style.transformOrigin = "top center";
    scaler.appendChild(cert);
    stage.appendChild(scaler);
    const fit = () => {
      const scale = Math.min(1, (stage.clientWidth - 48) / 1100);
      scaler.style.transform = `scale(${scale})`;
      scaler.style.height = (850 * scale) + "px";
      scaler.style.width = "1100px";
    };
    fit();
    window.addEventListener("resize", fit);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("v-go").addEventListener("click", () => verify($("v-code").value));
    $("v-code").addEventListener("keydown", (e) => { if (e.key === "Enter") verify($("v-code").value); });

    // Support deep links: verify.html?code=XXXX (used by the QR code)
    const params = new URLSearchParams(window.location.search);
    const pre = params.get("code");
    if (pre) { $("v-code").value = pre; verify(pre); }
  });
})();
