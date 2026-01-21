// UniConnect front-end logic

const pages = document.querySelectorAll(".page");
const logoutBtn = document.getElementById("logout-btn");

// Keeping localhost:4000 is fine for local testing.
const API_BASE = "http://localhost:4000";

/* -----------------------------
   Page navigation
-------------------------------- */
function showPage(id) {
  pages.forEach(p => p.classList.add("hidden"));

  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");

  // Go back to top when switching sections
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// All buttons with data-page switch sections
document.querySelectorAll("[data-page]").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

/* -----------------------------
   Brand click behavior
   - Not logged in -> Home
   - Logged in -> Portal
-------------------------------- */
const brand = document.querySelector(".brand");
function goHomeSmart() {
  const isAuthed = localStorage.getItem("isAuthed") === "true";
  const name = localStorage.getItem("userName") || "";
  if (isAuthed && name) showPage("portal");
  else showPage("home-public");
}

brand?.addEventListener("click", goHomeSmart);
brand?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") goHomeSmart();
});

/* -----------------------------
   UI state: before/after login
-------------------------------- */
function setAuthedUI(isAuthed, userName = "") {
  // Buttons that should show only after login
  const authedButtons = ["students-link", "programs-link", "about-link"];

  if (isAuthed) {
    authedButtons.forEach(id => document.getElementById(id)?.classList.remove("hidden"));

    // Hide login/signup buttons
    document.getElementById("login-link").style.display = "none";
    document.getElementById("signup-link").style.display = "none";

    // Show logout
    logoutBtn.classList.remove("hidden");

    // Turn Home into Portal
    const homeBtn = document.getElementById("home-link");
    homeBtn.textContent = "Portal";
    homeBtn.dataset.page = "portal";

    // Update portal titles with user name (from backend)
    document.getElementById("portal-title").textContent = `Portal — ${userName}`;
    document.getElementById("portal-user").textContent = userName || "User";
  } else {
    authedButtons.forEach(id => document.getElementById(id)?.classList.add("hidden"));

    // Show login/signup
    document.getElementById("login-link").style.display = "inline-flex";
    document.getElementById("signup-link").style.display = "inline-flex";

    // Hide logout
    logoutBtn.classList.add("hidden");

    // Turn Portal back into Home
    const homeBtn = document.getElementById("home-link");
    homeBtn.textContent = "Home";
    homeBtn.dataset.page = "home-public";
  }
}

/* -----------------------------
   Portal greeting (last login)
-------------------------------- */
function updatePortalGreeting() {
  const lastLogin = localStorage.getItem("lastLogin");
  const lastLoginEl = document.getElementById("last-login");

  if (!lastLoginEl) return;

  if (!lastLogin) {
    lastLoginEl.textContent = "";
    return;
  }

  const d = new Date(lastLogin);
  lastLoginEl.textContent = `Last login: ${d.toLocaleString()}`;
}

/* -----------------------------
   Signup request
   Uses your route: POST /api/user
-------------------------------- */
document.getElementById("signup-btn")?.addEventListener("click", async () => {
  const payload = {
    name: document.getElementById("signup-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: document.getElementById("signup-password").value.trim(),
    phone: document.getElementById("signup-phone").value.trim(),
    dateofBirth: document.getElementById("signup-dob").value
  };

  const errEl = document.getElementById("signup-error");
  errEl.textContent = "";

  // Quick client-side check so user gets instant feedback
  if (!payload.name || !payload.email || !payload.password || !payload.phone || !payload.dateofBirth) {
    errEl.textContent = "Please fill all fields.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      errEl.textContent = data.message || "Sign up failed.";
      return;
    }

    alert("Account created. Please login.");
    showPage("login");
  } catch {
    errEl.textContent = "Server error. Please try again.";
  }
});

/* -----------------------------
   Login request
   Uses your route: POST /api/user/login
   Response includes: { message, name }
-------------------------------- */
document.getElementById("login-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const errEl = document.getElementById("login-error");
  errEl.textContent = "";

  if (!email || !password) {
    errEl.textContent = "Please enter email and password.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      errEl.textContent = data.message || "Invalid login.";
      return;
    }

    // Store minimal session info in localStorage (no JWT in your backend yet)
    const userName = data.name || "User";
    localStorage.setItem("isAuthed", "true");
    localStorage.setItem("userName", userName);
    localStorage.setItem("lastLogin", new Date().toISOString());

    setAuthedUI(true, userName);
    updatePortalGreeting();
    updateStudentCounts();

    showPage("portal");
  } catch {
    errEl.textContent = "Server error. Please try again.";
  }
});

/* -----------------------------
   Logout
-------------------------------- */
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("isAuthed");
  localStorage.removeItem("userName");
  localStorage.removeItem("lastLogin");
  location.reload();
});

/* -----------------------------
   Students search (filters cards)
-------------------------------- */
const searchInput = document.getElementById("student-search");

function getStudentCards() {
  return Array.from(document.querySelectorAll("#student-results .student-card"));
}

function updateStudentCounts() {
  const cards = getStudentCards();

  // Total number of cards shown in Portal
  const portalCount = document.getElementById("student-count");
  if (portalCount) portalCount.textContent = String(cards.length);

  // Visible results count on Students page
  const visible = cards.filter(c => c.style.display !== "none").length;
  const countEl = document.getElementById("result-count");
  if (countEl) countEl.textContent = String(visible);
}

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  getStudentCards().forEach(card => {
    const content = card.innerText.toLowerCase();
    card.style.display = content.includes(q) ? "" : "none";
  });

  updateStudentCounts();
});

/* -----------------------------
   Startup
   - Shows Home if not logged in
   - Shows Portal if logged in
-------------------------------- */
(function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  updateStudentCounts();

  const isAuthed = localStorage.getItem("isAuthed") === "true";
  const name = localStorage.getItem("userName") || "";

  if (isAuthed && name) {
    setAuthedUI(true, name);
    updatePortalGreeting();
    showPage("portal");
  } else {
    setAuthedUI(false);
    showPage("home-public");
  }
})();
