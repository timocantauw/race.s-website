/* Global JS (no framework). Keeps behavior lightweight and privacy-friendly. */

const CONSENT_KEY = "consent:v1";

function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setConsent(consent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // If storage is blocked, we just won't persist; banner may reappear next visit.
  }
}

function openCookieBanner() {
  const el = document.querySelector("[data-cookie-banner]");
  if (!el) return;
  el.dataset.open = "true";
}

function closeCookieBanner() {
  const el = document.querySelector("[data-cookie-banner]");
  if (!el) return;
  el.dataset.open = "false";
}

function applyConsent(consent) {
  // Hook for future optional scripts (analytics, embeds, etc.).
  // For now: no tracking and no optional scripts are loaded.
  document.documentElement.dataset.consent = consent?.level || "unset";
}

function initCookieBanner() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  const existing = getConsent();
  if (!existing) {
    openCookieBanner();
  } else {
    applyConsent(existing);
    closeCookieBanner();
  }

  banner.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-consent-action");
    if (!action) return;

    const now = new Date().toISOString();

    if (action === "essential") {
      const consent = { level: "essential", updatedAt: now };
      setConsent(consent);
      applyConsent(consent);
      closeCookieBanner();
    }

    if (action === "all") {
      const consent = { level: "all", updatedAt: now };
      setConsent(consent);
      applyConsent(consent);
      closeCookieBanner();
    }

    if (action === "open-privacy") {
      // Let normal navigation happen.
    }
  });
}

function encodeMailto({ to, subject, body }) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${encodeURIComponent(to)}${qs ? `?${qs}` : ""}`;
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = document.querySelector("[data-contact-status]");
  const to = form.getAttribute("data-contact-to") || "";

  function setStatus(message, type = "info") {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("error");
    if (type === "error") status.classList.add("error");
  }

  form.addEventListener("submit", (e) => {
    // Static fallback: open user's email client.
    e.preventDefault();

    if (!to) {
      setStatus(
        "Die E-Mail-Adresse für das Kontaktformular ist noch nicht konfiguriert.",
        "error"
      );
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
      setStatus("Bitte fülle Name, E-Mail und Nachricht aus.", "error");
      return;
    }

    const subject = topic
      ? `Kontaktanfrage: ${topic}`
      : "Kontaktanfrage über Website";

    const bodyLines = [
      `Name: ${name}`,
      `E-Mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      "",
      message,
      "",
      "—",
      "Gesendet über das Kontaktformular der Website.",
    ].filter(Boolean);

    const href = encodeMailto({
      to,
      subject,
      body: bodyLines.join("\n"),
    });

    setStatus(
      "Dein E-Mail-Programm öffnet sich – bitte sende die Nachricht dort ab."
    );
    window.location.href = href;
  });
}

function initActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document
    .querySelectorAll("[data-nav] a[href]")
    .forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === path) a.setAttribute("aria-current", "page");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  initActiveNav();
  initCookieBanner();
  initContactForm();
});

