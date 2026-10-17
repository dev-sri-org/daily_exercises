# Family Health

Each family member has their own installable web app with a daily exercise plan and a daily meal plan.
Hosted on GitHub Pages: https://dev-sri-org.github.io/daily_exercises/

| Member | App |
|---|---|
| Nanna | https://dev-sri-org.github.io/daily_exercises/nanna/ |
| Amma | https://dev-sri-org.github.io/daily_exercises/amma/ |

## Layout

```
index.html                Family page linking to each member's app
shared/                   Code and styles every member's app uses
  app.js                  Home page, day tabs, date, install popup
  exercises.js            Exercise page (YouTube videos)
  meals.js                Meal plan page
  app.css, sw-core.js     Styles and offline support
  icons/                  App and section icons
nanna/                    Nanna's app
  index.html              Home: links to Daily Exercises and Daily Meal Plan
  exercises.html          Daily exercises
  meals.html              Daily meal plan
  manifest.webmanifest    App name shown on the phone ("short_name" is used on the pages)
  sw.js                   Offline support (just imports shared/sw-core.js)
  plans/exercises.json    Nanna's exercise plan
  plans/meals.json        Nanna's meal plan
amma/                     Amma's app (same files, her own plans)
exercises/, meal_plan/    Old addresses; they redirect to the member's app
```

## Adding a family member

1. Copy a member's folder, e.g. `nanna/` to `ravi/`. The folder name becomes the address (`.../daily_exercises/ravi/`), so use lowercase with no spaces.
2. In `ravi/manifest.webmanifest`, change `name` and `short_name`.
3. Edit `ravi/plans/exercises.json` and `ravi/plans/meals.json`.
4. Add a link to `ravi/` in the root `index.html`.

## Plan format

Both plan files share these fields:

- `subtitle`: line under the title
- `safetyTitle`, `safety`: the yellow notes box (a list of strings; `<strong>` is allowed)
- `restMessage` (optional): shown on days with no plan, such as weekends
- `days`: one entry per day, each with `key` (`Mon`…`Sun`), `name`, `focus` and an optional `note`

Each exercise day has `tiles`: `{ step, title, mins, id, tip }`, where `id` is the YouTube video ID.

Each meal plan day has `meals`: `{ slot, dish, items: [...], why }`. Times for each slot come from the plan's top-level `times`.
