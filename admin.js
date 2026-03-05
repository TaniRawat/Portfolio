const STORAGE_KEY = "portfolioDataV2";
const LEGACY_KEY = "portfolioData";
const SESSION_KEY = "portfolioAdminSession";
const DEFAULT_PROJECT_IMAGE = "assets/projects/default.png";
const DEFAULT_SKILL_ICON = "assets/checkmark.png";
const SESSION_TIMEOUT_MS = 45 * 60 * 1000;
const ADMIN_CONFIG = window.APP_CONFIG || {};
const ADMIN_EMAIL = ADMIN_CONFIG.ADMIN_EMAIL || "tanishq24.rawat@gmail.com";
const ADMIN_PASSWORD = ADMIN_CONFIG.ADMIN_PASSWORD || "TRawat@2400";
const SUPABASE_TABLE = "portfolio_content";
const SUPABASE_ROW_KEY = "primary";

const DEFAULT_DATA = {
    profile: {
        resumeUrl: "Tanishq_Rawat_Resume.pdf",
        headline: "Software Engineer",
        email: "tanishq24.rawat@gmail.com",
        phone: "+91 9315322133",
        location: "New Delhi, India"
    },
    experience: {
        groups: [
            {
                id: "programming-languages",
                title: "Programming Languages",
                items: [
                    { id: "python", name: "Python", level: "", icon: "logos/python.png" },
                    { id: "java", name: "Java", level: "", icon: "logos/java.png" },
                    { id: "cplusplus", name: "C/C++", level: "", icon: "logos/cplusplus.png" },
                    { id: "html", name: "HTML", level: "", icon: "logos/html.png" },
                    { id: "css", name: "CSS", level: "", icon: "logos/css.png" },
                    { id: "javascript", name: "JavaScript", level: "", icon: "logos/javascript.png" },
                    { id: "react", name: "React", level: "Basic", icon: "logos/react.png" },
                    { id: "node", name: "NodeJs", level: "Basic", icon: "logos/node.png" },
                    { id: "django", name: "Django", level: "Basic", icon: "logos/django.png" }
                ]
            },
            {
                id: "development-tools-platforms",
                title: "Development Tools & Platforms",
                items: [
                    { id: "git", name: "Git/GitHub", level: "", icon: "logos/git.png" },
                    { id: "mysql", name: "MySQL", level: "", icon: "logos/mysql.png" },
                    { id: "postgres", name: "PostgreSQL", level: "", icon: "logos/postgreSQL.png" },
                    { id: "mongodb", name: "MongoDB", level: "", icon: "logos/mongodb.png" },
                    { id: "netlify", name: "Netlify", level: "", icon: "logos/netlify.png" },
                    { id: "vscode", name: "VS Code", level: "", icon: "logos/vscode.png" }
                ]
            }
        ]
    },
    projects: [],
    research: [],
    professionalExperience: []
};

let state = deepClone(DEFAULT_DATA);
let supabaseClient = null;
const editState = { projectId: null, researchId: null, groupId: null, skillId: null, workId: null };
const filterState = { projects: "", research: "", groups: "", skills: "" };
let hasPendingChanges = false;

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeData(data) {
    const normalized = deepClone(DEFAULT_DATA);
    if (!data) return normalized;
    if (Array.isArray(data.projects)) {
        normalized.projects = data.projects.map((project) => ({
            id: project.id || generateId("project"),
            title: project.title || "",
            image: project.image || project.img || "",
            description: project.description || project.desc || "",
            github: project.github || project.link || "",
            demo: project.demo || ""
        }));
    }
    if (Array.isArray(data.research)) {
        normalized.research = data.research.map((item) => ({
            id: item.id || generateId("research"),
            title: item.title || "",
            description: item.description || item.desc || "",
            link: item.link || "",
            ctaLabel: item.ctaLabel || "Read",
            paperType: item.paperType || "none",
            paperSource: item.paperSource || ""
        }));
    }
    if (data.profile) {
        normalized.profile = {
            resumeUrl: data.profile.resumeUrl || DEFAULT_DATA.profile.resumeUrl,
            headline: data.profile.headline || DEFAULT_DATA.profile.headline,
            email: data.profile.email || DEFAULT_DATA.profile.email,
            phone: data.profile.phone || DEFAULT_DATA.profile.phone,
            location: data.profile.location || DEFAULT_DATA.profile.location
        };
    }
    if (Array.isArray(data.professionalExperience)) {
        normalized.professionalExperience = data.professionalExperience.map((item) => ({
            id: item.id || generateId("work"),
            company: item.company || "",
            position: item.position || "",
            domain: item.domain || "",
            duration: item.duration || "",
            about: item.about || "",
            certificate: item.certificate || ""
        }));
    }
    if (Array.isArray(data?.experience?.groups)) {
        normalized.experience.groups = data.experience.groups.map((group) => ({
            id: group.id || generateId("group"),
            title: group.title || "Untitled Group",
            items: Array.isArray(group.items) ? group.items.map((skill) => ({
                id: skill.id || generateId("skill"), name: skill.name || "", level: skill.level || "", icon: skill.icon || ""
            })) : []
        }));
    }
    return normalized;
}

function getConfig() {
    return window.APP_CONFIG || {};
}

function createSupabaseClient() {
    const config = getConfig();
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return null;
    if (!window.supabase?.createClient) return null;
    return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

function hasCloudinaryConfig() {
    return Boolean(getConfig().CLOUDINARY_CLOUD_NAME && getConfig().CLOUDINARY_UPLOAD_PRESET);
}

function loadLocalData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { return normalizeData(JSON.parse(saved)); } catch { return deepClone(DEFAULT_DATA); }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
        try { return normalizeData(JSON.parse(legacy)); } catch { return deepClone(DEFAULT_DATA); }
    }
    return deepClone(DEFAULT_DATA);
}

function showToast(message, tone = "success", timeout = 2200) {
    const region = document.getElementById("toast-region");
    if (!region || !message) return;
    const toast = document.createElement("div");
    toast.className = `toast ${tone}`;
    toast.textContent = String(message);
    region.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add("fade-out");
        window.setTimeout(() => toast.remove(), 230);
    }, timeout);
}

function saveData(nextState, toastMessage = "Changes saved") {
    state = normalizeData(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(state));
    hasPendingChanges = false;
    updateMetrics();
    if (supabaseClient) {
        syncCloudData().then((synced) => {
            setStatus(synced ? "Saved + Synced" : "Saved locally (cloud sync failed)", 2200);
            showToast(synced ? toastMessage : "Saved locally (cloud sync failed)", synced ? "success" : "warning");
        });
    } else {
        setStatus("Saved locally");
        showToast(toastMessage, "success");
    }
}

async function loadCloudData() {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .select("data")
        .eq("key", SUPABASE_ROW_KEY)
        .single();
    if (error || !data?.data) return null;
    return normalizeData(data.data);
}

async function syncCloudData() {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .upsert(
            { key: SUPABASE_ROW_KEY, data: state, updated_at: new Date().toISOString() },
            { onConflict: "key" }
        );
    return !error;
}

async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadToCloudinary(file, resourceType = "auto") {
    const config = getConfig();
    if (!hasCloudinaryConfig()) return fileToDataUrl(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) throw new Error("Cloudinary upload failed");
    const payload = await response.json();
    return payload.secure_url || "";
}

async function initializeData() {
    supabaseClient = createSupabaseClient();
    if (!supabaseClient) {
        state = loadLocalData();
        setStatus("Local mode (configure Supabase for cross-browser sync)", 2600);
        return;
    }

    const cloudData = await loadCloudData();
    if (cloudData) {
        state = cloudData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(LEGACY_KEY, JSON.stringify(state));
        setStatus("Cloud data loaded", 1800);
        return;
    }

    state = loadLocalData();
    await syncCloudData();
    setStatus("Local data pushed to cloud", 2000);
}

function setStatus(message, timeout = 1800) {
    const badge = document.getElementById("status-badge");
    if (!badge) return;
    badge.classList.remove("status-success", "status-warning", "status-error");
    const text = String(message || "").toLowerCase();
    if (text.includes("failed") || text.includes("error") || text.includes("invalid")) {
        badge.classList.add("status-error");
    } else if (text.includes("local") || text.includes("processing") || text.includes("uploading") || text.includes("expired")) {
        badge.classList.add("status-warning");
    } else {
        badge.classList.add("status-success");
    }
    badge.textContent = message;
    if (timeout) {
        window.clearTimeout(setStatus.timer);
        setStatus.timer = window.setTimeout(() => {
            badge.textContent = "Ready";
            badge.classList.remove("status-success", "status-warning", "status-error");
        }, timeout);
    }
}

function activateAdminSection(targetId) {
    const sections = Array.from(document.querySelectorAll(".admin-section"));
    sections.forEach((section) => {
        if (!section.id) return;
        const isTarget = section.id === targetId;
        section.classList.toggle("hidden", !isTarget);
        if (!isTarget) return;
        section.classList.remove("section-switch-in");
        void section.offsetWidth;
        section.classList.add("section-switch-in");
    });
}

function lockAdminUI() {
    document.getElementById("dashboard-root").classList.add("dashboard-locked");
    document.getElementById("auth-overlay").classList.remove("hidden");
    sessionStorage.removeItem(SESSION_KEY);
    if (supabaseClient) {
        supabaseClient.auth.signOut().catch(() => null);
    }
}

function unlockAdminUI() {
    document.getElementById("dashboard-root").classList.remove("dashboard-locked");
    document.getElementById("auth-overlay").classList.add("hidden");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ lastActivity: Date.now() }));
}

function sessionStillValid() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try { return Date.now() - Number(JSON.parse(raw).lastActivity || 0) < SESSION_TIMEOUT_MS; } catch { return false; }
}

function touchSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        parsed.lastActivity = Date.now();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    } catch { sessionStorage.removeItem(SESSION_KEY); }
}

function bindAuth() {
    const authForm = document.getElementById("auth-form");
    const error = document.getElementById("auth-error");
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("auth-email").value.trim().toLowerCase();
        const pass = document.getElementById("auth-password").value;

        if (supabaseClient) {
            const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
            if (!signInError) {
                unlockAdminUI();
                error.classList.add("hidden");
                authForm.reset();
                setStatus("Authenticated + cloud sync enabled", 1600);
                return;
            }
            error.classList.remove("hidden");
            setStatus("Supabase auth failed", 1800);
            return;
        }

        if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
            unlockAdminUI();
            error.classList.add("hidden");
            authForm.reset();
            setStatus("Authenticated (local mode)", 1200);
            return;
        }
        error.classList.remove("hidden");
        setStatus("Authentication failed", 1800);
    });
    if (sessionStillValid()) unlockAdminUI(); else lockAdminUI();
}

function bindSessionGuards() {
    ["click", "keydown", "mousemove", "scroll"].forEach((name) => {
        window.addEventListener(name, () => {
            if (document.getElementById("auth-overlay").classList.contains("hidden")) touchSession();
        }, { passive: true });
    });
    window.setInterval(() => {
        if (document.getElementById("auth-overlay").classList.contains("hidden") && !sessionStillValid()) {
            lockAdminUI();
            setStatus("Session expired", 1800);
        }
    }, 30000);
    document.getElementById("lock-admin-btn").addEventListener("click", lockAdminUI);
}

function moveItemInArray(list, from, to) {
    if (to < 0 || to >= list.length || from < 0 || from >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

function queryMatch(text, query) {
    return String(text || "").toLowerCase().includes(query.trim().toLowerCase());
}

function attachSidebarNavigation() {
    const links = document.querySelectorAll(".sidebar-link");
    const shell = document.getElementById("dashboard-root");
    links.forEach((link) => {
        link.addEventListener("click", () => {
            links.forEach((entry) => entry.classList.remove("active"));
            link.classList.add("active");
            const target = link.dataset.section;
            activateAdminSection(target);
            shell?.classList.remove("sidebar-open");
        });
    });
}

function bindSidebarToggle() {
    const shell = document.getElementById("dashboard-root");
    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    const overlay = document.getElementById("sidebar-overlay");
    if (!shell || !toggleBtn || !overlay) return;

    toggleBtn.addEventListener("click", () => {
        shell.classList.toggle("sidebar-open");
    });

    overlay.addEventListener("click", () => {
        shell.classList.remove("sidebar-open");
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 940) shell.classList.remove("sidebar-open");
    });
}

function bindQuickActions() {
    const projectBtn = document.getElementById("quick-add-project");
    const researchBtn = document.getElementById("quick-add-research");
    const exportBtn = document.getElementById("quick-export");
    const navLinks = Array.from(document.querySelectorAll(".sidebar-link"));

    const syncActiveNav = (targetSection) => {
        navLinks.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === targetSection);
        });
    };

    projectBtn?.addEventListener("click", () => {
        activateAdminSection("projects-admin");
        syncActiveNav("projects-admin");
        document.getElementById("proj-title")?.focus();
        showToast("Ready to add project", "success", 1400);
    });

    researchBtn?.addEventListener("click", () => {
        activateAdminSection("research-admin");
        syncActiveNav("research-admin");
        document.getElementById("res-title")?.focus();
        showToast("Ready to add research", "success", 1400);
    });

    exportBtn?.addEventListener("click", () => {
        document.getElementById("export-json-btn")?.click();
        showToast("Backup exported", "success");
    });
}

function bindUnsavedChangesGuard() {
    document.querySelectorAll(".admin-form input, .admin-form textarea, .admin-form select").forEach((element) => {
        element.addEventListener("input", () => {
            hasPendingChanges = true;
        });
        element.addEventListener("change", () => {
            hasPendingChanges = true;
        });
    });

    window.addEventListener("beforeunload", (event) => {
        if (!hasPendingChanges) return;
        event.preventDefault();
        event.returnValue = "You have unsaved changes in admin.";
    });
}

function updateMetrics() {
    document.getElementById("metric-projects").textContent = String(state.projects.length);
    document.getElementById("metric-research").textContent = String(state.research.length);
    document.getElementById("metric-groups").textContent = String(state.experience.groups.length);
    const totalSkills = state.experience.groups.reduce((count, group) => count + group.items.length, 0);
    document.getElementById("metric-skills").textContent = String(totalSkills);
}

function hydrateProfileForm() {
    const profile = state.profile || DEFAULT_DATA.profile;
    const headline = document.getElementById("profile-headline");
    if (!headline) return;
    document.getElementById("profile-headline").value = profile.headline || "";
    document.getElementById("profile-email").value = profile.email || "";
    document.getElementById("profile-phone").value = profile.phone || "";
    document.getElementById("profile-location").value = profile.location || "";
    document.getElementById("profile-resume-url").value = profile.resumeUrl || "";
}

function renderWorkExperience() {
    const list = document.getElementById("work-list");
    if (!list) return;
    list.innerHTML = "";
    (state.professionalExperience || []).forEach((item) => {
        const index = state.professionalExperience.findIndex((entry) => entry.id === item.id);
        const element = document.createElement("article");
        element.className = "item-card";
        element.innerHTML = `
            <div class="item-main">
                <p class="item-title">${escapeHTML(item.position)} @ ${escapeHTML(item.company)}</p>
                <p class="item-sub">${escapeHTML(item.domain)} | ${escapeHTML(item.duration)}</p>
                <p class="item-sub">${escapeHTML(item.about)}</p>
                <p class="item-sub">${item.certificate ? "Certificate linked" : "No certificate link"}</p>
            </div>
            <div class="item-actions">
                <button type="button" data-action="move-work-up" data-id="${item.id}" class="move-btn" ${index === 0 ? "disabled" : ""}>Up</button>
                <button type="button" data-action="move-work-down" data-id="${item.id}" class="move-btn" ${index === state.professionalExperience.length - 1 ? "disabled" : ""}>Down</button>
                <button type="button" data-action="edit-work" data-id="${item.id}" class="ghost-btn">Edit</button>
                <button type="button" data-action="delete-work" data-id="${item.id}" class="danger-btn">Delete</button>
            </div>`;
        list.appendChild(element);
    });
}

function renderProjects() {
    const list = document.getElementById("projects-list");
    list.innerHTML = "";
    state.projects
        .filter((project) => queryMatch(project.title, filterState.projects) || queryMatch(project.description, filterState.projects))
        .forEach((project) => {
            const index = state.projects.findIndex((entry) => entry.id === project.id);
            const element = document.createElement("article");
            element.className = "item-card";
            element.innerHTML = `
                <img class="item-image" src="${escapeHTML(project.image || DEFAULT_PROJECT_IMAGE)}" alt="${escapeHTML(project.title)}">
                <div class="item-main">
                    <p class="item-title">${escapeHTML(project.title)}</p>
                    <p class="item-sub">${escapeHTML(project.description)}</p>
                    <p class="item-sub">${project.github ? "GitHub linked" : "GitHub not set"} | ${project.demo ? "Live demo linked" : "Live demo not set"}</p>
                </div>
                <div class="item-actions">
                    <button type="button" data-action="move-project-up" data-id="${project.id}" class="move-btn" ${index === 0 ? "disabled" : ""}>Up</button>
                    <button type="button" data-action="move-project-down" data-id="${project.id}" class="move-btn" ${index === state.projects.length - 1 ? "disabled" : ""}>Down</button>
                    <button type="button" data-action="edit-project" data-id="${project.id}" class="ghost-btn">Edit</button>
                    <button type="button" data-action="delete-project" data-id="${project.id}" class="danger-btn">Delete</button>
                </div>`;
            list.appendChild(element);
        });
}

function renderResearch() {
    const list = document.getElementById("research-list");
    list.innerHTML = "";
    state.research
        .filter((item) => queryMatch(item.title, filterState.research) || queryMatch(item.description, filterState.research))
        .forEach((item) => {
            const index = state.research.findIndex((entry) => entry.id === item.id);
            const element = document.createElement("article");
            element.className = "item-card";
            element.innerHTML = `
                <div class="item-main">
                    <p class="item-title">${escapeHTML(item.title)}</p>
                    <p class="item-sub">${escapeHTML(item.description)}</p>
                    <p class="item-sub">${item.link ? "Link configured" : "No external link"} | Button: ${escapeHTML(item.ctaLabel || "Read")} | Paper: ${escapeHTML(item.paperType || "none")}</p>
                </div>
                <div class="item-actions">
                    <button type="button" data-action="move-research-up" data-id="${item.id}" class="move-btn" ${index === 0 ? "disabled" : ""}>Up</button>
                    <button type="button" data-action="move-research-down" data-id="${item.id}" class="move-btn" ${index === state.research.length - 1 ? "disabled" : ""}>Down</button>
                    <button type="button" data-action="edit-research" data-id="${item.id}" class="ghost-btn">Edit</button>
                    <button type="button" data-action="delete-research" data-id="${item.id}" class="danger-btn">Delete</button>
                </div>`;
            list.appendChild(element);
        });
}

function renderGroupSelect() {
    const select = document.getElementById("skill-group");
    select.innerHTML = "";
    state.experience.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.title;
        select.appendChild(option);
    });
}

function renderGroups() {
    const list = document.getElementById("groups-list");
    list.innerHTML = "";
    state.experience.groups
        .filter((group) => queryMatch(group.title, filterState.groups))
        .forEach((group) => {
            const index = state.experience.groups.findIndex((entry) => entry.id === group.id);
            const element = document.createElement("article");
            element.className = "item-card";
            element.innerHTML = `
                <div class="item-main">
                    <p class="item-title">${escapeHTML(group.title)}</p>
                    <p class="item-sub">${group.items.length} skill(s)</p>
                </div>
                <div class="item-actions">
                    <button type="button" data-action="move-group-up" data-id="${group.id}" class="move-btn" ${index === 0 ? "disabled" : ""}>Up</button>
                    <button type="button" data-action="move-group-down" data-id="${group.id}" class="move-btn" ${index === state.experience.groups.length - 1 ? "disabled" : ""}>Down</button>
                    <button type="button" data-action="edit-group" data-id="${group.id}" class="ghost-btn">Edit</button>
                    <button type="button" data-action="delete-group" data-id="${group.id}" class="danger-btn">Delete</button>
                </div>`;
            list.appendChild(element);
        });
}

function renderSkills() {
    const list = document.getElementById("skills-list");
    list.innerHTML = "";
    state.experience.groups.forEach((group) => {
        group.items.filter((skill) => !filterState.skills.trim() || queryMatch(skill.name, filterState.skills) || queryMatch(skill.level, filterState.skills) || queryMatch(group.title, filterState.skills))
            .forEach((skill) => {
                const index = group.items.findIndex((entry) => entry.id === skill.id);
                const element = document.createElement("article");
                element.className = "item-card";
                element.innerHTML = `
                    <img class="item-image" src="${escapeHTML(skill.icon || DEFAULT_SKILL_ICON)}" alt="${escapeHTML(skill.name)}">
                    <div class="item-main">
                        <p class="item-title">${escapeHTML(skill.name)}</p>
                        <p class="item-sub">Category: ${escapeHTML(group.title)}</p>
                        <p class="item-sub">${escapeHTML(skill.level || "No level specified")}</p>
                    </div>
                    <div class="item-actions">
                        <button type="button" data-action="move-skill-up" data-group-id="${group.id}" data-id="${skill.id}" class="move-btn" ${index === 0 ? "disabled" : ""}>Up</button>
                        <button type="button" data-action="move-skill-down" data-group-id="${group.id}" data-id="${skill.id}" class="move-btn" ${index === group.items.length - 1 ? "disabled" : ""}>Down</button>
                        <button type="button" data-action="edit-skill" data-group-id="${group.id}" data-id="${skill.id}" class="ghost-btn">Edit</button>
                        <button type="button" data-action="delete-skill" data-group-id="${group.id}" data-id="${skill.id}" class="danger-btn">Delete</button>
                    </div>`;
                list.appendChild(element);
            });
    });
}

function renderAll() {
    hydrateProfileForm();
    renderProjects();
    renderResearch();
    renderGroups();
    renderGroupSelect();
    renderSkills();
    renderWorkExperience();
    updateMetrics();
}

function resetFormState(formId, submitBtnId, submitLabel, cancelBtnId) {
    document.getElementById(formId).reset();
    document.getElementById(submitBtnId).textContent = submitLabel;
    document.getElementById(cancelBtnId).hidden = true;
}

function bindProjectForm() {
    const form = document.getElementById("projects-form");
    const cancelButton = document.getElementById("projects-cancel-btn");
    document.getElementById("proj-img-file").addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setStatus(hasCloudinaryConfig() ? "Uploading image..." : "Processing image...");
            const imageUrl = await uploadToCloudinary(file, "image");
            document.getElementById("proj-img").value = imageUrl;
            setStatus(hasCloudinaryConfig() ? "Image uploaded" : "Image processed", 1200);
        } catch {
            setStatus("Image upload failed", 1800);
        }
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const payload = {
            title: document.getElementById("proj-title").value.trim(),
            image: document.getElementById("proj-img").value.trim(),
            description: document.getElementById("proj-desc").value.trim(),
            github: document.getElementById("proj-github").value.trim(),
            demo: document.getElementById("proj-live").value.trim()
        };
        if (!payload.title || !payload.description) return setStatus("Title and description are required", 1500);
        if (editState.projectId) {
            const index = state.projects.findIndex((item) => item.id === editState.projectId);
            if (index >= 0) state.projects[index] = { ...state.projects[index], ...payload };
        } else state.projects.unshift({ id: generateId("project"), ...payload });
        saveData(state); renderProjects(); editState.projectId = null;
        resetFormState("projects-form", "projects-submit-btn", "Add Project", "projects-cancel-btn");
    });
    cancelButton.addEventListener("click", () => { editState.projectId = null; resetFormState("projects-form", "projects-submit-btn", "Add Project", "projects-cancel-btn"); });
    document.getElementById("projects-list").addEventListener("click", (event) => {
        const target = event.target; if (!(target instanceof HTMLElement)) return;
        const id = target.dataset.id; if (!id) return;
        if (target.dataset.action === "delete-project") { state.projects = state.projects.filter((item) => item.id !== id); saveData(state, "Project deleted"); return renderProjects(); }
        if (target.dataset.action === "move-project-up" || target.dataset.action === "move-project-down") {
            const index = state.projects.findIndex((item) => item.id === id);
            const nextIndex = target.dataset.action === "move-project-up" ? index - 1 : index + 1;
            state.projects = moveItemInArray(state.projects, index, nextIndex); saveData(state); return renderProjects();
        }
        if (target.dataset.action === "edit-project") {
            const project = state.projects.find((item) => item.id === id); if (!project) return;
            editState.projectId = id;
            document.getElementById("proj-title").value = project.title;
            document.getElementById("proj-img").value = project.image || "";
            document.getElementById("proj-desc").value = project.description;
            document.getElementById("proj-github").value = project.github || "";
            document.getElementById("proj-live").value = project.demo || "";
            document.getElementById("projects-submit-btn").textContent = "Update Project";
            cancelButton.hidden = false;
        }
    });
}

function bindResearchForm() {
    const form = document.getElementById("research-form");
    const cancelButton = document.getElementById("research-cancel-btn");
    const fileInput = document.getElementById("res-paper-file");
    const paperTypeInput = document.getElementById("res-paper-type");
    const paperLinkInput = document.getElementById("res-paper-link");
    let uploadedPaperSource = "";
    const togglePaperInputs = () => {
        const type = paperTypeInput.value;
        paperLinkInput.style.display = type === "link" ? "block" : "none";
        fileInput.style.display = (type === "pdf" || type === "image") ? "block" : "none";
    };
    paperTypeInput.addEventListener("change", togglePaperInputs);
    togglePaperInputs();

    fileInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const selectedType = paperTypeInput.value === "pdf" ? "raw" : "image";
            setStatus(hasCloudinaryConfig() ? "Uploading paper..." : "Processing paper...");
            uploadedPaperSource = await uploadToCloudinary(file, selectedType);
            setStatus(hasCloudinaryConfig() ? "Paper uploaded" : "Paper processed", 1200);
        } catch {
            setStatus("Paper upload failed", 1800);
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const paperType = paperTypeInput.value;
        const paperSource = paperType === "link" ? paperLinkInput.value.trim() : (uploadedPaperSource || paperLinkInput.value.trim());
        const payload = {
            title: document.getElementById("res-title").value.trim(),
            description: document.getElementById("res-desc").value.trim(),
            link: document.getElementById("res-link").value.trim(),
            ctaLabel: document.getElementById("res-cta").value.trim() || "Read",
            paperType,
            paperSource: paperType === "none" ? "" : paperSource
        };
        if (!payload.title || !payload.description) return setStatus("Title and summary are required", 1500);
        if (editState.researchId) {
            const index = state.research.findIndex((item) => item.id === editState.researchId);
            if (index >= 0) state.research[index] = { ...state.research[index], ...payload };
        } else state.research.unshift({ id: generateId("research"), ...payload });
        saveData(state); renderResearch(); editState.researchId = null;
        uploadedPaperSource = "";
        resetFormState("research-form", "research-submit-btn", "Add Research", "research-cancel-btn");
        togglePaperInputs();
    });
    cancelButton.addEventListener("click", () => {
        editState.researchId = null;
        uploadedPaperSource = "";
        resetFormState("research-form", "research-submit-btn", "Add Research", "research-cancel-btn");
        togglePaperInputs();
    });
    document.getElementById("research-list").addEventListener("click", (event) => {
        const target = event.target; if (!(target instanceof HTMLElement)) return;
        const id = target.dataset.id; if (!id) return;
        if (target.dataset.action === "delete-research") { state.research = state.research.filter((item) => item.id !== id); saveData(state, "Research deleted"); return renderResearch(); }
        if (target.dataset.action === "move-research-up" || target.dataset.action === "move-research-down") {
            const index = state.research.findIndex((item) => item.id === id);
            const nextIndex = target.dataset.action === "move-research-up" ? index - 1 : index + 1;
            state.research = moveItemInArray(state.research, index, nextIndex); saveData(state); return renderResearch();
        }
        if (target.dataset.action === "edit-research") {
            const item = state.research.find((entry) => entry.id === id); if (!item) return;
            editState.researchId = id;
            document.getElementById("res-title").value = item.title;
            document.getElementById("res-desc").value = item.description;
            document.getElementById("res-link").value = item.link || "";
            document.getElementById("res-cta").value = item.ctaLabel || "Read";
            document.getElementById("res-paper-type").value = item.paperType || "none";
            document.getElementById("res-paper-link").value = item.paperType === "link" ? (item.paperSource || "") : "";
            uploadedPaperSource = item.paperType === "link" ? "" : (item.paperSource || "");
            document.getElementById("research-submit-btn").textContent = "Update Research";
            cancelButton.hidden = false;
            togglePaperInputs();
        }
    });
}

function bindGroupAndSkills() {
    const groupForm = document.getElementById("group-form");
    const groupCancel = document.getElementById("group-cancel-btn");
    groupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = document.getElementById("group-title").value.trim();
        if (!title) return setStatus("Category title is required", 1500);
        if (editState.groupId) {
            const group = state.experience.groups.find((item) => item.id === editState.groupId);
            if (group) group.title = title;
        } else state.experience.groups.push({ id: generateId("group"), title, items: [] });
        saveData(state); renderGroups(); renderGroupSelect(); editState.groupId = null;
        resetFormState("group-form", "group-submit-btn", "Add Category", "group-cancel-btn");
    });
    groupCancel.addEventListener("click", () => { editState.groupId = null; resetFormState("group-form", "group-submit-btn", "Add Category", "group-cancel-btn"); });
    document.getElementById("groups-list").addEventListener("click", (event) => {
        const target = event.target; if (!(target instanceof HTMLElement)) return;
        const id = target.dataset.id; if (!id) return;
        if (target.dataset.action === "delete-group") { state.experience.groups = state.experience.groups.filter((group) => group.id !== id); saveData(state, "Category deleted"); renderGroups(); renderGroupSelect(); return renderSkills(); }
        if (target.dataset.action === "move-group-up" || target.dataset.action === "move-group-down") {
            const index = state.experience.groups.findIndex((group) => group.id === id);
            const nextIndex = target.dataset.action === "move-group-up" ? index - 1 : index + 1;
            state.experience.groups = moveItemInArray(state.experience.groups, index, nextIndex); saveData(state); renderGroups(); return renderGroupSelect();
        }
        if (target.dataset.action === "edit-group") {
            const group = state.experience.groups.find((entry) => entry.id === id); if (!group) return;
            editState.groupId = id;
            document.getElementById("group-title").value = group.title;
            document.getElementById("group-submit-btn").textContent = "Update Category";
            groupCancel.hidden = false;
        }
    });

    const skillForm = document.getElementById("skills-form");
    const skillCancel = document.getElementById("skills-cancel-btn");
    const skillFileInput = document.getElementById("skill-icon-file");
    let uploadedSkillIcon = "";
    skillFileInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setStatus(hasCloudinaryConfig() ? "Uploading icon..." : "Processing icon...");
            uploadedSkillIcon = await uploadToCloudinary(file, "image");
            document.getElementById("skill-icon").value = uploadedSkillIcon;
            setStatus(hasCloudinaryConfig() ? "Skill icon uploaded" : "Skill icon processed", 1200);
        } catch {
            setStatus("Skill icon upload failed", 1800);
        }
    });
    skillForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const groupId = document.getElementById("skill-group").value;
        const iconValue = document.getElementById("skill-icon").value.trim() || uploadedSkillIcon;
        const payload = { name: document.getElementById("skill-name").value.trim(), level: document.getElementById("skill-level").value.trim(), icon: iconValue };
        if (!groupId || !payload.name) return setStatus("Category and skill name are required", 1500);
        const group = state.experience.groups.find((item) => item.id === groupId); if (!group) return;
        if (editState.skillId) {
            state.experience.groups.forEach((entry) => { entry.items = entry.items.filter((item) => item.id !== editState.skillId); });
            group.items.push({ id: editState.skillId, ...payload });
        } else group.items.push({ id: generateId("skill"), ...payload });
        saveData(state); renderGroups(); renderSkills(); editState.skillId = null;
        uploadedSkillIcon = "";
        resetFormState("skills-form", "skills-submit-btn", "Add Skill", "skills-cancel-btn");
    });
    skillCancel.addEventListener("click", () => {
        editState.skillId = null;
        uploadedSkillIcon = "";
        resetFormState("skills-form", "skills-submit-btn", "Add Skill", "skills-cancel-btn");
    });
    document.getElementById("skills-list").addEventListener("click", (event) => {
        const target = event.target; if (!(target instanceof HTMLElement)) return;
        const skillId = target.dataset.id; const groupId = target.dataset.groupId; if (!skillId || !groupId) return;
        const group = state.experience.groups.find((entry) => entry.id === groupId); if (!group) return;
        if (target.dataset.action === "delete-skill") { group.items = group.items.filter((item) => item.id !== skillId); saveData(state, "Skill deleted"); renderGroups(); return renderSkills(); }
        if (target.dataset.action === "move-skill-up" || target.dataset.action === "move-skill-down") {
            const index = group.items.findIndex((item) => item.id === skillId);
            const nextIndex = target.dataset.action === "move-skill-up" ? index - 1 : index + 1;
            group.items = moveItemInArray(group.items, index, nextIndex); saveData(state); return renderSkills();
        }
        if (target.dataset.action === "edit-skill") {
            const skill = group.items.find((item) => item.id === skillId); if (!skill) return;
            editState.skillId = skillId;
            document.getElementById("skill-group").value = group.id;
            document.getElementById("skill-name").value = skill.name;
            document.getElementById("skill-level").value = skill.level || "";
            document.getElementById("skill-icon").value = skill.icon || "";
            uploadedSkillIcon = "";
            document.getElementById("skills-submit-btn").textContent = "Update Skill";
            skillCancel.hidden = false;
        }
    });
}

function bindProfileAndWork() {
    const profileForm = document.getElementById("profile-form");
    const profileResumeFile = document.getElementById("profile-resume-file");
    let uploadedResume = "";
    profileResumeFile.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setStatus(hasCloudinaryConfig() ? "Uploading resume..." : "Processing resume...");
            uploadedResume = await uploadToCloudinary(file, "raw");
            document.getElementById("profile-resume-url").value = uploadedResume;
            setStatus(hasCloudinaryConfig() ? "Resume uploaded" : "Resume processed", 1200);
        } catch {
            setStatus("Resume upload failed", 1800);
        }
    });
    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const resumeValue = document.getElementById("profile-resume-url").value.trim() || uploadedResume || DEFAULT_DATA.profile.resumeUrl;
        state.profile = {
            headline: document.getElementById("profile-headline").value.trim(),
            email: document.getElementById("profile-email").value.trim(),
            phone: document.getElementById("profile-phone").value.trim(),
            location: document.getElementById("profile-location").value.trim(),
            resumeUrl: resumeValue
        };
        saveData(state);
        setStatus("Profile updated", 1300);
    });

    const workForm = document.getElementById("work-form");
    const cancelButton = document.getElementById("work-cancel-btn");
    const certificateFileInput = document.getElementById("work-certificate-file");
    let uploadedCertificate = "";
    certificateFileInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const resourceType = file.type.includes("pdf") ? "raw" : "image";
            setStatus(hasCloudinaryConfig() ? "Uploading certificate..." : "Processing certificate...");
            uploadedCertificate = await uploadToCloudinary(file, resourceType);
            document.getElementById("work-certificate").value = uploadedCertificate;
            setStatus(hasCloudinaryConfig() ? "Certificate uploaded" : "Certificate processed", 1200);
        } catch {
            setStatus("Certificate upload failed", 1800);
        }
    });
    workForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const certificateValue = document.getElementById("work-certificate").value.trim() || uploadedCertificate;
        const payload = {
            company: document.getElementById("work-company").value.trim(),
            position: document.getElementById("work-position").value.trim(),
            domain: document.getElementById("work-domain").value.trim(),
            duration: document.getElementById("work-duration").value.trim(),
            about: document.getElementById("work-about").value.trim(),
            certificate: certificateValue
        };
        if (!payload.company || !payload.position || !payload.domain || !payload.duration || !payload.about) {
            return setStatus("Fill all required experience fields", 1500);
        }
        if (editState.workId) {
            const index = state.professionalExperience.findIndex((item) => item.id === editState.workId);
            if (index >= 0) state.professionalExperience[index] = { ...state.professionalExperience[index], ...payload };
        } else {
            state.professionalExperience.unshift({ id: generateId("work"), ...payload });
        }
        saveData(state);
        renderWorkExperience();
        editState.workId = null;
        uploadedCertificate = "";
        resetFormState("work-form", "work-submit-btn", "Add Experience", "work-cancel-btn");
    });
    cancelButton.addEventListener("click", () => {
        editState.workId = null;
        uploadedCertificate = "";
        resetFormState("work-form", "work-submit-btn", "Add Experience", "work-cancel-btn");
    });
    document.getElementById("work-list").addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const id = target.dataset.id;
        if (!id) return;
        if (target.dataset.action === "delete-work") {
            state.professionalExperience = state.professionalExperience.filter((item) => item.id !== id);
            saveData(state, "Experience deleted");
            return renderWorkExperience();
        }
        if (target.dataset.action === "move-work-up" || target.dataset.action === "move-work-down") {
            const index = state.professionalExperience.findIndex((item) => item.id === id);
            const nextIndex = target.dataset.action === "move-work-up" ? index - 1 : index + 1;
            state.professionalExperience = moveItemInArray(state.professionalExperience, index, nextIndex);
            saveData(state);
            return renderWorkExperience();
        }
        if (target.dataset.action === "edit-work") {
            const item = state.professionalExperience.find((entry) => entry.id === id);
            if (!item) return;
            editState.workId = id;
            document.getElementById("work-company").value = item.company;
            document.getElementById("work-position").value = item.position;
            document.getElementById("work-domain").value = item.domain;
            document.getElementById("work-duration").value = item.duration;
            document.getElementById("work-about").value = item.about;
            document.getElementById("work-certificate").value = item.certificate || "";
            uploadedCertificate = "";
            document.getElementById("work-submit-btn").textContent = "Update Experience";
            cancelButton.hidden = false;
        }
    });
}

function bindToolsAndSearch() {
    document.getElementById("export-json-btn").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "portfolio-backup.json";
        anchor.click();
        URL.revokeObjectURL(url);
    });
    document.getElementById("import-json-input").addEventListener("change", (event) => {
        const file = event.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { try { saveData(JSON.parse(String(reader.result || "{}"))); renderAll(); } catch { setStatus("Invalid backup file", 1800); } };
        reader.readAsText(file);
    });
    document.getElementById("reset-data-btn").addEventListener("click", () => { saveData(deepClone(DEFAULT_DATA)); renderAll(); });
    document.getElementById("projects-search").addEventListener("input", (e) => { filterState.projects = e.target.value; renderProjects(); });
    document.getElementById("research-search").addEventListener("input", (e) => { filterState.research = e.target.value; renderResearch(); });
    document.getElementById("groups-search").addEventListener("input", (e) => { filterState.groups = e.target.value; renderGroups(); });
    document.getElementById("skills-search").addEventListener("input", (e) => { filterState.skills = e.target.value; renderSkills(); });
}

document.addEventListener("DOMContentLoaded", async () => {
    await initializeData();
    bindAuth();
    bindSessionGuards();
    bindSidebarToggle();
    attachSidebarNavigation();
    bindQuickActions();
    bindUnsavedChangesGuard();
    bindProjectForm();
    bindResearchForm();
    bindGroupAndSkills();
    bindProfileAndWork();
    bindToolsAndSearch();
    renderAll();
});
