// Shared by every family member's app. Each member has their own folder (e.g. nanna/) with:
//   index.html             the app: one page with an Exercises tab and a Meals tab
//   manifest.webmanifest   the member's name ("short_name", and "name_te" for Telugu)
//   sw.js                  offline support
//   plans/exercises.json, plans/meals.json
// index.html is the same for everyone. Sections register themselves (shared/exercises.js, shared/meals.js),
// then FamilyApp.start() builds the page.
//
// Language: the page can switch between English and Telugu. Any text in a plan can be a plain
// string or {"en": "...", "te": "..."}; t() picks the current language and falls back to English.
(function(){
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_NAMES = {
  en: { Mon:["Mon","Monday"], Tue:["Tue","Tuesday"], Wed:["Wed","Wednesday"], Thu:["Thu","Thursday"], Fri:["Fri","Friday"], Sat:["Sat","Saturday"], Sun:["Sun","Sunday"] },
  te: { Mon:["సోమ","సోమవారం"], Tue:["మంగళ","మంగళవారం"], Wed:["బుధ","బుధవారం"], Thu:["గురు","గురువారం"], Fri:["శుక్ర","శుక్రవారం"], Sat:["శని","శనివారం"], Sun:["ఆది","ఆదివారం"] }
};
const UI = {
  en: {
    switchTo: "తెలుగు", plan: n => n+"'s Daily Plan", noName: "Daily Plan", today: "Today",
    safety: "Before you start: safety first",
    error: "<strong>Could not load the plan.</strong> Check the internet connection, then close and reopen the app.",
    install: "<strong>Install this app</strong><br>Open it from your home screen like any other app.",
    installIOS: "<strong>Install this app</strong><br>Tap the Share button <span aria-hidden='true'>⬆︎</span>, then <strong>Add to Home Screen</strong>.",
    installBtn: "Install", notNow: "Not now", ok: "OK"
  },
  te: {
    switchTo: "English", plan: n => n+" రోజువారీ ప్రణాళిక", noName: "రోజువారీ ప్రణాళిక", today: "ఈరోజు",
    safety: "మొదలుపెట్టే ముందు: జాగ్రత్తలు",
    error: "<strong>ప్రణాళిక లోడ్ కాలేదు.</strong> ఇంటర్నెట్ కనెక్షన్ చూసి, యాప్ మూసి మళ్లీ తెరవండి.",
    install: "<strong>ఈ యాప్‌ను ఇన్‌స్టాల్ చేయండి</strong><br>ఇతర యాప్‌ల లాగే హోమ్ స్క్రీన్ నుండి తెరవవచ్చు.",
    installIOS: "<strong>ఈ యాప్‌ను ఇన్‌స్టాల్ చేయండి</strong><br>Share బటన్ <span aria-hidden='true'>⬆︎</span> నొక్కి, <strong>Add to Home Screen</strong> ఎంచుకోండి.",
    installBtn: "ఇన్‌స్టాల్", notNow: "ఇప్పుడు కాదు", ok: "సరే"
  }
};

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const isAndroid = /Android/i.test(navigator.userAgent);
const $ = id => document.getElementById(id);
const now = new Date();
const member = location.pathname.split("/").slice(-2, -1)[0];  // folder name, e.g. "nanna"
const sections = [];

// Storage can be unavailable (private mode, blocked site data), so every access is guarded
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

// Language: ?lang=te or ?lang=en in the link wins (and is remembered), else the last choice, else English
const askedLang = new URLSearchParams(location.search).get("lang");
if(askedLang==="te" || askedLang==="en") store.set("lang", askedLang);
let lang = (askedLang || store.get("lang"))==="te" ? "te" : "en";
const t = v => (v && typeof v==="object") ? (v[lang] || v.en || "") : (v || "");
const ui = key => UI[lang][key];
const dayName = (key, long) => DAY_NAMES[lang][key][long ? 1 : 0];

async function getJSON(url){
  const res = await fetch(url, { cache:"no-cache" });
  if(!res.ok) throw new Error(url+" "+res.status);
  return res.json();
}

// section: { id, label, icon, plan, themeColor, foot, renderDay(day), onPlan(plan), afterRender() }
// label and foot can be {en, te}.
function addSection(s){ sections.push(s); }

let manifest = {}, section, current, todayIdx;

async function start(){
  document.body.insertAdjacentHTML("afterbegin", '<div class="wrap">'+
    '<div class="top"><h1 id="title"></h1><button class="lang" id="lang"></button></div>'+
    '<p class="date" id="date"></p>'+
    '<nav class="sections" id="sections" role="tablist"></nav>'+
    '<p class="sub" id="sub"></p>'+
    '<details class="safety" id="safety" open hidden><summary id="safety-title"></summary><ul id="safety-list"></ul></details>'+
    '<div class="tabs" id="tabs" role="tablist"></div><div id="content"></div>'+
    '<p class="foot" id="foot"></p></div>');

  // If the app is left open past midnight, refresh when it is shown again
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState==="visible" && new Date().toDateString()!==now.toDateString()) location.reload();
  });
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
  setupInstall();

  $("lang").onclick = ()=>{
    lang = lang==="en" ? "te" : "en";
    store.set("lang", lang);
    renderAll();
  };

  [manifest] = await Promise.all([
    getJSON("manifest.webmanifest").catch(()=>({})),
    ...sections.map(s => getJSON(s.plan).then(p => { s.data = p; if(s.onPlan) s.onPlan(p); }).catch(()=>{}))
  ]);

  // A member whose plans are only in English sets "languages": ["en"] in the manifest to hide the switch
  if(manifest.languages && !manifest.languages.includes("te")){ lang = "en"; $("lang").hidden = true; }

  window.addEventListener("hashchange", ()=>{ pick(location.hash.slice(1)); renderAll(); });
  window.addEventListener("resize", labelTabs);
  pick(location.hash.slice(1));
  renderAll();
}

// Choose a section and jump to today's day in it
function pick(id){
  section = sections.find(s => s.id===id) || sections[0];
  const days = section.data ? section.data.days : [];
  todayIdx = days.findIndex(d => d.key===DAY_KEYS[now.getDay()]);
  current = todayIdx>=0 ? todayIdx : 0;
}

// Draw the whole page in the current language, keeping the chosen section and day
function renderAll(){
  document.documentElement.lang = lang;
  $("lang").textContent = ui("switchTo");
  const name = lang==="te" ? (manifest.name_te || manifest.short_name) : manifest.short_name;
  document.title = $("title").textContent = name ? ui("plan")(name) : ui("noName");
  $("date").textContent = now.toLocaleDateString(lang==="te" ? "te-IN" : "en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  $("sections").innerHTML = sections.map(s =>
    '<button class="section" role="tab" data-s="'+s.id+'" aria-selected="'+(s===section)+'">'+
    '<img src="../shared/icons/'+s.icon+'-192.png" alt="">'+t(s.label)+'</button>').join("");
  $("sections").querySelectorAll("button").forEach(b => b.onclick = ()=>{
    history.replaceState(null, "", "#"+b.dataset.s);
    pick(b.dataset.s);
    renderAll();
  });

  document.body.dataset.section = section.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", section.themeColor);
  $("foot").textContent = t(section.foot);
  updateInstallText();

  const plan = section.data;
  if(!plan){
    $("sub").textContent = ""; $("safety").hidden = true; $("tabs").innerHTML = "";
    $("content").innerHTML = '<div class="rest">'+ui("error")+'</div>';
    return;
  }
  $("sub").textContent = t(plan.subtitle);
  const safe = plan.safety || [];
  $("safety").hidden = !safe.length;
  $("safety-title").textContent = t(plan.safetyTitle) || ui("safety");
  $("safety-list").innerHTML = safe.map(s => "<li>"+t(s)+"</li>").join("");
  renderTabs(); renderDay();
}

function renderTabs(){
  const days = section.data.days, el = $("tabs");
  el.style.setProperty("--n", days.length);
  el.classList.toggle("many", days.length > 5);
  el.innerHTML = "";
  days.forEach((d,i)=>{
    const b = document.createElement("button");
    b.className = "tab";
    if(i===todayIdx){ b.classList.add("today"); b.dataset.today = ui("today"); }
    b.setAttribute("role","tab");
    b.setAttribute("aria-selected", i===current);
    b.onclick = ()=>{ current=i; renderTabs(); renderDay(); };
    el.appendChild(b);
  });
  labelTabs();
}

// Full weekday names when there is room, short ones on phones
function labelTabs(){
  if(!section || !section.data) return;
  const days = section.data.days, wide = window.innerWidth >= days.length*(lang==="te" ? 132 : 112);
  [...$("tabs").children].forEach((b,i)=>{ b.textContent = dayName(days[i].key, wide); });
}

function renderDay(){
  const plan = section.data;
  let html = "";
  if(todayIdx===-1 && plan.restMessage) html += '<div class="rest">'+t(plan.restMessage)+'</div>';
  $("content").innerHTML = html + section.renderDay(plan.days[current]);
  if(section.afterRender) section.afterRender();
}

// ---- Install as an app ----
let installBox;
function setupInstall(){
  const box = installBox = document.createElement("div");
  box.className = "install"; box.hidden = true;
  box.setAttribute("role","dialog"); box.setAttribute("aria-label","Install app");
  box.innerHTML = '<img src="../shared/icons/heart-192.png" alt=""><div class="msg"></div>'+
    '<div class="row"><button class="btn primary"></button><button class="btn ghost"></button></div>';
  document.body.appendChild(box);
  const [yes, no] = box.querySelectorAll("button");
  updateInstallText();

  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const snoozeKey = "install-snooze-"+member;
  let deferredPrompt = null;
  const showBox = ()=>{ if(installed || Date.now() < +(store.get(snoozeKey)||0)) return; box.hidden = false; document.body.classList.add("has-install"); };
  const hideBox = ()=>{ box.hidden = true; document.body.classList.remove("has-install"); };

  // Chrome, Edge and Android: the browser says the app can be installed
  window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt = e; showBox(); });
  window.addEventListener("appinstalled", hideBox);

  // iPhone/iPad Safari has no install button, so it shows the steps instead (see updateInstallText)
  if(isIOS && !installed){ yes.style.display = "none"; showBox(); }

  yes.onclick = async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideBox();
  };
  // "Not now" hides the popup for 3 days
  no.onclick = ()=>{ store.set(snoozeKey, Date.now() + 3*24*60*60*1000); hideBox(); };
}

function updateInstallText(){
  if(!installBox) return;
  const [yes, no] = installBox.querySelectorAll("button");
  installBox.querySelector(".msg").innerHTML = ui(isIOS ? "installIOS" : "install");
  yes.textContent = ui("installBtn");
  no.textContent = ui(isIOS ? "ok" : "notNow");
}

window.FamilyApp = { addSection, start, t, dayName, lang: () => lang, isIOS, isAndroid };
})();
