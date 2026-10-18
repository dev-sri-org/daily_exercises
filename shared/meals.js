// Meals tab. Each day in plans/meals.json has meals; each meal has a slot (Breakfast, Lunch...),
// a dish name, a list of items with portions, and a short "why". Slot times come from the plan's "times".
(function(){
const SLOTS = {
  te: { "Breakfast": "అల్పాహారం", "Mid-morning": "ఉదయం చిరుతిండి", "Lunch": "మధ్యాహ్న భోజనం",
        "Evening snack": "సాయంత్రం చిరుతిండి", "Dinner": "రాత్రి భోజనం" }
};
let times = {};

function renderDay(d){
  const t = FamilyApp.t, slots = SLOTS[FamilyApp.lang()] || {};
  let html = '<div class="focus">'+FamilyApp.dayName(d.key, true)+": "+t(d.focus)+'</div>'+
    (d.note ? '<p class="focus-sub">'+t(d.note)+'</p>' : '')+'<div class="grid">';
  d.meals.forEach(m=>{
    html += '<article class="card"><div class="body">'+
      '<div class="step">'+(slots[m.slot] || m.slot)+(times[m.slot] ? ' <span class="time">· '+t(times[m.slot])+'</span>' : '')+'</div>'+
      '<h3 class="title">'+t(m.dish)+'</h3>'+
      '<ul class="items">'+m.items.map(x=>'<li>'+t(x)+'</li>').join("")+'</ul>'+
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
