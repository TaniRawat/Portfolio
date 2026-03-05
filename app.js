function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  if (!menu || !icon) return;
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

const STORAGE_KEY = "portfolioDataV2";
const LEGACY_KEY = "portfolioData";
const DEFAULT_PROJECT_IMAGE = "assets/projects/default.png";
const DEFAULT_SKILL_ICON = "assets/checkmark.png";
const SUPABASE_TABLE = "portfolio_content";
const SUPABASE_ROW_KEY = "primary";
const CLOUD_POLL_INTERVAL_MS = 15000;

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
  projects: [
    {
      id: "hand-gesture-recognition",
      title: "Hand-Gesture Recognition System",
      image: "assets/projects/project-1.png",
      description: "Integrating hand gesture recognition into whiteboard applications facilitates natural, intuitive interactions, enhancing online education and collaboration through advanced deep learning algorithms for precise gesture detection.",
      github: "",
      demo: ""
    },
    {
      id: "portfolio",
      title: "Portfolio",
      image: "assets/projects/project-2.png",
      description: "Designed and developed a portfolio website using HTML, CSS, and JavaScript to showcase my skills and projects with smooth interactions and user-centric experience.",
      github: "",
      demo: ""
    },
    {
      id: "rock-paper-scissors",
      title: "Rock Paper Scissors",
      image: "assets/projects/project-3.png",
      description: "Developed a dynamic 2D Rock Paper Scissors game featuring an intuitive interface for competing against a CPU with real-time score tracking.",
      github: "",
      demo: ""
    }
  ],
  research: [
    {
      id: "edge-computing",
      title: "Edge Computing",
      description: "This study explores the origins, necessity, current applications, and future advancements of edge computing. It highlights edge computing's role in providing robust communication, networking, storage, and processing capabilities in a connected world.",
      link: "",
      ctaLabel: "Read"
    }
  ],
  professionalExperience: []
};

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
      items: Array.isArray(group.items)
        ? group.items.map((skill) => ({
          id: skill.id || generateId("skill"),
          name: skill.name || "",
          level: skill.level || "",
          icon: skill.icon || ""
        }))
        : []
    }));
  } else if (Array.isArray(data.skills)) {
    const programming = [];
    const tools = [];
    const toolNames = new Set(["Git/GitHub", "MySQL", "PostgreSQL", "MongoDB", "Netlify", "VS Code"]);
    data.skills.forEach((skill) => {
      const item = {
        id: skill.id || generateId("skill"),
        name: skill.name || "",
        level: skill.level || "",
        icon: skill.icon || ""
      };
      if (toolNames.has(item.name)) {
        tools.push(item);
      } else {
        programming.push(item);
      }
    });
    normalized.experience.groups = [
      { id: "programming-languages", title: "Programming Languages", items: programming },
      { id: "development-tools-platforms", title: "Development Tools & Platforms", items: tools }
    ];
  }

  return normalized;
}

function getSupabaseClient() {
  const config = window.APP_CONFIG || {};
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return null;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

function loadPortfolioDataLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeData(JSON.parse(saved));
    } catch {
      return deepClone(DEFAULT_DATA);
    }
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      return normalizeData(JSON.parse(legacy));
    } catch {
      return deepClone(DEFAULT_DATA);
    }
  }

  return deepClone(DEFAULT_DATA);
}

async function loadPortfolioData() {
  const client = getSupabaseClient();
  if (!client) return loadPortfolioDataLocal();

  try {
    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select("data")
      .eq("key", SUPABASE_ROW_KEY)
      .single();

    if (error || !data?.data) throw error || new Error("Missing cloud data");
    const normalized = normalizeData(data.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return loadPortfolioDataLocal();
  }
}

function renderSkills(data) {
  const container = document.querySelector("#skills .experience-details-container .about-containers");
  if (!container) return;
  container.innerHTML = "";

  data.experience.groups.forEach((group) => {
    const groupNode = document.createElement("div");
    groupNode.className = "details-container";
    groupNode.innerHTML = `
      <h2 class="experience-sub-title">${group.title}</h2>
      <div class="article-container"></div>
    `;
    const listNode = groupNode.querySelector(".article-container");

    group.items.forEach((skill) => {
      const item = document.createElement("article");
      item.innerHTML = `
        <div style="text-align:center;">
          <h3>${escapeHTML(skill.name)}</h3>
          <img src="${escapeHTML(skill.icon || DEFAULT_SKILL_ICON)}" alt="${escapeHTML(skill.name)}" width="58" height="58" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_SKILL_ICON}'">
          <p>${skill.level ? `(${escapeHTML(skill.level)})` : ""}</p>
        </div>
      `;
      listNode.appendChild(item);
    });

    container.appendChild(groupNode);
  });
}

function renderResume(data) {
  const container = document.getElementById("resume-details");
  if (!container) return;
  const profile = data.profile || DEFAULT_DATA.profile;
  container.innerHTML = `
    <h2 class="experience-sub-title" style="margin-bottom:.5rem;">${escapeHTML(profile.headline || "Professional Resume")}</h2>
    <p class="resume-meta">${escapeHTML(profile.email)} | ${escapeHTML(profile.phone)} | ${escapeHTML(profile.location)}</p>
    <div class="btn-container" style="margin-top:1rem;">
      <a class="btn btn-color-2" href="${escapeHTML(profile.resumeUrl || DEFAULT_DATA.profile.resumeUrl)}" target="_blank" rel="noopener">Open Resume</a>
    </div>
  `;
}

function renderWorkExperience(data) {
  const container = document.querySelector("#experience .work-details-container");
  if (!container) return;
  container.innerHTML = "";
  (data.professionalExperience || []).forEach((item, index) => {
    const node = document.createElement("article");
    node.className = "work-card";
    node.classList.add(index % 2 === 0 ? "left" : "right");
    node.innerHTML = `
      <span class="work-index">0${index + 1}</span>
      <div class="work-top">
        <div>
          <h3 class="work-company">${escapeHTML(item.company)}</h3>
          <p class="work-position">${escapeHTML(item.position)}</p>
          <p class="work-domain">${escapeHTML(item.domain)}</p>
        </div>
        <div class="work-side">
          <p class="work-duration">${escapeHTML(item.duration)}</p>
          ${item.certificate ? `<a class="btn btn-color-2 project-btn work-cert-btn" target="_blank" rel="noopener" href="${escapeHTML(item.certificate)}">Certificate</a>` : ""}
        </div>
      </div>
      <p class="work-about">${escapeHTML(item.about)}</p>
    `;
    container.appendChild(node);
  });
}

function renderProjects(data) {
  const container = document.querySelector("#projects .projects-details-container");
  if (!container) return;
  container.innerHTML = "";

  data.projects.forEach((project) => {
    const projectNode = document.createElement("div");
    projectNode.className = "details-container color-container";
    projectNode.innerHTML = `
      <div class="article-container" style="display:flex;justify-content:center;align-items:center;">
        <img src="${escapeHTML(project.image || DEFAULT_PROJECT_IMAGE)}" alt="${escapeHTML(project.title)}" class="project-img" onerror="this.onerror=null;this.src='${DEFAULT_PROJECT_IMAGE}'">
      </div>
      <h2 class="experience-sub-title project-title">${escapeHTML(project.title)}</h2>
      <p class="project-description">${escapeHTML(project.description || "")}</p>
      <div class="btn-container">
        ${project.github ? `<a target="_blank" href="${escapeHTML(project.github)}" rel="noopener" class="btn btn-color-2 project-btn">Github</a>` : ""}
        ${project.demo ? `<a target="_blank" href="${escapeHTML(project.demo)}" rel="noopener" class="btn btn-color-2 project-btn">Live Demo</a>` : ""}
      </div>
    `;
    container.appendChild(projectNode);
  });
}

function renderResearch(data) {
  const container = document.querySelector("#research .research-details-container");
  if (!container) return;
  container.innerHTML = "";

  data.research.forEach((item) => {
    let paperPreview = "";
    if (item.paperType === "image" && item.paperSource) {
      paperPreview = `<a href="${escapeHTML(item.paperSource)}" target="_blank" rel="noopener"><img class="research-preview" src="${escapeHTML(item.paperSource)}" alt="${escapeHTML(item.title)} paper preview"></a>`;
    } else if (item.paperType === "pdf" && item.paperSource) {
      paperPreview = `<a target="_blank" href="${escapeHTML(item.paperSource)}" rel="noopener" class="btn btn-color-2 project-btn">Open PDF</a>`;
    } else if (item.paperType === "link" && item.paperSource) {
      paperPreview = `<a target="_blank" href="${escapeHTML(item.paperSource)}" rel="noopener" class="btn btn-color-2 project-btn">Open Paper Link</a>`;
    }

    const researchNode = document.createElement("div");
    researchNode.className = "details-container color-container";
    researchNode.innerHTML = `
      <h2 class="experience-sub-title project-title">${escapeHTML(item.title)}</h2>
      <p class="research-description">${escapeHTML(item.description || "")}</p>
      <div class="btn-container">
        ${paperPreview}
        ${item.link ? `<a target="_blank" href="${escapeHTML(item.link)}" rel="noopener" class="btn btn-color-2 project-btn">${escapeHTML(item.ctaLabel || "Read")}</a>` : ""}
      </div>
    `;
    container.appendChild(researchNode);
  });
}

function renderHighlights(data) {
  const projectsNode = document.getElementById("count-projects");
  const skillsNode = document.getElementById("count-skills");
  const researchNode = document.getElementById("count-research");
  if (!projectsNode || !skillsNode || !researchNode) return;
  const skillCount = data.experience.groups.reduce((sum, group) => sum + group.items.length, 0);
  projectsNode.textContent = `${data.projects.length}+`;
  skillsNode.textContent = `${skillCount}+`;
  researchNode.textContent = `${data.research.length}+`;
}

function renderPortfolio(data) {
  renderHighlights(data);
  renderResume(data);
  renderSkills(data);
  renderWorkExperience(data);
  renderProjects(data);
  renderResearch(data);
}

function bindNavigation() {
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const header = document.querySelector("header");
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      const offset = (header?.offsetHeight || 0) + 14;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

function bindScrollProgress() {
  const progress = document.getElementById("scroll-progress");
  if (!progress) return;
  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (scrollTop / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function bindFloatingNavbar() {
  const header = document.querySelector("header");
  if (!header) return;
  const update = () => {
    header.classList.toggle("floating-active", window.scrollY > 12);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function bindSecretAdminAccess() {
  const hiddenLink = document.getElementById("secret-admin-link");
  const logo = document.querySelector(".logo");
  if (!hiddenLink || !logo) return;
  let timer = null;
  logo.addEventListener("mousedown", () => {
    timer = window.setTimeout(() => hiddenLink.click(), 850);
  });
  ["mouseup", "mouseleave"].forEach((eventName) => {
    logo.addEventListener(eventName, () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    });
  });
}

function bindActiveNav() {
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!sections.length || !links.length) return;

  const map = new Map(links.map((link) => [link.getAttribute("href"), link]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.remove("active-nav"));
      const targetLink = map.get(`#${entry.target.id}`);
      if (targetLink) targetLink.classList.add("active-nav");
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 });

  sections.forEach((section) => observer.observe(section));
}

function setupRevealAnimations() {
  const targets = Array.from(document.querySelectorAll("section, .details-container, .work-card, .item-card"));
  targets.forEach((node) => node.classList.add("reveal"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.12 });
  targets.forEach((node) => observer.observe(node));
}

function animateHighlights() {
  const nodes = ["count-projects", "count-skills", "count-research"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!nodes.length) return;

  const run = () => {
    nodes.forEach((node) => {
      const target = parseInt((node.textContent || "0").replace(/\D/g, ""), 10) || 0;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 28));
      const timer = window.setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          window.clearInterval(timer);
        }
        node.textContent = `${current}+`;
      }, 28);
    });
  };

  const section = document.getElementById("highlights");
  if (!section) return run();
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      run();
      observer.disconnect();
    }
  }, { threshold: 0.3 });
  observer.observe(section);
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadPortfolioData();
  renderPortfolio(data);
  bindNavigation();
  bindFloatingNavbar();
  bindSecretAdminAccess();
  bindScrollProgress();
  bindActiveNav();
  setupRevealAnimations();
  animateHighlights();

  if (getSupabaseClient()) {
    let lastSnapshot = JSON.stringify(data);
    window.setInterval(async () => {
      const latest = await loadPortfolioData();
      const nextSnapshot = JSON.stringify(latest);
      if (nextSnapshot !== lastSnapshot) {
        renderPortfolio(latest);
        lastSnapshot = nextSnapshot;
      }
    }, CLOUD_POLL_INTERVAL_MS);
  }
});
