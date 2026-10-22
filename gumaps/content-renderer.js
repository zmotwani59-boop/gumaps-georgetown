/* GUMAPS public pages – editable content renderer. No credentials in this file. */
(() => {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const href = (value) => {
    const v = String(value ?? "").trim();
    if (!v || /[\s"'<>]/.test(v)) return "";
    if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
    if (/^(?!\/|\\|#|[a-z]+:)[a-z0-9][a-z0-9/_\-\.?#=&%]*$/i.test(v) && !v.includes("..")) return v;
    return "";
  };
  const action = (url, label = "Learn more") => {
    const safe = href(url);
    return safe ? '<a class="btn secondary" href="' + esc(safe) + '"' +
      (/^https?:\/\//i.test(safe) ? ' target="_blank" rel="noopener noreferrer"' : "") +
      '>' + esc(label) + '</a>' : "";
  };
  const initials = (name) => String(name || "").split(/\s+/).slice(0,2).map(x => x[0] || "").join("").toUpperCase();
  const statusClass = s => /open|available|spots left|seeking/i.test(s || "") ? "open" : "soon";
  const eventCard = item => '<div class="event"><div class="date">' + esc(item.date) +
    '</div><div><h3>' + esc(item.title) + '</h3><p>' + esc(item.description || item.timeLocation || "") +
    '</p>' + (item.status ? '<span class="status ' + statusClass(item.status) + '">' + esc(item.status) + '</span>' : "") +
    '</div>' + action(item.link, item.linkText || "Learn more") + '</div>';
  const serviceCard = x => eventCard({
    date: x.date, title: x.title,
    description: [x.timeLocation,x.availability].filter(Boolean).join(" · "),
    status: x.status, link: x.link, linkText: x.linkText || "Sign up"
  });
  const boardCard = x => {
    const picture = href(x.image);
    const visual = picture ? '<img src="' + esc(picture) + '" alt="' + esc(x.name) + '" loading="lazy" class="gumaps-portrait">' :
      '<div class="initials">' + esc(initials(x.name)) + '</div>';
    return '<article class="board-card">' + visual + '<div><h3>' + esc(x.name) +
      '</h3><div class="role">' + esc(x.role) + '</div><p>' + esc(x.description) + '</p></div></article>';
  };
  const serviceRow = x => '<tr><td><strong>' + esc(x.date) + '</strong></td>' +
    '<td><div class="org">' + esc(x.title) + '</div><div class="small">' + esc(x.category) + '</div></td>' +
    '<td>' + esc(x.timeLocation) + '</td><td><span class="status ' + statusClass(x.status) + '">' + esc(x.status) +
    '</span></td><td><span class="capacity">' + esc(x.availability) + '</span></td><td>' +
    action(x.link, x.linkText || "Sign up") + '</td></tr>';
  const labCard = (x,i) => {
    const stat = ["yes","possible","no"].includes(x.status) ? x.status : "possible";
    const searchable = [x.name,x.investigator,x.topics,x.description].join(" ").toLowerCase();
    const contact = action(x.contactLink,"Contact research group");
    return '<article class="entry" data-status="' + stat + '" data-search="' + esc(searchable) + '">' +
      '<div class="entry-id"><span class="entry-number">' + String(i+1).padStart(2,"0") +
      '</span><h3>' + esc(x.name) + '</h3><p class="investigator">' + esc(x.investigator) +
      '</p><p class="availability">' + esc(x.availability) + '</p></div>' +
      '<div class="entry-research"><p class="topics">' + esc(x.topics) +
      '</p><p class="description">' + esc(x.description) +
      '</p><p class="contact"><span class="email">' + esc(x.contact) + '</span> ' + contact +
      '</p></div></article>';
  };
  async function render() {
    try {
      const response = await fetch("site-content.json", { cache: "no-cache" });
      if (!response.ok) throw Error("Cannot load website content");
      const data = await response.json();
      if (!data || data.version !== 1) throw Error("Unsupported content format");
      const homeService = document.querySelector("#events .event-list");
      if (homeService && Array.isArray(data.volunteer)) homeService.innerHTML = data.volunteer.map(serviceCard).join("");
      const homeEvents = document.querySelector("#other-events .event-list");
      if (homeEvents && Array.isArray(data.events)) homeEvents.innerHTML = data.events.map(eventCard).join("");
      const board = document.querySelector("#board .board-grid");
      if (board && Array.isArray(data.board)) {
        board.innerHTML = data.board.map(boardCard).join("");
        if (!document.getElementById("gumaps-portrait-style")) {
          const style = document.createElement("style"); style.id="gumaps-portrait-style";
          style.textContent=".gumaps-portrait{width:66px;height:66px;object-fit:cover;border-radius:50%;flex:none;}";
          document.head.appendChild(style);
        }
      }
      const service = document.querySelector("#opportunities tbody");
      if (service && Array.isArray(data.volunteer)) service.innerHTML = data.volunteer.map(serviceRow).join("");
      const labs = document.getElementById("directory");
      if (labs && Array.isArray(data.labs)) {
        labs.innerHTML = data.labs.map(labCard).join("");
        const count = document.querySelector("#labs .section-heading small");
        if (count) count.textContent = data.labs.length + " groups registered";
      }
      document.dispatchEvent(new Event("gumaps:content-ready"));
    } catch (e) {
      console.warn("GUMAPS content: using original page content.",e);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",render);
  else render();
})();
