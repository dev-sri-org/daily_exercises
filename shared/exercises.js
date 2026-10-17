// Exercises tab. Each day in plans/exercises.json has tiles (warm-up, main, cool-down);
// "id" is the YouTube video ID.
(function(){
const { isIOS, isAndroid } = FamilyApp;

// Open videos in the YouTube app (which has the Cast button) instead of the browser.
// Android: an app link that falls back to the website if YouTube isn't installed.
function ytAppLink(id){
  const web = "https://www.youtube.com/watch?v="+id;
  if(isAndroid) return "intent://www.youtube.com/watch?v="+id+"#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url="+encodeURIComponent(web)+";end";
  return web;
}
// iPhone/iPad: try the YouTube app; if it doesn't open, fall back to the website
document.addEventListener("click", e=>{
  const a = e.target.closest("a[data-yt]");
  if(!a || !isIOS) return;
  e.preventDefault();
  const id = a.dataset.yt;
  const fallback = setTimeout(()=>{ location.href = "https://www.youtube.com/watch?v="+id; }, 2500);
  document.addEventListener("visibilitychange", ()=>clearTimeout(fallback), { once:true });
  location.href = "youtube://www.youtube.com/watch?v="+id;
});

// The player needs our origin to report play/pause, but a file opened from disk has none
const ytOrigin = location.protocol.startsWith("http") ? "&origin="+encodeURIComponent(location.origin) : "";

const TEXT = {
  en: {
    cast: '<strong>To watch on the TV:</strong> tap "Watch on TV / YouTube", then tap the Cast icon at the top of the video.',
    watch: "Watch on TV / YouTube", mins: n => "About "+n+" minutes"
  },
  te: {
    cast: '<strong>టీవీలో చూడాలంటే:</strong> "టీవీ / YouTube లో చూడండి" నొక్కి, వీడియో పైన ఉన్న Cast గుర్తును నొక్కండి. వీడియోలు ఇంగ్లీషులో ఉంటాయి.',
    watch: "టీవీ / YouTube లో చూడండి", mins: n => "సుమారు "+n+" నిమిషాలు"
  }
};

function renderDay(d){
  const t = FamilyApp.t, txt = TEXT[FamilyApp.lang()];
  let html = '<div class="focus">'+FamilyApp.dayName(d.key, true)+": "+t(d.focus)+'</div><p class="focus-sub">'+t(d.note)+'</p>'+
    '<p class="castnote">'+txt.cast+'</p><div class="grid">';
  d.tiles.forEach(tile=>{
    html += '<article class="card">'+
      '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/'+tile.id+'?rel=0&playsinline=1&enablejsapi=1'+ytOrigin+'" title="'+t(tile.title)+'" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'+
      '<div class="body"><div class="step">'+t(tile.step)+'</div><h3 class="title">'+t(tile.title)+'</h3>'+
      '<div class="meta">'+txt.mins(tile.mins)+'</div><div class="tip">'+t(tile.tip)+'</div>'+
      '<div class="row"><a class="btn ghost" href="'+ytAppLink(tile.id)+'" data-yt="'+tile.id+'"'+(isAndroid?'':' target="_blank" rel="noopener"')+'>'+txt.watch+'</a></div></div></article>';
  });
  return html + "</div>";
}

// Only one video plays at a time: when one starts, pause the others.
let players = [];
let ytReady = false;
window.onYouTubeIframeAPIReady = ()=>{ ytReady = true; hookPlayers(); };
function hookPlayers(){
  if(!ytReady) return;
  players = [...document.querySelectorAll("#content iframe")].map(f=> new YT.Player(f, { events:{
    onStateChange: e=>{
      if(e.data!==YT.PlayerState.PLAYING) return;
      players.forEach(p=>{ if(p!==e.target && p.pauseVideo) p.pauseVideo(); });
    }
  }}));
}

FamilyApp.addSection({
  id: "exercises",
  label: { en: "Exercises", te: "వ్యాయామాలు" },
  icon: "heart",
  themeColor: "#1f6f5c",
  plan: "plans/exercises.json",
  foot: {
    en: 'Videos are from YouTube creators and are not medical advice. If a video does not play here, use the "Watch on TV / YouTube" button.',
    te: 'వీడియోలు YouTube లోనివి, ఇవి వైద్య సలహా కాదు. వీడియో ఇక్కడ ప్లే కాకపోతే, "టీవీ / YouTube లో చూడండి" బటన్ వాడండి.'
  },
  renderDay,
  afterRender: hookPlayers
});

const api = document.createElement("script");
api.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(api);
})();
