/* ==========================================================================
   Skin Care — Interactive UI & Book Appointment Modal Engine
   ========================================================================== */

(function () {
  "use strict";

  const DATA = window.SKINCARE_DATA || {};
  const STORAGE_KEY = "skincare_appointments";
  const INQUIRY_KEY = "skincare_inquiries";

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function getSavedAppointments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveAppointment(record) {
    const list = getSavedAppointments();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  }

  function showToast(message) {
    let toast = qs("#scToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "scToast";
      toast.className = "sc-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
  }

  function getTomorrowISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  function getTodayISO() {
    return new Date().toISOString().split("T")[0];
  }

  /* ------------------------------------------------------------------------
     1. Header Scroll & Mobile Drawer
     ------------------------------------------------------------------------ */
  function initHeaderAndDrawer() {
    const header = qs(".sc-header");
    if (header && header.classList.contains("sc-header--hero")) {
      const onScroll = () => {
        header.classList.toggle("sc-scrolled", window.scrollY > 36);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    const drawer = qs("#scMobileDrawer");
    const openBtn = qs("#scMobileOpenBtn");
    const closeBtn = qs("#scMobileCloseBtn");

    if (drawer && openBtn) {
      openBtn.addEventListener("click", () => {
        drawer.classList.add("is-open");
        document.body.classList.add("sc-modal-open");
      });
    }

    const closeDrawer = () => {
      if (!drawer) return;
      drawer.classList.remove("is-open");
      document.body.classList.remove("sc-modal-open");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) closeDrawer();
      });
      qsa("a, button[data-open-appointment]", drawer).forEach((el) => {
        el.addEventListener("click", closeDrawer);
      });
    }
  }

  /* ------------------------------------------------------------------------
     2. Global "Book Appointment" Popup Modal
     ------------------------------------------------------------------------ */
  function mountAppointmentModal() {
    if (qs("#scAppointmentModal")) return;

    const serviceOptions = (DATA.services || [])
      .map((s) => `<option value="${s.title}">${s.title} (${s.startingPrice})</option>`)
      .join("");

    const doctorOptions = [
      `<option value="Any Available Specialist">Any Available Specialist</option>`,
      ...(DATA.doctors || []).map(
        (d) => `<option value="${d.name}">${d.name} — ${d.focus}</option>`
      )
    ].join("");

    const slots = ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"];

    const modalHTML = `
      <div class="sc-modal-backdrop" id="scAppointmentModal" role="dialog" aria-modal="true" aria-labelledby="scModalTitle">
        <div class="sc-modal-dialog">
          <div class="sc-modal-header">
            <div>
              <span class="sc-eyebrow" style="margin-bottom:8px;">Quick Clinic Booking</span>
              <h3 id="scModalTitle">Book Your Dermatology Appointment</h3>
            </div>
            <button type="button" class="sc-modal-close" id="scCloseApptModal" aria-label="Close booking popup">&times;</button>
          </div>
          <div class="sc-modal-body" id="scApptModalBody">
            <form id="scPopupApptForm" novalidate>
              <div class="sc-form-grid">
                <div class="sc-field">
                  <label for="scPopName">Full Name *</label>
                  <input class="sc-input" type="text" id="scPopName" name="name" placeholder="e.g. Sarah Jenkins" required />
                </div>
                <div class="sc-field">
                  <label for="scPopEmail">Email Address *</label>
                  <input class="sc-input" type="email" id="scPopEmail" name="email" placeholder="you@example.com" required />
                </div>
                <div class="sc-field">
                  <label for="scPopPhone">Phone Number *</label>
                  <input class="sc-input" type="tel" id="scPopPhone" name="phone" placeholder="+1 (555) 234-5678" required />
                </div>
                <div class="sc-field">
                  <label for="scPopDate">Preferred Date *</label>
                  <input class="sc-input" type="date" id="scPopDate" name="date" min="${getTodayISO()}" value="${getTomorrowISO()}" required />
                </div>
                <div class="sc-field">
                  <label for="scPopService">Treatment / Service</label>
                  <select class="sc-select" id="scPopService" name="service">
                    ${serviceOptions}
                  </select>
                </div>
                <div class="sc-field">
                  <label for="scPopDoctor">Preferred Specialist</label>
                  <select class="sc-select" id="scPopDoctor" name="doctor">
                    ${doctorOptions}
                  </select>
                </div>
                <div class="sc-field sc-field--full">
                  <label>Preferred Time Slot *</label>
                  <div class="sc-slot-grid" id="scPopSlotGrid">
                    ${slots
                      .map(
                        (slot, i) =>
                          `<button type="button" class="sc-slot-btn${i === 0 ? " is-selected" : ""}" data-slot="${slot}">${slot}</button>`
                      )
                      .join("")}
                  </div>
                  <input type="hidden" id="scPopTime" name="time" value="${slots[0]}" />
                </div>
                <div class="sc-field sc-field--full">
                  <label for="scPopNotes">Skin Concerns or Notes</label>
                  <textarea class="sc-textarea" id="scPopNotes" name="notes" placeholder="Share any skin goals, sensitivities, or preferred clinic branch..."></textarea>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;flex-wrap:wrap;">
                <span style="font-size:0.84rem;color:var(--sc-text-muted);">No upfront charge · Free rescheduling up to 24h</span>
                <button type="submit" class="sc-btn sc-btn-dark">Confirm Appointment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const backdrop = qs("#scAppointmentModal");
    const closeBtn = qs("#scCloseApptModal");

    const closeModal = () => {
      backdrop.classList.remove("is-open");
      document.body.classList.remove("sc-modal-open");
    };

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
        closeModal();
      }
    });

    bindPopupFormEvents();
  }

  function bindPopupFormEvents() {
    const form = qs("#scPopupApptForm");
    if (!form) return;

    qsa(".sc-slot-btn", form).forEach((btn) => {
      btn.addEventListener("click", () => {
        qsa(".sc-slot-btn", form).forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        const hiddenTime = qs("#scPopTime", form);
        if (hiddenTime) hiddenTime.value = btn.dataset.slot;
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = qs("#scPopName").value.trim();
      const email = qs("#scPopEmail").value.trim();
      const phone = qs("#scPopPhone").value.trim();
      const date = qs("#scPopDate").value;
      const time = qs("#scPopTime").value;
      const service = qs("#scPopService").value;
      const doctor = qs("#scPopDoctor").value;
      const notes = qs("#scPopNotes").value.trim();

      if (!name || !email || !phone || !date) {
        showToast("Please complete your name, email, phone, and preferred date.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Please enter a valid email address.");
        return;
      }

      const ref = "SC-" + Math.floor(100000 + Math.random() * 900000);
      const record = {
        ref,
        name,
        email,
        phone,
        date,
        time,
        service,
        doctor,
        notes,
        createdAt: new Date().toISOString()
      };
      saveAppointment(record);
      renderSavedAppointmentsList();

      const body = qs("#scApptModalBody");
      body.innerHTML = `
        <div class="sc-booking-success">
          <div class="sc-success-badge">&#10003;</div>
          <h3>Appointment Request Confirmed</h3>
          <p style="margin-top:8px;">Thank you, <strong>${escapeHTML(name)}</strong>. Your reservation reference is <strong>${ref}</strong>.</p>
          <div class="sc-booking-summary-box">
            <div><strong>Treatment:</strong> ${escapeHTML(service)}</div>
            <div><strong>Specialist:</strong> ${escapeHTML(doctor)}</div>
            <div><strong>Date &amp; Time:</strong> ${escapeHTML(date)} at ${escapeHTML(time)}</div>
            <div><strong>Contact:</strong> ${escapeHTML(email)} &middot; ${escapeHTML(phone)}</div>
          </div>
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
            <button type="button" class="sc-btn sc-btn-outline" id="scBookAnotherBtn">Book Another Visit</button>
            <button type="button" class="sc-btn sc-btn-dark" id="scDoneApptBtn">Done</button>
          </div>
        </div>
      `;

      qs("#scDoneApptBtn").addEventListener("click", () => {
        qs("#scAppointmentModal").classList.remove("is-open");
        document.body.classList.remove("sc-modal-open");
      });

      qs("#scBookAnotherBtn").addEventListener("click", () => {
        qs("#scAppointmentModal").remove();
        mountAppointmentModal();
        openAppointmentModal();
      });

      showToast("Appointment booked! Reference " + ref);
    });
  }

  function escapeHTML(str) {
    return String(str || "").replace(/[&<>"']/g, (ch) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function openAppointmentModal(opts = {}) {
    mountAppointmentModal();
    const modal = qs("#scAppointmentModal");
    if (!qs("#scPopupApptForm")) {
      modal.remove();
      mountAppointmentModal();
    }
    const serviceSel = qs("#scPopService");
    const doctorSel = qs("#scPopDoctor");
    const notesEl = qs("#scPopNotes");

    if (opts.service && serviceSel) {
      const match = Array.from(serviceSel.options).find((o) =>
        o.value.toLowerCase().includes(opts.service.toLowerCase())
      );
      if (match) serviceSel.value = match.value;
    }
    if (opts.doctor && doctorSel) {
      const match = Array.from(doctorSel.options).find((o) =>
        o.value.toLowerCase().includes(opts.doctor.toLowerCase())
      );
      if (match) doctorSel.value = match.value;
    }
    if (opts.packageName && notesEl) {
      notesEl.value = `Interested in the ${opts.packageName} package.`;
    }

    qs("#scAppointmentModal").classList.add("is-open");
    document.body.classList.add("sc-modal-open");
  }

  function bindAppointmentTriggers() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-appointment]");
      if (!trigger) return;
      e.preventDefault();
      openAppointmentModal({
        service: trigger.dataset.service || "",
        doctor: trigger.dataset.doctor || "",
        packageName: trigger.dataset.package || ""
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. Global Search Overlay Modal
     ------------------------------------------------------------------------ */
  function initSearchModal() {
    const searchBtns = qsa("[data-open-search]");
    if (!searchBtns.length) return;

    const modalHTML = `
      <div class="sc-modal-backdrop" id="scSearchModal" role="dialog" aria-modal="true" aria-label="Search Clinic">
        <div class="sc-modal-dialog" style="max-width:600px;">
          <div class="sc-modal-header">
            <div>
              <span class="sc-eyebrow" style="margin-bottom:6px;">Clinic Search</span>
              <h3>Find Treatments, Doctors &amp; Answers</h3>
            </div>
            <button type="button" class="sc-modal-close" id="scCloseSearchModal" aria-label="Close search">&times;</button>
          </div>
          <div class="sc-modal-body">
            <input type="search" id="scGlobalSearchInput" class="sc-input" placeholder="Search acne care, laser therapy, Dr. Emily, pricing..." />
            <div class="sc-search-results" id="scGlobalSearchResults"></div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const backdrop = qs("#scSearchModal");
    const input = qs("#scGlobalSearchInput");
    const resultsBox = qs("#scGlobalSearchResults");

    const index = [
      ...(DATA.services || []).map((s) => ({
        title: s.title,
        subtitle: `${s.category} · ${s.startingPrice}`,
        url: `service-details.html?service=${s.id}`
      })),
      ...(DATA.doctors || []).map((d) => ({
        title: d.name,
        subtitle: `${d.role} · ${d.focus}`,
        url: "doctors.html"
      })),
      ...(DATA.pricing || []).map((p) => ({
        title: `${p.name} Package`,
        subtitle: `${p.monthlyPrice}/month`,
        url: "pricing.html"
      })),
      { title: "Book Appointment", subtitle: "Schedule your visit or consultation", url: "appointment.html" },
      { title: "Help Center & FAQs", subtitle: "Common patient & doctor questions", url: "help-center.html" },
      { title: "Contact Us", subtitle: "Downtown, Westside & East End branches", url: "contact-us.html" }
    ];

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      const filtered = q
        ? index.filter(
            (item) =>
              item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
          )
        : index.slice(0, 5);

      if (!filtered.length) {
        resultsBox.innerHTML = `<p style="padding:12px 4px;color:var(--sc-text-muted);">No matching treatments or pages found. Try "laser", "acne", or "pricing".</p>`;
        return;
      }
      resultsBox.innerHTML = filtered
        .map(
          (item) => `
          <a href="${item.url}" class="sc-search-result-item">
            <div>
              <strong style="display:block;color:var(--sc-charcoal);">${escapeHTML(item.title)}</strong>
              <span style="font-size:0.86rem;color:var(--sc-text-muted);">${escapeHTML(item.subtitle)}</span>
            </div>
            <span style="font-weight:700;color:var(--sc-primary);">&rarr;</span>
          </a>
        `
        )
        .join("");
    }

    renderResults("");
    input.addEventListener("input", () => renderResults(input.value));

    searchBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        backdrop.classList.add("is-open");
        document.body.classList.add("sc-modal-open");
        setTimeout(() => input.focus(), 120);
      })
    );

    const close = () => {
      backdrop.classList.remove("is-open");
      document.body.classList.remove("sc-modal-open");
    };
    qs("#scCloseSearchModal").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  /* ------------------------------------------------------------------------
     4. Testimonials Switcher
     ------------------------------------------------------------------------ */
  function initTestimonials() {
    const cards = qsa("[data-testimonial-idx]");
    const quoteEl = qs("#scTestimonialQuote");
    const nameEl = qs("#scTestimonialName");
    const roleEl = qs("#scTestimonialRole");
    const prevBtn = qs("#scTestimonialPrev");
    const nextBtn = qs("#scTestimonialNext");
    const items = DATA.testimonials || [];

    if (!cards.length || !quoteEl || !items.length) return;

    let current = 0;
    function setActive(idx) {
      current = (idx + items.length) % items.length;
      const item = items[current];
      cards.forEach((c, i) => c.classList.toggle("is-active", i === current));
      quoteEl.textContent = `"${item.quote}"`;
      if (nameEl) nameEl.textContent = item.name;
      if (roleEl) roleEl.textContent = item.role;
    }

    cards.forEach((c, i) => c.addEventListener("click", () => setActive(i)));
    if (prevBtn) prevBtn.addEventListener("click", () => setActive(current - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => setActive(current + 1));
    setActive(0);
  }

  /* ------------------------------------------------------------------------
     5. Progress Bars & Pricing Toggle
     ------------------------------------------------------------------------ */
  function initProgressBars() {
    const fills = qsa(".sc-progress-fill[data-width]");
    if (!fills.length) return;
    const animate = () => {
      fills.forEach((el) => {
        el.style.width = el.dataset.width + "%";
      });
    };
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.2 }
      );
      obs.observe(fills[0]);
    } else {
      animate();
    }
  }

  function initPricingToggle() {
    const toggleWrap = qs("#scPricingToggle");
    if (!toggleWrap) return;

    const btns = qsa("button[data-billing]", toggleWrap);
    const prices = qsa("[data-monthly][data-session]");

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.billing;
        btns.forEach((b) => b.classList.toggle("is-active", b === btn));
        prices.forEach((el) => {
          const val = mode === "session" ? el.dataset.session : el.dataset.monthly;
          const unit = mode === "session" ? "/session" : "/month";
          el.innerHTML = `${val}<span>${unit}</span>`;
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. FAQ Accordion & Help Center Filter
     ------------------------------------------------------------------------ */
  function initFAQs() {
    qsa(".sc-faq-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const item = trigger.closest(".sc-faq-item");
        const isOpen = item.classList.contains("is-open");
        const group = item.parentElement;
        qsa(".sc-faq-item", group).forEach((sib) => sib.classList.remove("is-open"));
        if (!isOpen) item.classList.add("is-open");
      });
    });

    const faqSearch = qs("#scFaqFilterInput");
    if (faqSearch) {
      faqSearch.addEventListener("input", () => {
        const term = faqSearch.value.trim().toLowerCase();
        qsa(".sc-faq-item").forEach((item) => {
          const text = item.textContent.toLowerCase();
          item.style.display = !term || text.includes(term) ? "" : "none";
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     7. Clinic Branch Switcher
     ------------------------------------------------------------------------ */
  function initBranchTabs() {
    const tabs = qsa("[data-branch-id]");
    const addrEl = qs("#scBranchAddress");
    const hoursEl = qs("#scBranchHours");
    const phoneEl = qs("#scBranchPhone");
    const mapFrame = qs("#scBranchMap");
    const branches = DATA.branches || [];

    if (!tabs.length || !branches.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const b = branches.find((x) => x.id === tab.dataset.branchId);
        if (!b) return;
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        if (addrEl) addrEl.textContent = b.address;
        if (hoursEl) hoursEl.textContent = b.hours;
        if (phoneEl) phoneEl.textContent = b.phone;
        if (mapFrame) {
          mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(b.mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     8. Service Details Dynamic Page Loader
     ------------------------------------------------------------------------ */
  function initServiceDetailsPage() {
    const container = qs("#scServiceDetailRoot");
    if (!container || !DATA.services) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("service") || DATA.services[0].id;
    const svc = DATA.services.find((s) => s.id === id) || DATA.services[0];

    const switcher = qs("#scServiceSwitcher");
    if (switcher) {
      switcher.innerHTML = DATA.services
        .map(
          (item) =>
            `<a href="service-details.html?service=${item.id}" class="sc-pill-tab${item.id === svc.id ? " is-active" : ""}">${escapeHTML(item.title)}</a>`
        )
        .join("");
    }

    const titleEl = qs("#scDetailTitle");
    const catEl = qs("#scDetailCategory");
    const descEl = qs("#scDetailShortDesc");
    const imgEl = qs("#scDetailImage");
    const metaEl = qs("#scDetailMeta");
    const overEl = qs("#scDetailOverview");
    const listEl = qs("#scDetailHighlights");
    const ctaBtn = qs("#scDetailBookBtn");

    if (titleEl) titleEl.textContent = svc.title;
    if (catEl) catEl.textContent = svc.category;
    if (descEl) descEl.textContent = svc.shortDesc;
    if (imgEl) {
      imgEl.src = svc.image;
      imgEl.alt = svc.title;
    }
    if (metaEl) metaEl.textContent = `${svc.duration} Session · Starting at ${svc.startingPrice}`;
    if (overEl) {
      overEl.innerHTML = svc.overview.map((p) => `<p style="margin-bottom:16px;">${escapeHTML(p)}</p>`).join("");
    }
    if (listEl) {
      listEl.innerHTML = svc.highlights
        .map((h) => `<li><span class="sc-check-dot">&#10003;</span><span>${escapeHTML(h)}</span></li>`)
        .join("");
    }
    if (ctaBtn) {
      ctaBtn.dataset.service = svc.title;
    }
  }

  /* ------------------------------------------------------------------------
     9. Inline Page Forms (Appointment & Contact Pages)
     ------------------------------------------------------------------------ */
  function renderSavedAppointmentsList() {
    const box = qs("#scSavedBookingsList");
    if (!box) return;
    const items = getSavedAppointments();
    if (!items.length) {
      box.innerHTML = `<p style="color:var(--sc-text-muted);font-size:0.94rem;">No recent bookings saved on this browser yet. Submit the form or click "Book Appointment" to schedule a visit.</p>`;
      return;
    }
    box.innerHTML = items
      .slice(0, 4)
      .map(
        (b) => `
      <div style="padding:14px 16px;border-radius:14px;background:var(--sc-cream);border:1px solid var(--sc-border);margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;gap:8px;font-weight:700;color:var(--sc-charcoal);">
          <span>${escapeHTML(b.service)}</span>
          <span style="color:var(--sc-primary-dark);">${escapeHTML(b.ref)}</span>
        </div>
        <div style="font-size:0.88rem;color:var(--sc-text);margin-top:4px;">
          ${escapeHTML(b.date)} ${b.time ? "at " + escapeHTML(b.time) : ""} · ${escapeHTML(b.doctor || "Dermatology Team")}
        </div>
      </div>
    `
      )
      .join("");
  }

  function initInlineForms() {
    renderSavedAppointmentsList();

    const inlineForm = qs("#scInlineApptForm");
    if (inlineForm) {
      const dateInput = qs('input[type="date"]', inlineForm);
      if (dateInput) {
        dateInput.min = getTodayISO();
        if (!dateInput.value) dateInput.value = getTomorrowISO();
      }
      inlineForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(inlineForm);
        const name = (fd.get("name") || "").toString().trim();
        const email = (fd.get("email") || "").toString().trim();
        const phone = (fd.get("phone") || "").toString().trim();
        const date = (fd.get("date") || "").toString();
        const service = (fd.get("service") || "Dermatology Consultation").toString();
        const message = (fd.get("message") || "").toString().trim();

        if (!name || !email || !phone || !date) {
          showToast("Please fill in your name, email, phone, and preferred date.");
          return;
        }
        const ref = "SC-" + Math.floor(100000 + Math.random() * 900000);
        saveAppointment({
          ref,
          name,
          email,
          phone,
          date,
          time: "Confirmed by Clinic",
          service,
          doctor: "Assigned Dermatology Specialist",
          notes: message,
          createdAt: new Date().toISOString()
        });
        inlineForm.reset();
        if (dateInput) dateInput.value = getTomorrowISO();
        renderSavedAppointmentsList();
        showToast("Booking confirmed! Reference: " + ref);
      });
    }

    const contactForm = qs("#scContactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(contactForm);
        const name = (fd.get("name") || "").toString().trim();
        const email = (fd.get("email") || "").toString().trim();
        if (!name || !email) {
          showToast("Please enter your name and email address.");
          return;
        }
        const list = JSON.parse(localStorage.getItem(INQUIRY_KEY) || "[]");
        list.unshift({
          name,
          email,
          phone: fd.get("phone") || "",
          message: fd.get("message") || "",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem(INQUIRY_KEY, JSON.stringify(list.slice(0, 20)));
        contactForm.reset();
        showToast("Thank you! Our patient care coordinator will reply shortly.");
      });
    }
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initHeaderAndDrawer();
    mountAppointmentModal();
    bindAppointmentTriggers();
    initSearchModal();
    initTestimonials();
    initProgressBars();
    initPricingToggle();
    initFAQs();
    initBranchTabs();
    initServiceDetailsPage();
    initInlineForms();
  });

  window.SkinCareApp = {
    openAppointmentModal
  };
})();
