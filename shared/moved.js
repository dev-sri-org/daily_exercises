// Old app addresses (exercises/, meal_plan/) send people to the same page in their own member app.
// Usage: <script src="../shared/moved.js" data-page="exercises.html"></script>
(function(){
const page = document.currentScript.dataset.page;
let who = new URLSearchParams(location.search).get("p");
try{ who = who || localStorage.getItem("family-person"); }catch(e){}
if(!/^[a-z0-9_-]+$/.test(who || "")) who = "nanna";
const target = "../" + who + "/" + page;
const link = document.getElementById("moved-link");
if(link) link.href = target;

// Remove the old app's offline worker and cache, then go to the new address
const oldScope = location.pathname.replace(/[^/]*$/, "");
const go = () => location.replace(target);
const cleanup = [];
if("serviceWorker" in navigator) cleanup.push(navigator.serviceWorker.getRegistrations()
  .then(rs => Promise.all(rs.filter(r => new URL(r.scope).pathname === oldScope).map(r => r.unregister()))));
if(window.caches) cleanup.push(caches.keys().then(keys => Promise.all(
  keys.filter(k => /^(exercises|meal_plan)-v\d+$/.test(k)).map(k => caches.delete(k)))));
Promise.all(cleanup).catch(()=>{}).finally(go);
})();
