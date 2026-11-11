# Family Health

Each family member has their own installable web app with two tabs: Exercises and Meals.
Link straight to a tab with `#exercises` or `#meals`, e.g. `.../nanna/#meals`.

The **తెలుగు / English** button switches the language, and the phone remembers the choice.
A link can choose it too: `.../nanna/?lang=te#meals`. Videos stay in English.
Hosted on GitHub Pages: https://dev-sri-org.github.io/daily_exercises/

| Member | App |
|---|---|
| Nanna | https://dev-sri-org.github.io/daily_exercises/nanna/ |
| Amma | https://dev-sri-org.github.io/daily_exercises/amma/ |
| Srinivas | https://dev-sri-org.github.io/daily_exercises/srinivas/ |
| Saumya | https://dev-sri-org.github.io/daily_exercises/saumya/ |

## Layout

```
index.html                Family page linking to each member's app
shared/                   Code and styles every member's app uses
  app.js                  Page layout, Exercises/Meals tabs, day tabs, date, install popup
  exercises.js            Exercises tab (YouTube videos)
  meals.js                Meals tab
  shopping.js             Shopping tab (only in apps whose index.html includes it)
  app.css, sw-core.js     Styles and offline support
  icons/                  App and tab icons
nanna/                    Nanna's app
  index.html              The app page (same for every member)
  manifest.webmanifest    App name shown on the phone ("short_name", and "name_te" in Telugu, is used on the page)
  sw.js                   Offline support (just imports shared/sw-core.js)
  plans/exercises.json    Nanna's exercise plan
  plans/meals.json        Nanna's meal plan
amma/                     Amma's app (same files, her own plans)
srinivas/, saumya/        Srinivas's and Saumya's apps (English only)
tools/saumya_meals.py     Builds Saumya's meal plan (see below)
exercises/, meal_plan/    Old addresses; they redirect to the member's app
```

## Adding a family member

1. Copy a member's folder, e.g. `nanna/` to `ravi/`. The folder name becomes the address (`.../daily_exercises/ravi/`), so use lowercase with no spaces.
2. In `ravi/manifest.webmanifest`, change `name` and `short_name`. Add `"languages": ["en"]` if the plans are only in English; this hides the Telugu button.
   Optional: `"swipeCards": true` shows the day's cards side by side to swipe through (with dots underneath),
   and `"safetyCollapsed": true` starts the rules box closed. Srinivas's app starts with the rules closed.
3. Edit `ravi/plans/exercises.json` and `ravi/plans/meals.json`.
4. Add a link to `ravi/` in the root `index.html`.

## Updating shared code

Each `index.html` loads the shared files with `?v=2`. When you change `shared/*.js` or `app.css`, bump that number
in all four `index.html` files so phones fetch the new copies together instead of mixing old and new files.

## Plan format

Any text can be a plain string or an English/Telugu pair: `{ "en": "1 cup sambar", "te": "1 కప్పు సాంబారు" }`.
Plain strings and missing Telugu show in English. Weekday names come from the app, not the plan.

Both plan files share these fields:

- `subtitle`: line under the title
- `safetyTitle`, `safety`: the yellow notes box (a list of strings; `<strong>` is allowed)
- `restMessage` (optional): shown on days with no plan, such as weekends
- `days`: one entry per day, each with `key` (`Mon`…`Sun`), `name`, `focus` and an optional `note`

Each exercise day has `tiles`: `{ step, title, mins, id, tip, moves }`. `id` is a YouTube video ID; `moves` is a list of exercises,
`{ name, dose, tip, q }`, e.g. `{ "name": "Goblet squat", "dose": "3 × 10–12" }`. Each move gets a "How to" link that searches
YouTube for `q`, or for its name. A tile can have a video, moves, or both.

Each meal plan day has `meals`: `{ slot, dish, items: [...], why, nutrition }`. `nutrition` is optional,
`{ "kcal": 730, "protein": 45, "carbs": 37, "fat": 49, "fiber": 15 }` (grams); the app adds the day's meals up into a total shown above the cards. Times for each slot come from the plan's top-level `times`.

## Shopping list

Srinivas's app has a third tab, Shopping, built from `srinivas/plans/shopping.json`: a week of ingredients, one card per meal.
Each card is `{ title, for, groups: [{ name, items: [{ name, qty, note }] }] }`. Ticks are saved on the phone until "Clear ticks".
Update the amounts there when the meal plan changes. To give another member the tab, add
`<script src="../shared/shopping.js"></script>` after `meals.js` in their `index.html` and add their own `plans/shopping.json`.

## Shared meals

Saumya's Meal 1 and Meal 2 come from `tools/saumya_shared_meals.json` (Srinivas's earlier plan), plus her own breakfast.
After changing that file (or her breakfasts in `tools/saumya_meals.py`), run `python tools/saumya_meals.py` to rebuild `saumya/plans/meals.json`.
