let token = sessionStorage.getItem("adminToken") || "";
const $ = s => document.querySelector(s);

async function api(path, options={}) {
  options.headers = { ...(options.headers || {}), "x-admin-token": token };
  const res = await fetch(path, options);
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function showApp() {
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  loadAll();
}

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const t = $("#tokenInput").value;
  try {
    token = t;
    await api("/api/admin/messages");
    sessionStorage.setItem("adminToken", token);
    showApp();
  } catch {
    token = "";
    $("#loginStatus").textContent = "Invalid admin token.";
  }
});

$("#logout").onclick = () => {
  sessionStorage.removeItem("adminToken");
  token = "";
  location.reload();
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    $("#" + btn.dataset.section).classList.add("active");
    $("#pageTitle").textContent = btn.textContent;
  };
});

async function loadAll() {
  try {
    const [projects, messages, profile] = await Promise.all([
      api("/api/projects"), api("/api/admin/messages"), api("/api/profile")
    ]);
    renderProjects(projects);
    renderMessages(messages);
    fillProfile(profile);
    $("#statProjects").textContent = projects.length;
    $("#statMessages").textContent = messages.length;
    $("#statFeatured").textContent = projects.filter(p => p.featured).length;
    renderOverviewChart(projects, messages);
  } catch (e) {
    if (e.message === "Unauthorized") location.reload();
  }
}

function renderOverviewChart(projects, messages) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const days = Array.from({length: 7}, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
  const counts = days.map(day => messages.filter(message => {
    const created = new Date(message.created_at);
    return created.toDateString() === day.toDateString();
  }).length);
  const max = Math.max(...counts, 1);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const peak = Math.max(...counts);
  const peakIndex = counts.indexOf(peak);
  const featured = projects.filter(project => project.featured).length;
  const other = projects.length - featured;
  const percent = projects.length ? Math.round((featured / projects.length) * 100) : 0;

  $("#chartTotal").textContent = total;
  $("#chartPeak").textContent = peak ? `Busiest: ${days[peakIndex].toLocaleDateString(undefined, {weekday:"short"})}` : "No activity yet";
  $("#activityChart").innerHTML = counts.map((count, index) => {
    const label = days[index].toLocaleDateString(undefined, {weekday:"short"});
    const height = count ? Math.max((count / max) * 100, 12) : 5;
    return `<div class="chart-column" title="${label}: ${count} message${count === 1 ? "" : "s"}"><span class="chart-value">${count}</span><div class="bar-track"><div class="bar-fill" style="height:${height}%"></div></div><span class="chart-label">${label}</span></div>`;
  }).join("");

  $("#featuredDonut").style.setProperty("--donut-progress", `${percent * 3.6}deg`);
  $("#featuredPercent").textContent = `${percent}%`;
  $("#healthFeatured").textContent = featured;
  $("#healthOther").textContent = other;
  $("#healthHeadline").textContent = percent >= 50 ? "Strong showcase" : projects.length ? "Almost there" : "Ready to grow";
  $("#healthCopy").textContent = percent >= 50 ? "Your best work is easy to spot at a glance." : projects.length ? "Feature more work to make your strongest projects stand out." : "Add a featured project to give your work a stronger first impression.";
}

function renderProjects(projects) {
  $("#projectsList").innerHTML = projects.length ? projects.map(p => `
    <div class="project-row">
      <div><h4>${esc(p.title)} ${p.featured ? '<span class="meta"> · FEATURED</span>' : ''}</h4>
      <p>${esc(p.description)}</p><span class="meta">${esc(p.tech || "")}</span></div>
      <div class="row-actions">
        <button class="small-btn" onclick="editProject(${p.id})">Edit</button>
        <button class="small-btn delete" onclick="deleteProject(${p.id})">Delete</button>
      </div>
    </div>`).join("") : '<div class="panel" style="padding:25px;color:#969ba7">No projects yet.</div>';
}

function renderMessages(messages) {
  $("#messagesList").innerHTML = messages.length ? messages.map(m => `
    <article class="message">
      <div><h4>${esc(m.name)}</h4><p>${esc(m.message)}</p></div>
      <div class="meta">${esc(m.email)} · ${esc(m.created_at)}</div>
    </article>`).join("") : '<div class="panel" style="padding:25px;color:#969ba7">No messages yet.</div>';
}

function fillProfile(p) {
  const form = $("#profileForm");
  for (const k of ["name","role","bio","location","email","github","linkedin","website"])
    form.elements[k].value = p[k] || "";
}

$("#profileForm").onsubmit = async e => {
  e.preventDefault();
  const status = $("#profileStatus");
  try {
    const data = Object.fromEntries(new FormData(e.target));
    await api("/api/admin/profile", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    status.textContent = "Saved.";
    setTimeout(()=>status.textContent="",2000);
    loadAll();
  } catch(e) { status.textContent = e.message; }
};

function openProject(p={}) {
  $("#projectModal").classList.remove("hidden");
  $("#modalTitle").textContent = p.id ? "Edit project" : "New project";
  const f=$("#projectForm");
  ["id","title","description","tech","url","github","image"].forEach(k=>f.elements[k].value=p[k]||"");
  f.elements.featured.checked=!!p.featured;
}
$("#newProject").onclick=()=>openProject();
$("#closeModal").onclick=()=>$("#projectModal").classList.add("hidden");

window.editProject=async id=>openProject(await fetch("/api/projects/"+id).then(r=>r.json()));
window.deleteProject=async id=>{
  if(!confirm("Delete this project?")) return;
  try { await api("/api/admin/projects/"+id,{method:"DELETE"}); loadAll(); } catch(e){alert(e.message);}
};

$("#projectForm").onsubmit=async e=>{
  e.preventDefault();
  const f=e.target, id=f.elements.id.value;
  const data=Object.fromEntries(new FormData(f));
  data.featured=f.elements.featured.checked?1:0;
  delete data.id;
  try {
    await api("/api/admin/projects"+(id?"/"+id:""),{
      method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)
    });
    $("#projectModal").classList.add("hidden"); loadAll();
  } catch(e){$("#projectStatus").textContent=e.message;}
};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

if(token) showApp();
