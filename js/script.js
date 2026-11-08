const KEY = "portfolio-data";
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; return /^https?:\/\/[^\s]+$/i.test(u) ? u : ""; };

function renderPortfolio(d, el) {
  if (!d || !d.name) {
    el.innerHTML = '<div class="empty"><h2>No portfolio yet</h2><p>Fill in the form and your portfolio will appear here.</p></div>';
    return;
  }
  const initials = d.name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const skills = (d.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const projects = (d.projects || []).filter(p => p.title);
  const links = [];
  if (d.email) links.push(`<a href="mailto:${esc(d.email)}">Email me</a>`);
  [["GitHub", d.github], ["LinkedIn", d.linkedin], ["Website", d.website]].forEach(([n, u]) => {
    const url = safeUrl(u); if (url) links.push(`<a href="${esc(url)}" target="_blank" rel="noopener">${n}</a>`);
  });
  const sub = [d.title, d.location].filter(Boolean).map(esc).join(", ");
  el.innerHTML = `<article class="pf" style="--accent:${/^#[0-9a-f]{6}$/i.test(d.color) ? d.color : "#2b50f0"}">
    <header class="pf-head"><div class="avatar" aria-hidden="true">${esc(initials)}</div>
      <div><h1>${esc(d.name)}</h1>${sub ? `<p class="role">${sub}</p>` : ""}</div></header>
    ${d.bio ? `<h2>About</h2><p class="bio">${esc(d.bio)}</p>` : ""}
    ${skills.length ? `<h2>Skills</h2><ul class="chips">${skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    ${projects.length ? `<h2>Projects</h2><div class="projects">${projects.map(p => {
      const u = safeUrl(p.link);
      return `<div class="proj"><h3>${esc(p.title)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ""}${u ? `<p><a href="${esc(u)}" target="_blank" rel="noopener">View project</a></p>` : ""}</div>`;
    }).join("")}</div>` : ""}
    ${links.length ? `<h2>Contact</h2><div class="contact">${links.join("")}</div>` : ""}
  </article>`;
}

const encodeData = d => btoa(encodeURIComponent(JSON.stringify(d)));
const decodeData = s => JSON.parse(decodeURIComponent(atob(s)));
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
const saveData = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };

/* create.html */
const form = document.getElementById("builder-form");
if (form) {
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");
  const collect = () => {
    const f = new FormData(form);
    return {
      name: f.get("name"), title: f.get("title"), location: f.get("location"), bio: f.get("bio"),
      skills: f.get("skills"), email: f.get("email"), github: f.get("github"), linkedin: f.get("linkedin"),
      website: f.get("website"), color: f.get("color"),
      projects: [1, 2, 3].map(i => ({ title: f.get("p" + i + "t"), desc: f.get("p" + i + "d"), link: f.get("p" + i + "l") }))
    };
  };
  const fill = d => {
    if (!d) return;
    ["name","title","location","bio","skills","email","github","linkedin","website"].forEach(k => form.elements[k].value = d[k] || "");
    (d.projects || []).forEach((p, i) => { form.elements["p"+(i+1)+"t"].value = p.title || ""; form.elements["p"+(i+1)+"d"].value = p.desc || ""; form.elements["p"+(i+1)+"l"].value = p.link || ""; });
    if (d.color) { const r = form.querySelector(`input[name=color][value="${d.color}"]`); if (r) r.checked = true; }
  };
  const update = () => { const d = collect(); saveData(d); renderPortfolio(d, preview); };
  fill(loadSaved()); update();
  form.addEventListener("input", update);
  form.addEventListener("submit", e => e.preventDefault());
  document.getElementById("copy-link").addEventListener("click", async () => {
    const d = collect();
    if (!d.name) { status.textContent = "Add your name first."; return; }
    const url = new URL("portfolio.html", location.href).href.split("#")[0] + "#d=" + encodeData(d);
    try { await navigator.clipboard.writeText(url); status.textContent = "Link copied. Send it to friends or companies."; }
    catch (e) { prompt("Copy this link:", url); }
  });
  document.getElementById("clear").addEventListener("click", () => {
    if (confirm("Clear all fields?")) { form.reset(); update(); status.textContent = "Form cleared."; }
  });
}

/* portfolio.html */
const view = document.getElementById("portfolio-view");
if (view) {
  let d = null;
  const m = location.hash.match(/^#d=(.+)$/);
  if (m) { try { d = decodeData(m[1]); } catch (e) {} }
  if (!d) d = loadSaved();
  renderPortfolio(d, view);
  if (d && d.name) document.title = d.name + " - Portfolio";
  const p = document.getElementById("print"); if (p) p.addEventListener("click", () => window.print());
}
