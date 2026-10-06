const $ = (s) => document.querySelector(s);

const certificates = [
  { title: "APISEC Certified Practitioner", issuer: "APISEC University", date: "Mar 25, 2026", image: "ACP.png", document: "", verify: "https://www.credly.com/badges/f0bdbfa5-d95b-44f2-b0fb-62c2f1f7fd3b", tags: ["API Security", "Certification"] },
  { title: "Certified API Security Analyst", issuer: "APISEC University", date: "Mar 14, 2026", image: "casa-grish.png", document: "CASAExam20260314-33-x7ztkv.pdf", verify: "https://www.credly.com/badges/ffe66c83-e901-4977-9cb3-fc55a7aa9485", tags: ["API Security", "Analysis"] },
  { title: "Certified Threat Intelligence & Governance Analyst", issuer: "Red Team Leaders", date: "Jan 11, 2026", image: "CTIGA.jpg", verify: "https://courses.redteamleaders.com/exam-completion/57815fb39704a13c", tags: ["Threat Intelligence", "Governance"] },
  { title: "Certified Red Team Operations Management", issuer: "Red Team Leaders", date: "Dec 26, 2025", image: "crtom.png", verify: "https://courses.redteamleaders.com/exam-completion/898fc2d5c46bf502", tags: ["Red Team", "Operations"] },
  { title: "Advent of Cyber 2025", issuer: "TryHackMe", date: "Dec 25, 2025", image: "THM-2025-1.png", document: "THM-2025.pdf", tags: ["Cybersecurity", "Challenges"] },
  { title: "Introduction to Penetration Testing", issuer: "Security Blue Team", date: "Nov 26, 2025", image: "Introduction to Penetration Testing-course_page-0001.jpg", document: "Introduction to Penetration Testing-course.pdf", tags: ["Penetration Testing", "Foundations"] },
  { title: "Web Fundamentals", issuer: "TryHackMe", date: "May 1, 2025", image: "webfundamental.png", document: "thm-webfundamentals.pdf", tags: ["Web Security", "Fundamentals"] },
  { title: "Jr Penetration Tester", issuer: "TryHackMe", date: "May 1, 2025", image: "jrpentest.png", document: "THM-CF9KJ3JXBX.pdf", tags: ["Pentesting", "Learning Path"] },
  { title: "Cyber Security 101", issuer: "TryHackMe", date: "Apr 24, 2025", image: "101.png", document: "thm-101.pdf", tags: ["Cybersecurity", "Learning Path"] },
  { title: "Scenario-Based CW-OS", issuer: "Certificate document", date: "Certificate PDF", image: "", document: "scenerio based CW-OS.pdf", tags: ["Security", "Scenario"] },
  { title: "Security Certificate", issuer: "Certificate document", date: "Certificate PDF", image: "", document: "certified_certificate.pdf", tags: ["Security"] },
  { title: "Security Certificate I", issuer: "Certificate document", date: "Certificate PDF", image: "", document: "certified_certificate1.pdf", tags: ["Security"] },
  { title: "Red Team Certificate", issuer: "Certificate document", date: "Certificate PDF", image: "", document: "certified_red_certificate.pdf", tags: ["Red Team"] }
];

async function loadPortfolio() {
  try {
    const [profileRes, projectsRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/projects")
    ]);
    const profile = await profileRes.json();
    const projects = await projectsRes.json();

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

    $("#projectsGrid").innerHTML = projects.map((p, i) => {
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
    }).join("");
    renderCertificates();
  } catch (err) {
    $("#heroBio").textContent = "Portfolio API is unavailable. Check the Docker container logs.";
  }
}

function renderCertificates() {
  const grid = $("#certificatesGrid");
  if (!grid) return;
  $("#certificateCount").textContent = `${certificates.length} certificate${certificates.length === 1 ? "" : "s"}`;
  grid.innerHTML = certificates.map((certificate, index) => {
    const imageUrl = certificate.image ? `/certificates/${encodeURIComponent(certificate.image)}` : "";
    const documentUrl = certificate.document ? `/certificates/${encodeURIComponent(certificate.document)}` : imageUrl;
    const verifyUrl = certificate.verify || documentUrl;
    return `
      <article class="certificate-card" style="--certificate-index:${index}">
        <a class="certificate-visual ${imageUrl ? "has-image" : "pdf-visual"}" href="${verifyUrl}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(certificate.title)}">
          ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(certificate.title)} certificate" loading="lazy">` : `<span class="pdf-icon">PDF</span><span class="pdf-hint">Original document</span>`}
          <span class="certificate-overlay">OPEN CREDENTIAL ↗</span>
        </a>
        <div class="certificate-body">
          <div class="certificate-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(certificate.date)}</span></div>
          <h3>${escapeHtml(certificate.title)}</h3>
          <p>${escapeHtml(certificate.issuer)}</p>
          <div class="certificate-tags">${certificate.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="certificate-actions"><a href="${verifyUrl}" target="_blank" rel="noreferrer">${certificate.verify ? "VERIFY BADGE" : "VIEW CERTIFICATE"} ↗</a>${certificate.document ? `<a href="${documentUrl}" target="_blank" rel="noreferrer">PDF ↗</a>` : ""}</div>
        </div>
      </article>`;
  }).join("");
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
