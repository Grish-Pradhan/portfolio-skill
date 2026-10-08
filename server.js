const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "portfolio.db");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-this-token";

const fs = require("fs");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech TEXT DEFAULT '',
  image TEXT DEFAULT '',
  url TEXT DEFAULT '',
  github TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  github TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  website TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issued_on TEXT DEFAULT '',
  credential_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  document_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM projects").get().n;
if (!count) {
  const insert = db.prepare(`
    INSERT INTO projects (title, description, tech, image, url, github, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const seed = db.transaction(() => {
    insert.run(
      "Security Lab",
      "A Dockerized security lab for practicing web application testing, reconnaissance, and defensive analysis.",
      "Docker, Linux, Nginx, Security",
      "",
      "",
      "",
      1
    );
    insert.run(
      "Full-Stack Dashboard",
      "A responsive dashboard with authentication-ready API architecture, persistent data, and reusable components.",
      "Node.js, Express, SQLite, JavaScript",
      "",
      "",
      "",
      1
    );
    insert.run(
      "Automation Toolkit",
      "A collection of scripts and workflows that turn repetitive technical tasks into simple commands.",
      "Python, PowerShell, Docker",
      "",
      "",
      "",
      0
    );
  });
  seed();
}

const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
if (!profile) {
  db.prepare(`
    INSERT INTO profile (id, name, role, bio, location, email, github, linkedin, website)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Your Name",
    "Security Researcher & Full-Stack Developer",
    "I build practical software, security labs, automation tools, and modern web experiences. This portfolio is powered by a real backend and persistent SQLite storage.",
    "Nepal",
    "hello@example.com",
    "https://github.com/",
    "https://linkedin.com/",
    ""
  );
}

const certificateCount = db.prepare("SELECT COUNT(*) AS n FROM certificates").get().n;
if (!certificateCount) {
  const insertCertificate = db.prepare(`
    INSERT INTO certificates (title, issuer, issued_on, credential_url, image_url, document_url, description, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedCertificates = [
    ["APISEC Certified Practitioner", "APISEC University", "2026-03-25", "https://www.credly.com/badges/f0bdbfa5-d95b-44f2-b0fb-62c2f1f7fd3b", "/certificates/ACP.png", "", "API security practitioner certification.", 1],
    ["Certified API Security Analyst", "APISEC University", "2026-03-14", "https://www.credly.com/badges/ffe66c83-e901-4977-9cb3-fc55a7aa9485", "/certificates/casa-grish.png", "/certificates/CASAExam20260314-33-x7ztkv.pdf", "API security analysis and assessment.", 1],
    ["Certified Threat Intelligence & Governance Analyst", "Red Team Leaders", "2026-01-11", "https://courses.redteamleaders.com/exam-completion/57815fb39704a13c", "/certificates/CTIGA.jpg", "", "Threat intelligence, governance, and structured analysis.", 1],
    ["Certified Red Team Operations Management", "Red Team Leaders", "2025-12-26", "https://courses.redteamleaders.com/exam-completion/898fc2d5c46bf502", "/certificates/crtom.png", "", "Red team operations management and adversary simulation.", 1],
    ["Advent of Cyber 2025", "TryHackMe", "2025-12-25", "", "/certificates/THM-2025-1.png", "/certificates/THM-2025.pdf", "24 hands-on cybersecurity challenges.", 0],
    ["Introduction to Penetration Testing", "Security Blue Team", "2025-11-26", "", "/certificates/Introduction%20to%20Penetration%20Testing-course_page-0001.jpg", "/certificates/Introduction%20to%20Penetration%20Testing-course.pdf", "Foundations of ethical hacking and penetration testing.", 0],
    ["Web Fundamentals", "TryHackMe", "2025-05-01", "", "/certificates/webfundamental.png", "/certificates/thm-webfundamentals.pdf", "Web security fundamentals learning path.", 0],
    ["Jr Penetration Tester", "TryHackMe", "2025-05-01", "", "/certificates/jrpentest.png", "/certificates/THM-CF9KJ3JXBX.pdf", "Practical penetration testing learning path.", 0],
    ["Cyber Security 101", "TryHackMe", "2025-04-24", "", "/certificates/101.png", "/certificates/thm-101.pdf", "Cybersecurity fundamentals learning path.", 0],
    ["Scenario-Based CW-OS", "Certificate document", "", "", "", "/certificates/scenerio%20based%20CW-OS.pdf", "Scenario-based security training.", 0],
    ["Security Certificate", "Certificate document", "", "", "", "/certificates/certified_certificate.pdf", "Additional security credential.", 0],
    ["Security Certificate I", "Certificate document", "", "", "", "/certificates/certified_certificate1.pdf", "Additional security credential.", 0],
    ["Red Team Certificate", "Certificate document", "", "", "", "/certificates/certified_red_certificate.pdf", "Additional red team credential.", 0]
  ];
  const seed = db.transaction(() => seedCertificates.forEach(certificate => insertCertificate.run(...certificate)));
  seed();
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});
app.get("/admin/admin.css", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin.css"));
});
app.get("/admin/admin.js", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin.js"));
});

function requireAdmin(req, res, next) {
  const token = req.get("x-admin-token") || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/profile", (req, res) => {
  res.json(db.prepare("SELECT * FROM profile WHERE id = 1").get());
});

app.get("/api/projects", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects ORDER BY featured DESC, id DESC").all();
  res.json(projects);
});

app.get("/api/projects/:id", (req, res) => {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

app.get("/api/certificates", (req, res) => {
  res.json(db.prepare("SELECT * FROM certificates ORDER BY featured DESC, issued_on DESC, id DESC").all());
});

app.get("/api/certificates/:id", (req, res) => {
  const certificate = db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found" });
  res.json(certificate);
});

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: "Message is too long." });
  }

  const result = db.prepare(`
    INSERT INTO messages (name, email, message) VALUES (?, ?, ?)
  `).run(String(name).trim(), String(email).trim(), String(message).trim());

  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

app.get("/api/admin/messages", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT * FROM messages ORDER BY id DESC").all());
});

app.delete("/api/admin/messages/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM messages WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Message not found" });
  res.json({ success: true });
});

app.post("/api/admin/certificates", requireAdmin, (req, res) => {
  const { title, issuer, issued_on = "", credential_url = "", image_url = "", document_url = "", description = "", featured = 0 } = req.body || {};
  if (!title || !issuer) return res.status(400).json({ error: "Title and issuer are required." });
  const result = db.prepare(`
    INSERT INTO certificates (title, issuer, issued_on, credential_url, image_url, document_url, description, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(String(title).trim(), String(issuer).trim(), issued_on, credential_url, image_url, document_url, description, featured ? 1 : 0);
  res.status(201).json(db.prepare("SELECT * FROM certificates WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/admin/certificates/:id", requireAdmin, (req, res) => {
  const { title, issuer, issued_on = "", credential_url = "", image_url = "", document_url = "", description = "", featured = 0 } = req.body || {};
  if (!title || !issuer) return res.status(400).json({ error: "Title and issuer are required." });
  const result = db.prepare(`
    UPDATE certificates SET title=?, issuer=?, issued_on=?, credential_url=?, image_url=?, document_url=?, description=?, featured=? WHERE id=?
  `).run(String(title).trim(), String(issuer).trim(), issued_on, credential_url, image_url, document_url, description, featured ? 1 : 0, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Certificate not found" });
  res.json(db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id));
});

app.delete("/api/admin/certificates/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM certificates WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Certificate not found" });
  res.json({ success: true });
});

app.post("/api/admin/projects", requireAdmin, (req, res) => {
  const { title, description, tech = "", image = "", url = "", github = "", featured = 0 } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: "Title and description are required." });

  const result = db.prepare(`
    INSERT INTO projects (title, description, tech, image, url, github, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, tech, image, url, github, featured ? 1 : 0);

  res.status(201).json(db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/admin/projects/:id", requireAdmin, (req, res) => {
  const { title, description, tech = "", image = "", url = "", github = "", featured = 0 } = req.body || {};
  const result = db.prepare(`
    UPDATE projects
    SET title = ?, description = ?, tech = ?, image = ?, url = ?, github = ?, featured = ?
    WHERE id = ?
  `).run(title, description, tech, image, url, github, featured ? 1 : 0, req.params.id);

  if (!result.changes) return res.status(404).json({ error: "Project not found" });
  res.json(db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id));
});

app.delete("/api/admin/projects/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Project not found" });
  res.json({ success: true });
});

app.put("/api/admin/profile", requireAdmin, (req, res) => {
  const { name, role, bio, location = "", email = "", github = "", linkedin = "", website = "" } = req.body || {};
  if (!name || !role || !bio) return res.status(400).json({ error: "Name, role and bio are required." });

  db.prepare(`
    UPDATE profile SET name=?, role=?, bio=?, location=?, email=?, github=?, linkedin=?, website=?
    WHERE id=1
  `).run(name, role, bio, location, email, github, linkedin, website);

  res.json(db.prepare("SELECT * FROM profile WHERE id=1").get());
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Portfolio running on http://0.0.0.0:${PORT}`);
});
