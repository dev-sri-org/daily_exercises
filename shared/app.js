// Shared by every family member's app. Each member has their own folder (e.g. nanna/) with:
//   index.html      their home page, linking to the two pages below
//   exercises.html  daily exercise videos   (plan: plans/exercises.json)
//   meals.html      daily meal plan         (plan: plans/meals.json)
//   manifest.webmanifest, sw.js
// The HTML pages are the same for everyone; the member's name comes from their manifest's short_name.
(function(){
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const isAndroid = /Android/i.test(navigator.userAgent);
const $ = id => document.getElementById(id);
const now = new Date();
const member = location.pathname.split("/").slice(-2, -1)[0];  // folder name, e.g. "nanna"

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

async function memberName(){
  try{ const m = await getJSON("manifest.webmanifest"); return m.short_name || m.name || ""; }
  catch(e){ return ""; }
}

const dateLine = () => now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

function setup(html){
  document.body.insertAdjacentHTML("afterbegin", '<div class="wrap">'+html+'</div>');
  // If the app is left open past midnight, refresh when it is shown again
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState==="visible" && new Date().toDateString()!==now.toDateString()) location.reload();
  });
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
  setupInstall();
}

function showError(){
  $("content").innerHTML = '<div class="rest"><strong>Could not load the plan.</strong> Check the internet connection, then close and reopen the app.</div>';
}

// ---- Member home page: links to exercises and meals, with today's focus for each ----
async function homePage(){
  const sections = [
    { href:"exercises.html", icon:"heart", title:"Daily Exercises", plan:"plans/exercises.json", none:"Rest day, no exercises today" },
    { href:"meals.html", icon:"bowl", title:"Daily Meal Plan", plan:"plans/meals.json", none:"No meal plan for today" }
  ];
  setup('<h1 id="title">Daily Plan</h1><p class="date">'+dateLine()+'</p>'+
    '<div class="apps">'+sections.map((s,i)=>
      '<a class="card app" href="'+s.href+'"><img src="../shared/icons/'+s.icon+'-192.png" alt="">'+
      '<div><h2 class="title">'+s.title+'</h2><div class="meta" id="today-'+i+'"></div></div></a>').join("")+'</div>');

  const name = await memberName();
  if(name) document.title = $("title").textContent = name+"'s Daily Plan";
  sections.forEach(async (s,i)=>{
    try{
      const d = (await getJSON(s.plan)).days.find(d => d.key===DAY_KEYS[now.getDay()]);
      $("today-"+i).textContent = d ? "Today: "+d.focus : s.none;
    }catch(e){}
  });
}

// ---- Exercise and meal pages: day tabs plus the selected day's content ----
// opts: { plan, title, foot, renderDay(day), onPlan(plan), afterRender() }
async function dayPage(opts){
  setup('<a class="back" href="./">← Home</a>'+
    '<h1 id="title">'+opts.title+'</h1><p class="date">'+dateLine()+'</p><p class="sub" id="sub"></p>'+
    '<details class="safety" id="safety" open hidden><summary id="safety-title"></summary><ul id="safety-list"></ul></details>'+
    '<div class="tabs" id="tabs" role="tablist"></div><div id="content"></div>'+
    '<p class="foot">'+opts.foot+'</p>');

  const [name, plan] = await Promise.all([memberName(), getJSON(opts.plan).catch(()=>null)]);
  if(name) document.title = $("title").textContent = opts.title+" for "+name;
  if(!plan) return showError();
  if(opts.onPlan) opts.onPlan(plan);

  $("sub").textContent = plan.subtitle || "";
  const safe = plan.safety || [];
  $("safety").hidden = !safe.length;
  $("safety-title").textContent = plan.safetyTitle || "Before you start: safety first";
  $("safety-list").innerHTML = safe.map(s => "<li>"+s+"</li>").join("");

  const todayIdx = plan.days.findIndex(d => d.key===DAY_KEYS[now.getDay()]);
  let current = todayIdx>=0 ? todayIdx : 0;

  function renderTabs(){
    const el = $("tabs");
    el.style.setProperty("--n", plan.days.length);
    el.classList.toggle("many", plan.days.length > 5);
    el.innerHTML = "";
    plan.days.forEach((d,i)=>{
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
    const wide = window.innerWidth >= plan.days.length*112;
    [...$("tabs").children].forEach((b,i)=>{ b.textContent = wide ? plan.days[i].name : plan.days[i].key; });
  }
  window.addEventListener("resize", labelTabs);

  function renderDay(){
    let html = "";
    if(todayIdx===-1 && plan.restMessage) html += '<div class="rest">'+plan.restMessage+'</div>';
    $("content").innerHTML = html + opts.renderDay(plan.days[current]);
    if(opts.afterRender) opts.afterRender();
  }

  renderTabs(); renderDay();
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
  const show = ()=>{ if(installed || Date.now() < +(store.get(snoozeKey)||0)) return; box.hidden = false; document.body.classList.add("has-install"); };
  const hide = ()=>{ box.hidden = true; document.body.classList.remove("has-install"); };

  // Chrome, Edge and Android: the browser says the app can be installed
  window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt = e; show(); });
  window.addEventListener("appinstalled", hide);

  // iPhone/iPad Safari has no install button, so explain the steps instead
  if(isIOS && !installed){
    box.querySelector(".msg").innerHTML = "<strong>Install this app</strong><br>Tap the Share button <span aria-hidden='true'>⬆︎</span>, then <strong>Add to Home Screen</strong>.";
    yes.style.display = "none";
    no.textContent = "OK";
    show();
  }

  yes.onclick = async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hide();
  };
  // "Not now" hides the popup for 3 days
  no.onclick = ()=>{ store.set(snoozeKey, Date.now() + 3*24*60*60*1000); hide(); };
}

window.FamilyApp = { homePage, dayPage, isIOS, isAndroid };
})();
