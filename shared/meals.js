// Meals tab. Each day in plans/meals.json has meals; each meal has a slot (Breakfast, Lunch...),
// a dish name, a list of items with portions, a short "why", and optional nutrition. Slot times come from the plan's "times".
(function(){
const SLOTS = {
  te: { "Breakfast": "అల్పాహారం", "Mid-morning": "ఉదయం చిరుతిండి", "Lunch": "మధ్యాహ్న భోజనం",
        "Evening snack": "సాయంత్రం చిరుతిండి", "Dinner": "రాత్రి భోజనం" }
};
let times = {};

// Nutrition: a meal can have { kcal, protein, carbs, fat, fiber } (grams, except kcal).
// The day's total is added up from its meals and shown above the cards.
const NUTRIENTS = [
  ["kcal",    { en: "Calories", te: "కేలరీలు" }, ""],
  ["protein", { en: "Protein",  te: "ప్రోటీన్" }, " g"],
  ["carbs",   { en: "Carbs",    te: "పిండి పదార్థాలు" }, " g"],
  ["fat",     { en: "Fat",      te: "కొవ్వు" }, " g"],
  ["fiber",   { en: "Fiber",    te: "పీచు" }, " g"]
];
function nutritionRow(n){
  const t = FamilyApp.t;
  return '<dl class="nutri">'+NUTRIENTS.filter(([k])=>n[k] != null).map(([k, label, unit])=>
    '<div><dt>'+t(label)+'</dt><dd>'+Math.round(n[k]).toLocaleString("en-US")+unit+'</dd></div>').join("")+'</dl>';
}
function dayTotal(d){
  const meals = d.meals.filter(m=>m.nutrition);
  if (!meals.length) return "";
  const t = FamilyApp.t, sum = {};
  meals.forEach(m=>NUTRIENTS.forEach(([k])=>{ if (m.nutrition[k] != null) sum[k] = (sum[k]||0) + m.nutrition[k]; }));
  let split = "";
  if (sum.protein != null && sum.carbs != null && sum.fat != null){
    const p = sum.protein*4, c = sum.carbs*4, f = sum.fat*9, all = p + c + f;
    split = '<div class="nutri-split">'+t({ en: "Calories from", te: "కేలరీలు" })+': '+
      t({ en: "protein", te: "ప్రోటీన్" })+' '+Math.round(p/all*100)+'% · '+
      t({ en: "carbs", te: "పిండి పదార్థాలు" })+' '+Math.round(c/all*100)+'% · '+
      t({ en: "fat", te: "కొవ్వు" })+' '+Math.round(f/all*100)+'%</div>';
  }
  return '<section class="day-total"><div class="step">'+t({ en: "Total for the day (approx.)", te: "రోజు మొత్తం (సుమారు)" })+'</div>'+
    nutritionRow(sum)+split+'</section>';
}

function renderDay(d){
  const t = FamilyApp.t, slots = SLOTS[FamilyApp.lang()] || {};
  let html = '<div class="focus">'+FamilyApp.dayName(d.key, true)+": "+t(d.focus)+'</div>'+
    (d.note ? '<p class="focus-sub">'+t(d.note)+'</p>' : '')+dayTotal(d)+'<div class="grid">';
  d.meals.forEach(m=>{
    html += '<article class="card"><div class="body">'+
      '<div class="step">'+(slots[m.slot] || m.slot)+(times[m.slot] ? ' <span class="time">· '+t(times[m.slot])+'</span>' : '')+'</div>'+
      '<h3 class="title">'+t(m.dish)+'</h3>'+
      '<ul class="items">'+m.items.map(x=>'<li>'+t(x)+'</li>').join("")+'</ul>'+
      (m.nutrition ? nutritionRow(m.nutrition) : '')+
      (m.why ? '<div class="why">'+t(m.why)+'</div>' : '')+
      '</div></article>';
  });
  return html + "</div>";
}

FamilyApp.addSection({
  id: "meals",
  label: { en: "Meals", te: "భోజనం" },
  icon: "bowl",
  themeColor: "#a8481f",
  plan: "plans/meals.json",
  foot: {
    en: "A general guide, not medical advice. Ask the doctor or a dietitian to check portions, especially with daily medicines or blood thinners.",
    te: "ఇది సాధారణ మార్గదర్శి మాత్రమే, వైద్య సలహా కాదు. ముఖ్యంగా రోజూ వాడే మందులు లేదా రక్తం పలుచబడే మందులు వాడుతుంటే, మోతాదులను డాక్టర్ లేదా డైటీషియన్‌తో సరిచూసుకోండి."
  },
  renderDay,
  onPlan: plan => { times = plan.times || {}; }
});
})();
