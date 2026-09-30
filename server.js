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