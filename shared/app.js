// Shared by every family member's app. Each member has their own folder (e.g. nanna/) with:
//   index.html             the app: one page with an Exercises tab and a Meals tab
//   manifest.webmanifest   the member's name ("short_name" is shown on the page)
//   sw.js                  offline support
//   plans/exercises.json, plans/meals.json
// index.html is the same for everyone. Sections register themselves (shared/exercises.js, shared/meals.js),
// then FamilyApp.start() builds the page.
(function(){
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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

async function getJSON(url){
  const res = await fetch(url, { cache:"no-cache" });
  if(!res.ok) throw new Error(url+" "+res.status);
  return res.json();
}

// section: { id, label, icon, plan, title, themeColor, foot, renderDay(day), onPlan(plan), afterRender() }
function addSection(s){ sections.push(s); }

async function start(){
  document.body.insertAdjacentHTML("afterbegin", '<div class="wrap">'+
    '<h1 id="title">Daily Plan</h1>'+
    '<p class="date">'+now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })+'</p>'+
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

  const [manifest] = await Promise.all([
    getJSON("manifest.webmanifest").catch(()=>({})),
    ...sections.map(s => getJSON(s.plan).then(p => { s.data = p; if(s.onPlan) s.onPlan(p); }).catch(()=>{}))
  ]);
  const name = manifest.short_name || manifest.name;
  if(name) document.title = $("title").textContent = name+"'s Daily Plan";

  $("sections").innerHTML = sections.map(s =>
    '<button class="section" role="tab" data-s="'+s.id+'"><img src="../shared/icons/'+s.icon+'-192.png" alt="">'+s.label+'</button>').join("");
  $("sections").querySelectorAll("button").forEach(b => b.onclick = ()=>{
    history.replaceState(null, "", "#"+b.dataset.s);
    show(b.dataset.s);
  });
  window.addEventListener("hashchange", ()=>show(location.hash.slice(1)));
  window.addEventListener("resize", labelTabs);
  show(location.hash.slice(1));
}

// ---- Show one section: its notes, day tabs and the selected day ----
let section, current, todayIdx;

function show(id){
  section = sections.find(s => s.id===id) || sections[0];
  document.body.dataset.section = section.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", section.themeColor);
  $("sections").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.s===section.id));
  $("foot").textContent = section.foot || "";

  const plan = section.data;
  if(!plan){
    $("sub").textContent = ""; $("safety").hidden = true; $("tabs").innerHTML = "";
    $("content").innerHTML = '<div class="rest"><strong>Could not load the plan.</strong> Check the internet connection, then close and reopen the app.</div>';
    return;
  }
  $("sub").textContent = plan.subtitle || "";
  const safe = plan.safety || [];
  $("safety").hidden = !safe.length;
  $("safety-title").textContent = plan.safetyTitle || "Before you start: safety first";
  $("safety-list").innerHTML = safe.map(s => "<li>"+s+"</li>").join("");

  todayIdx = plan.days.findIndex(d => d.key===DAY_KEYS[now.getDay()]);
  current = todayIdx>=0 ? todayIdx : 0;
  renderTabs(); renderDay();
}

function renderTabs(){
  const days = section.data.days, el = $("tabs");
  el.style.setProperty("--n", days.length);
  el.classList.toggle("many", days.length > 5);
  el.innerHTML = "";
  days.forEach((d,i)=>{
    const b = document.createElement("button");
    b.className = "tab" + (i===todayIdx ? " today" : "");
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
  const days = section.data.days, wide = window.innerWidth >= days.length*112;
  [...$("tabs").children].forEach((b,i)=>{ b.textContent = wide ? days[i].name : days[i].key; });
}

function renderDay(){
  const plan = section.data;
  let html = "";
  if(todayIdx===-1 && plan.restMessage) html += '<div class="rest">'+plan.restMessage+'</div>';
  $("content").innerHTML = html + section.renderDay(plan.days[current]);
  if(section.afterRender) section.afterRender();
}

// ---- Install as an app ----
function setupInstall(){
  const box = document.createElement("div");
  box.className = "install"; box.hidden = true;
  box.setAttribute("role","dialog"); box.setAttribute("aria-label","Install app");
  box.innerHTML = '<img src="../shared/icons/heart-192.png" alt=""><div class="msg"><strong>Install this app</strong><br>Open it from your home screen like any other app.</div>'+
    '<div class="row"><button class="btn primary">Install</button><button class="btn ghost">Not now</button></div>';
  document.body.appendChild(box);
  const [yes, no] = box.querySelectorAll("button");

  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const snoozeKey = "install-snooze-"+member;
  let deferredPrompt = null;
  const showBox = ()=>{ if(installed || Date.now() < +(store.get(snoozeKey)||0)) return; box.hidden = false; document.body.classList.add("has-install"); };
  const hideBox = ()=>{ box.hidden = true; document.body.classList.remove("has-install"); };

  // Chrome, Edge and Android: the browser says the app can be installed
  window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt = e; showBox(); });
  window.addEventListener("appinstalled", hideBox);

  // iPhone/iPad Safari has no install button, so explain the steps instead
  if(isIOS && !installed){
    box.querySelector(".msg").innerHTML = "<strong>Install this app</strong><br>Tap the Share button <span aria-hidden='true'>⬆︎</span>, then <strong>Add to Home Screen</strong>.";
    yes.style.display = "none";
    no.textContent = "OK";
    showBox();
  }

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

window.FamilyApp = { addSection, start, isIOS, isAndroid };
})();
