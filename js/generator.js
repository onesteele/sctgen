/* =====================================================================
   Summit Securities — Certificate Generator
   ===================================================================== */
(function () {
  const CFG = window.SUMMIT_CONFIG;
  const REG_KEY = "summit_registry";
  let registry = [];
  let currentCode = "";

  const $ = id => document.getElementById(id);

  /* ── Code generation ── */
  function pad(n) { return String(n).padStart(2, "0"); }
  function randHex(len) {
    const a = new Uint8Array(Math.ceil(len / 2));
    crypto.getRandomValues(a);
    return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, len).toUpperCase();
  }
  function makeCode(typeKey, dateStr) {
    const t = CFG.certificateTypes[typeKey] || CFG.certificateTypes.payout;
    const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
    const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    return `SS-${t.code}-${ymd}-${randHex(6)}`;
  }

  /* ── Form read ── */
  function readForm() {
    return {
      recipient: $("f-name").value.trim(),
      amount: $("f-amount").value.trim(),
      currency: $("f-currency").value,
      type: $("f-type").value,
      date: $("f-date").value,
      note: $("f-note").value.trim(),
      code: currentCode
    };
  }

  /* ── Preview ── */
  function renderPreview() {
    const data = readForm();
    const scaler = $("scaler");
    scaler.innerHTML = "";
    const cert = window.SummitCert.buildCertificate(data);
    scaler.appendChild(cert);
    fitPreview();
  }
  function fitPreview() {
    const stage = $("preview");
    const scaler = $("scaler");
    // stage has 32px padding each side; leave a little slack so it never overflows
    const avail = stage.clientWidth - 72;
    const scale = Math.max(0.1, Math.min(1, avail / 1100));
    scaler.style.width = "1100px";
    scaler.style.transform = `scale(${scale})`;
    scaler.style.height = (760 * scale) + "px";
  }

  /* ── Export ── */
  async function captureCanvas() {
    const data = readForm();
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-12000px;top:0;z-index:-1";
    const el = window.SummitCert.buildCertificate(data);
    holder.appendChild(el);
    document.body.appendChild(holder);
    try { await document.fonts.ready; } catch (e) {}
    await waitForImages(el);
    await new Promise(r => setTimeout(r, 120));
    const canvas = await html2canvas(el, {
      scale: 3, useCORS: true,
      backgroundColor: "#ffffff",
      logging: false, width: 1100, height: 760
    });
    document.body.removeChild(holder);
    return canvas;
  }

  function waitForImages(root) {
    return Promise.all(
      Array.from(root.querySelectorAll("img")).map(
        img => img.complete ? Promise.resolve()
          : new Promise(res => { img.onload = img.onerror = res; })
      )
    );
  }

  function safeName(data, ext) {
    const who = (data.recipient || "certificate").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    const t = CFG.certificateTypes[data.type] || { code: "XX" };
    return `Summit-${t.code}-${who}-${data.code}.${ext}`;
  }

  async function downloadPNG() {
    setBusy(true, "Rendering image…");
    try {
      const canvas = await captureCanvas();
      const a = document.createElement("a");
      a.download = safeName(readForm(), "png");
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast("ok", "PNG downloaded.");
    } catch (e) { toast("bad", "PNG failed: " + e.message); }
    finally { setBusy(false); }
  }

  async function downloadPDF() {
    setBusy(true, "Building PDF…");
    try {
      const canvas = await captureCanvas();
      const { jsPDF } = window.jspdf;
      // Landscape page sized to match the 1100×760 certificate ratio
      const W = 792, H = Math.round(792 * 760 / 1100); // 547pt
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [W, H] });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, W, H);
      pdf.save(safeName(readForm(), "pdf"));
      toast("ok", "PDF downloaded — ready to send to the plaque maker.");
    } catch (e) { toast("bad", "PDF failed: " + e.message); }
    finally { setBusy(false); }
  }

  /* ── Registry ── */
  async function loadRegistry() {
    let fromFile = [];
    try {
      const res = await fetch("data/certificates.json", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        fromFile = Array.isArray(j) ? j : (j.certificates || []);
      }
    } catch (e) {}
    let fromLocal = [];
    try { fromLocal = JSON.parse(localStorage.getItem(REG_KEY) || "[]"); } catch (e) {}
    const byCode = {};
    [...fromFile, ...fromLocal].forEach(c => { if (c && c.code) byCode[c.code] = c; });
    registry = Object.values(byCode);
    renderRecent();
  }

  function persistLocal() { localStorage.setItem(REG_KEY, JSON.stringify(registry)); }

  function issueToRegistry() {
    const data = readForm();
    if (!data.recipient) { toast("bad", "Enter a recipient name first."); return; }
    if (registry.some(c => c.code === data.code)) { toast("info", "Code already in registry."); return; }
    registry.push({
      code: data.code,
      recipient: data.recipient,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      date: data.date,
      note: data.note,
      issuedAt: new Date().toISOString()
    });
    persistLocal();
    renderRecent();
    toast("ok", "Added to registry. Click Export JSON → commit to GitHub to make it publicly verifiable.");
  }

  function exportRegistry() {
    const blob = new Blob([JSON.stringify(registry, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.download = "certificates.json";
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("info", "Saved. Replace data/certificates.json in your repo, then push.");
  }

  function renderRecent() {
    const box = $("recent");
    $("reg-count").textContent = registry.length;
    if (!registry.length) {
      box.innerHTML = '<p style="color:var(--muted);font-size:13px">No certificates yet.</p>';
      return;
    }
    const rows = registry.slice().reverse().slice(0, 6).map(c => {
      const label = (CFG.certificateTypes[c.type] || {}).label || c.type;
      return `<tr>
        <td><code>${escapeHtml(c.code)}</code></td>
        <td>${escapeHtml(c.recipient)}</td>
        <td style="color:var(--muted)">${escapeHtml(c.date || "")}</td>
      </tr>`;
    }).join("");
    box.innerHTML = `<table class="reg-table"><thead><tr><th>Code</th><th>Recipient</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ── UI helpers ── */
  function toast(kind, msg) {
    const t = $("toast");
    t.className = "toast show " + kind;
    t.textContent = msg;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 6000);
  }
  function setBusy(busy, msg) {
    $("btn-png").disabled = busy;
    $("btn-pdf").disabled = busy;
    if (busy && msg) toast("info", msg);
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function regenCode() {
    const data = readForm();
    currentCode = makeCode(data.type, data.date);
    $("code-display").textContent = currentCode;
    renderPreview();
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    $("f-date").value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Type pills
    document.querySelectorAll(".type-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".type-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        $("f-type").value = btn.dataset.type;
        regenCode();
      });
    });

    ["f-name", "f-amount", "f-currency", "f-note"].forEach(id => {
      $(id).addEventListener("input", renderPreview);
    });
    $("f-date").addEventListener("change", regenCode);

    $("btn-regen").addEventListener("click", regenCode);
    $("btn-pdf").addEventListener("click", downloadPDF);
    $("btn-png").addEventListener("click", downloadPNG);
    $("btn-issue").addEventListener("click", issueToRegistry);
    $("btn-export").addEventListener("click", exportRegistry);
    window.addEventListener("resize", fitPreview);

    regenCode();
    loadRegistry();

    // Re-fit once layout/fonts have settled so the preview never overflows.
    requestAnimationFrame(fitPreview);
    window.addEventListener("load", fitPreview);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPreview);
  });
})();
