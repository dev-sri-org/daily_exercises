// Shared by the family apps (exercises, meal plan): family-member picker, day tabs,
// today's date, "done" ticks saved per person per day, offline support and the install popup.
//
// Each app folder has plans/people.json (who has a plan) and plans/<person id>.json (their plan),
// and calls FamilyApp.start({...}) with its own renderDay. See README.md for the plan format.
(function(){
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const isAndroid = /Android/i.test(navigator.userAgent);
const $ = id => document.getElementById(id);

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

async function start(opts){
  // opts: { app, title(name), renderDay(day, helpers), onPlan(plan), afterRender(), doneLabels:[notDone, done] }
  const [offLabel, onLabel] = opts.doneLabels || ["Mark done", "Done ✓"];
  const now = new Date();
  const dow = now.getDay();
  // Local date (not UTC), e.g. "2026-10-16"
  const todayStr = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  $("today").textContent = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  // If the app is left open past midnight, refresh when it is shown again
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState==="visible" && new Date().toDateString()!==now.toDateString()) location.reload();
  });

  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
  setupInstall(opts.app);

  let people;
  try{ people = await getJSON("plans/people.json"); }
  catch(e){ return showError(); }

  // Person comes from ?p=<id>, else the last one picked (shared by all the apps), else the first
  const asked = new URLSearchParams(location.search).get("p");
  let personId = [asked, store.get("family-person")].find(id => people.some(p => p.id===id)) || people[0].id;

  let plan, current, todayIdx, memDone = {};
  const doneKey = () => "done-"+opts.app+"-"+personId+"-"+todayStr;
  const getDone = () => { try{ return JSON.parse(store.get(doneKey())||"{}"); }catch(e){ return {}; } };
  const isDone = k => !!(getDone()[k] || memDone[personId+k]);
  function setDone(k, v){
    if(v) memDone[personId+k]=1; else delete memDone[personId+k];
    const d = getDone(); if(v) d[k]=1; else delete d[k];
    store.set(doneKey(), JSON.stringify(d));
  }
  const helpers = {
    isDone,
    doneButton: k => '<button class="btn primary" data-k="'+k+'">'+(isDone(k)?onLabel:offLabel)+'</button>',
    cardClass: k => "card"+(isDone(k)?" done":"")
  };

  async function loadPerson(id){
    personId = id;
    store.set("family-person", id);
    const person = people.find(p => p.id===id);
    try{ plan = await getJSON("plans/"+id+".json"); }
    catch(e){ return showError(); }
    if(opts.onPlan) opts.onPlan(plan);

    document.title = $("title").textContent = opts.title(person.name);
    $("sub").textContent = plan.subtitle || "";
    const safe = plan.safety || [];
    $("safety").hidden = !safe.length;
    $("safety-title").textContent = plan.safetyTitle || "Before you start: safety first";
    $("safety-list").innerHTML = safe.map(s => "<li>"+s+"</li>").join("");

    todayIdx = plan.days.findIndex(d => d.key===DAY_KEYS[dow]);
    current = todayIdx>=0 ? todayIdx : 0;
    renderPeople(); renderTabs(); renderDay();
  }

  function renderPeople(){
    const el = $("people");
    el.hidden = people.length < 2;
    el.innerHTML = '<span class="label">Plan for:</span>' + people.map(p =>
      '<button class="person" data-p="'+p.id+'" aria-pressed="'+(p.id===personId)+'">'+p.name+'</button>').join("");
    el.querySelectorAll("button").forEach(b => b.onclick = ()=>{ if(b.dataset.p!==personId) loadPerson(b.dataset.p); });
  }

  function renderTabs(){
    const el = $("tabs");
    el.style.setProperty("--n", plan.days.length);
    el.classList.toggle("many", plan.days.length > 5);
    el.setAttribute("role", "tablist");
    el.innerHTML = "";
    plan.days.forEach((d,i)=>{
      const b = document.createElement("button");
      b.className = "tab" + (i===todayIdx ? " today" : "");
      b.setAttribute("role","tab");
      b.setAttribute("aria-selected", i===current);
      b.textContent = d.key;
      b.onclick = ()=>{ current=i; renderTabs(); renderDay(); };
      el.appendChild(b);
    });
    labelTabs();
  }

  // Full weekday names when there is room, short ones on phones
  function labelTabs(){
    if(!plan) return;
    const wide = window.innerWidth >= plan.days.length*112;
    [...$("tabs").children].forEach((b,i)=>{ b.textContent = wide ? plan.days[i].name : plan.days[i].key; });
  }
  window.addEventListener("resize", labelTabs);

  function renderDay(){
    const d = plan.days[current];
    let html = "";
    if(todayIdx===-1 && plan.restMessage) html += '<div class="rest">'+plan.restMessage+'</div>';
    html += opts.renderDay(d, helpers);
    const content = $("content");
    content.innerHTML = html;
    content.querySelectorAll("button[data-k]").forEach(btn=>{
      btn.onclick = ()=>{
        const k = btn.dataset.k, nowDone = !isDone(k);
        setDone(k, nowDone);
        btn.closest(".card").classList.toggle("done", nowDone);
        btn.textContent = nowDone ? onLabel : offLabel;
      };
    });
    if(opts.afterRender) opts.afterRender();
  }

  loadPerson(personId);
}

function showError(){
  $("content").innerHTML = '<div class="rest"><strong>Could not load the plan.</strong> Check the internet connection, then close and reopen the app.</div>';
}

// ---- Install as an app ----
function setupInstall(app){
  const box = document.createElement("div");
  box.className = "install"; box.hidden = true;
  box.setAttribute("role","dialog"); box.setAttribute("aria-label","Install app");
  box.innerHTML = '<img src="icon-192.png" alt=""><div class="msg"><strong>Install this app</strong><br>Open it from your home screen like any other app.</div>'+
    '<div class="row"><button class="btn primary">Install</button><button class="btn ghost">Not now</button></div>';
  document.body.appendChild(box);
  const [yes, no] = box.querySelectorAll("button");

  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const snoozeKey = "install-snooze-"+app;
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

window.FamilyApp = { start, isIOS, isAndroid };
})();
