const $ = (s) => document.querySelector(s);
let portfolioProjects = [];
let activeProjectFilter = "all";
let projectQuery = "";

async function loadPortfolio() {
  try {
    const [profileRes, projectsRes, certificatesRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/projects"),
      fetch("/api/certificates")
    ]);
    const profile = await profileRes.json();
    const projects = await projectsRes.json();
    const certificates = await certificatesRes.json();
    portfolioProjects = projects;

    document.title = `${profile.name} | Portfolio`;
    $("#heroBio").textContent = profile.bio;
    $("#aboutBio").textContent = profile.bio;
    $("#heroRole").textContent = profile.role || "Full-stack developer";
    $("#heroLocation").textContent = (profile.location || "Nepal").toUpperCase();
    $("#terminalName").textContent = profile.name.toLowerCase().replace(/\s+/g, "-");
    $("#location").textContent = profile.location || "—";
    $("#email").textContent = profile.email || "—";
    $("#footerName").textContent = profile.name;
    $("#year").textContent = new Date().getFullYear();

    if (profile.github) $("#github").href = profile.github;
    if (profile.linkedin) $("#linkedin").href = profile.linkedin;

    $("#projectCount").textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
    animateNumber($("#heroProjectCount"), projects.length);
    animateNumber($("#heroCertificateCount"), certificates.length);
    renderProjects();
    renderCertificates(certificates);
  } catch (err) {
    $("#heroBio").textContent = "Currently refining the portfolio experience — check back shortly.";
    $("#projectsGrid").innerHTML = '<div class="empty-state api-state"><strong>Portfolio data is taking a moment.</strong><span>The visual experience is ready; live content will return shortly.</span></div>';
    $("#certificatesGrid").innerHTML = '<div class="empty-state api-state"><strong>Credentials are loading.</strong><span>Please refresh in a moment.</span></div>';
  }
}

function renderProjects() {
  const grid = $("#projectsGrid");
  const filtered = portfolioProjects.filter(project => {
    const matchesFilter = activeProjectFilter === "all" || Boolean(project.featured);
    const haystack = `${project.title} ${project.description} ${project.tech}`.toLowerCase();
    return matchesFilter && (!projectQuery || haystack.includes(projectQuery));
  });
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = filtered.length ? filtered.map((p, i) => {
      const imageUrl = p.image ? safeUrl(p.image) : "";
      const hasImage = Boolean(imageUrl && imageUrl !== "#");
      return `
      <article class="project ${p.featured ? "featured" : ""} ${hasImage ? "has-media credential-card" : ""}" style="--card-index:${i}">
        <div class="project-top"><div class="number">0${String(i + 1).padStart(2, "0")}</div>${p.featured ? '<span class="featured-label">FEATURED</span>' : ""}</div>
        ${hasImage ? `<div class="project-media"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(p.title)} certificate or project preview" loading="lazy"><span class="media-label">CREDENTIAL / ${String(i + 1).padStart(2, "0")}</span><span class="media-scan"></span></div>` : `<div class="project-icon">${projectIcon(i)}</div>`}
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <div class="tags">
          ${(p.tech || "").split(",").filter(Boolean).map(t => `<span class="tag">${escapeHtml(t.trim())}</span>`).join("")}
        </div>
        <div class="project-links">
          ${p.url ? `<a href="${safeUrl(p.url)}" target="_blank" rel="noreferrer">${hasImage ? "VERIFY CREDENTIAL" : "LIVE"} ↗</a>` : ""}
          ${p.github ? `<a href="${safeUrl(p.github)}" target="_blank" rel="noreferrer">CODE ↗</a>` : ""}
        </div>
      </article>
    `;
  }).join("") : '<div class="empty-state api-state"><strong>No matching projects.</strong><span>Try another search or switch back to all work.</span></div>';
}

function renderCertificates(certificates) {
  const grid = $("#certificatesGrid");
  if (!grid) return;
  $("#certificateCount").textContent = `${certificates.length} certificate${certificates.length === 1 ? "" : "s"}`;
  grid.innerHTML = certificates.length ? certificates.map((certificate, index) => {
    const imageUrl = certificate.image_url ? safeUrl(certificate.image_url) : "";
    const documentUrl = certificate.document_url ? safeUrl(certificate.document_url) : imageUrl;
    const verifyUrl = safeUrl(certificate.credential_url || certificate.document_url || certificate.image_url || "#");
    const tags = (certificate.description || "Credential").split(/[,.]/).filter(Boolean).slice(0, 2);
    return `
      <article class="certificate-card" style="--certificate-index:${index}">
        <a class="certificate-visual ${imageUrl ? "has-image" : "pdf-visual"}" href="${verifyUrl}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(certificate.title)}">
          ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(certificate.title)} certificate" loading="lazy">` : `<span class="pdf-icon">PDF</span><span class="pdf-hint">Original document</span>`}
          <span class="certificate-overlay">OPEN CREDENTIAL ↗</span>
        </a>
        <div class="certificate-body">
          <div class="certificate-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(formatDate(certificate.issued_on))}</span></div>
          <h3>${escapeHtml(certificate.title)}</h3>
          <p>${escapeHtml(certificate.issuer)}</p>
          <div class="certificate-tags">${tags.map(tag => `<span>${escapeHtml(tag.trim())}</span>`).join("")}</div>
          <div class="certificate-actions"><a href="${verifyUrl}" target="_blank" rel="noreferrer">${certificate.credential_url ? "VERIFY CREDENTIAL" : "VIEW CERTIFICATE"} ↗</a>${certificate.document_url ? `<a href="${documentUrl}" target="_blank" rel="noreferrer">PDF ↗</a>` : ""}</div>
        </div>
      </article>`;
  }).join("") : '<div class="empty-state">Certificates will appear here as they are added.</div>';
}

function formatDate(value) {
  if (!value) return "Credential";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"});
}

function animateNumber(element, target) {
  if (!element) return;
  const duration = 700;
  const start = performance.now();
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("#formStatus");
  status.textContent = "Sending...";
  const data = Object.fromEntries(new FormData(e.target));

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Failed to send");
    status.textContent = "Message received. Thank you!";
    e.target.reset();
  } catch (err) {
    status.textContent = err.message;
  }
});

$(".menu").addEventListener("click", () => {
  const open = $("nav").classList.toggle("open");
  $(".menu").setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => {
  $("nav").classList.remove("open");
  $(".menu").setAttribute("aria-expanded", "false");
}));

document.querySelectorAll("[data-project-filter]").forEach(button => button.addEventListener("click", () => {
  activeProjectFilter = button.dataset.projectFilter;
  document.querySelectorAll("[data-project-filter]").forEach(item => item.classList.toggle("active", item === button));
  renderProjects();
}));
$("#projectSearch").addEventListener("input", event => {
  projectQuery = event.target.value.trim().toLowerCase();
  renderProjects();
});

const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.12 }) : null;
document.querySelectorAll(".section").forEach(section => revealObserver ? revealObserver.observe(section) : section.classList.add("is-visible"));

const sectionLinks = [...document.querySelectorAll("nav a")];
const sectionObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-35% 0px -55% 0px" }) : null;
document.querySelectorAll("main section[id]").forEach(section => sectionObserver ? sectionObserver.observe(section) : null);

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (canHover) {
  const heroCard = $(".hero-card");
  heroCard.addEventListener("pointermove", event => {
    const rect = heroCard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    heroCard.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
    heroCard.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
  });
  heroCard.addEventListener("pointerleave", () => {
    heroCard.style.setProperty("--tilt-x", "0deg");
    heroCard.style.setProperty("--tilt-y", "0deg");
  });
}

function projectIcon(index) {
  return ["↗", "⌘", "◌", "✦", "⌁"][index % 5];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function safeUrl(value) {
  try {
    const u = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "#";
  } catch {
    return "#";
  }
}

loadPortfolio();
