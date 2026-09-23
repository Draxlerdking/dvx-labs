import { readFileSync, writeFileSync } from "node:fs";

/* ============================================================
   DVX LABS — MULTI-PAGE BUILD
   assembles partials + page bodies into self-contained pages
   ============================================================ */

const read = (p) => readFileSync(p, "utf8");

const head = read("src/partials/head.part.html");
const nav = read("src/partials/nav.part.html");
const footer = read("src/partials/footer.part.html");
const overlaysHome = read("src/partials/overlays.home.part.html");
const overlaysPage = read("src/partials/overlays.part.html");

const pages = [
  {
    body: "src/pages/home.body.html",
    out: "index.html",
    key: "home",
    path: "",
    title: "DVX Labs — Independent Full-Stack Studio | Digital ideas, built real.",
    desc: "DVX Labs designs and develops complete digital experiences for businesses ready to move beyond a basic online presence — strategy, interface, full-stack engineering, deployment and launch support.",
  },
  {
    body: "src/pages/expertise.body.html",
    out: "expertise.html",
    key: "expertise",
    path: "expertise.html",
    title: "Expertise — One Studio, Full Digital Stack | DVX Labs",
    desc: "Frontend, backend and delivery capabilities considered together: React, Next.js, TypeScript, Node.js, PostgreSQL, APIs, payments, deployment and launch support from one studio.",
  },
  {
    body: "src/pages/work.body.html",
    out: "work.html",
    key: "work",
    path: "work.html",
    title: "Selected Work — Problems Solved, Not Just Pages Built | DVX Labs",
    desc: "Case studies from the DVX Labs studio: the challenge, the thinking behind each build, and the outcome. Honest status labels until real project details are published.",
  },
  {
    body: "src/pages/process.body.html",
    out: "process.html",
    key: "process",
    path: "process.html",
    title: "Process — A Clear Path from Idea to Live | DVX Labs",
    desc: "Four stages from first call to post-launch support: Discover, Define, Develop, Deliver. Weekly previews, one point of contact, no silent scope creep.",
  },
  {
    body: "src/pages/about.body.html",
    out: "about.html",
    key: "about",
    path: "about.html",
    title: "About — A Digital Engineering Lab, Run Like a Studio | DVX Labs",
    desc: "DVX Labs is an independent full-stack studio: senior, end-to-end product engineering for companies that need a real platform, not just a nicer homepage.",
  },
  {
    body: "src/pages/contact.body.html",
    out: "contact.html",
    key: "contact",
    path: "contact.html",
    title: "Contact — Start a Project | DVX Labs",
    desc: "Tell DVX Labs what you're building. A short brief gets an honest reply on scope, timing and fit within 1–2 business days.",
  },
];

function resolveIncludes(html, depth = 0) {
  if (depth > 5) throw new Error("Include depth exceeded (cycle?)");
  return html.replace(/\{\{INCLUDE:([\w.-]+)\}\}/g, (_, name) => {
    const frag = read(`src/fragments/${name}`);
    return resolveIncludes(frag, depth + 1);
  });
}

/* inline the stylesheet and script so every page is fully self-contained */
const css = read("src/styles.css");
const js = read("src/app.js");
function inlineAssets(html) {
  return html
    .replace('<link rel="stylesheet" href="styles.css" />', () => "<style>\n" + css + "\n  </style>")
    .replace('<script src="app.js" defer></script>', () => "<script>\n" + js + "\n</script>");
}
if (!css || !js) throw new Error("styles.css / app.js missing");

let built = 0;
for (const p of pages) {
  let html = head + "\n" + nav + "\n" + resolveIncludes(read(p.body)) + "\n" + footer + "\n" + (p.key === "home" ? overlaysHome : overlaysPage);
  html = inlineAssets(html);
  html = html
    .replaceAll("{{TITLE}}", p.title)
    .replaceAll("{{DESC}}", p.desc)
    .replaceAll("{{PATH}}", p.path)
    .replaceAll("{{PAGEKEY}}", p.key);
  if (/\{\{[A-Z]+\}\}/.test(html)) {
    throw new Error(`Unresolved token in ${p.out}: ${html.match(/\{\{[A-Z]+\}\}/g).join(", ")}`);
  }
  writeFileSync(p.out, html);
  built++;
  console.log(`${p.out}: ${(html.length / 1024).toFixed(1)} KB`);
}
console.log(`built ${built} pages`);
