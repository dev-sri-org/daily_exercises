// Shopping tab: a week's ingredients from plans/shopping.json, one card per meal.
// Each card has groups of items { name, qty, note }. Ticks are saved on the phone until cleared.
// Only members whose index.html includes this script get the tab (Srinivas for now).
(function(){
const member = location.pathname.split("/").slice(-2, -1)[0];
const key = (c, item) => "shop-"+member+"-"+c+"-"+item;
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ v ? localStorage.setItem(k,v) : localStorage.removeItem(k); }catch(e){} }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const L = {
  clear: { en: "Clear ticks", te: "టిక్‌లు తీసివేయండి" },
  of: { en: (a,b) => a+" of "+b+" in the basket", te: (a,b) => b+" లో "+a+" తీసుకున్నారు" }
};

function renderPage(plan){
  const t = FamilyApp.t;
  return '<div class="grid">'+(plan.cards || []).map((c, ci)=>
    '<article class="card" data-card="'+ci+'"><div class="body">'+
      '<h3 class="title">'+t(c.title)+'</h3>'+
      (c.for ? '<div class="shop-for">'+t(c.for)+'</div>' : '')+
      c.groups.map(g =>
        '<div class="shop-group">'+t(g.name)+'</div><ul class="shop">'+
        g.items.map(it =>
          '<li><label><input type="checkbox" data-key="'+esc(key(ci, t(it.name)))+'"'+(store.get(key(ci, t(it.name))) ? " checked" : "")+'>'+
          '<span class="what">'+t(it.name)+(it.note ? '<span class="note">'+t(it.note)+'</span>' : '')+'</span>'+
          '<span class="qty">'+t(it.qty)+'</span></label></li>').join("")+'</ul>').join("")+
      '<div class="row"><span class="shop-count"></span><button class="btn ghost shop-clear">'+t(L.clear)+'</button></div>'+
    '</div></article>').join("")+'</div>';
}

function afterRender(){
  const lang = FamilyApp.lang();
  document.querySelectorAll("#content .card[data-card]").forEach(card=>{
    const boxes = [...card.querySelectorAll("input[type=checkbox]")];
    const count = ()=>{ card.querySelector(".shop-count").textContent = (L.of[lang] || L.of.en)(boxes.filter(b=>b.checked).length, boxes.length); };
    boxes.forEach(b => b.onchange = ()=>{ store.set(b.dataset.key, b.checked ? "1" : null); count(); });
    card.querySelector(".shop-clear").onclick = ()=>{ boxes.forEach(b=>{ b.checked = false; store.set(b.dataset.key, null); }); count(); };
    count();
  });
}

FamilyApp.addSection({
  id: "shopping",
  label: { en: "Shopping", te: "షాపింగ్" },
  icon: "cart",
  themeColor: "#2f6f3e",
  plan: "plans/shopping.json",
  foot: { en: "Amounts are for one person for 7 days. Brands are suggestions; any unsweetened equivalent works.",
          te: "ఒక వ్యక్తికి 7 రోజులకు సరిపడా. బ్రాండ్లు సూచనలు మాత్రమే." },
  renderPage,
  afterRender
});
})();
