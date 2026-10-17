// Meals tab. Each day in plans/meals.json has meals; each meal has a slot (Breakfast, Lunch...),
// a dish name, a list of items with portions, and a short "why". Slot times come from the plan's "times".
(function(){
let times = {};

function renderDay(d){
  let html = '<div class="focus">'+d.name+": "+d.focus+'</div>'+(d.note ? '<p class="focus-sub">'+d.note+'</p>' : '')+'<div class="grid">';
  d.meals.forEach(m=>{
    html += '<article class="card"><div class="body">'+
      '<div class="step">'+m.slot+(times[m.slot] ? ' <span class="time">· '+times[m.slot]+'</span>' : '')+'</div>'+
      '<h3 class="title">'+m.dish+'</h3>'+
      '<ul class="items">'+m.items.map(x=>'<li>'+x+'</li>').join("")+'</ul>'+
      (m.why ? '<div class="why">'+m.why+'</div>' : '')+
      '</div></article>';
  });
  return html + "</div>";
}

FamilyApp.addSection({
  id: "meals",
  label: "Meals",
  icon: "bowl",
  themeColor: "#a8481f",
  plan: "plans/meals.json",
  foot: "A general guide, not medical advice. Ask the doctor or a dietitian to check portions, especially with diabetes medicines, insulin or blood thinners.",
  renderDay,
  onPlan: plan => { times = plan.times || {}; }
});
})();
