# Family Health

Installable web apps with a daily plan for each family member, hosted on GitHub Pages:
https://dev-sri-org.github.io/daily_exercises/

| App | Folder | Link |
|---|---|---|
| Daily Exercises | `exercises/` | https://dev-sri-org.github.io/daily_exercises/exercises/ |
| Meal Plan | `meal_plan/` | https://dev-sri-org.github.io/daily_exercises/meal_plan/ |

`nanna/` only redirects the old address to `exercises/`.

## Layout

```
index.html            Family home page linking to each app
shared/
  app.js              Person picker, day tabs, date, "done" ticks, install popup
  app.css             Shared styles
  sw-core.js          Offline support used by each app's sw.js
exercises/            Exercise app (videos)
  plans/people.json   Who has an exercise plan
  plans/<id>.json     That person's plan
meal_plan/            Meal plan app
  plans/people.json   Who has a meal plan
  plans/<id>.json     That person's plan
```

## Adding a family member

1. Add them to `plans/people.json` in each app, e.g. `{ "id": "ravi", "name": "Ravi" }`.
   The `id` is lowercase with no spaces. It names the plan file and can be linked directly: `exercises/?p=ravi`.
2. Copy an existing plan to `plans/ravi.json` and edit it.

The picker remembers the last person chosen, and that choice is shared by both apps.

## Plan format

Both apps share these fields:

- `subtitle`: line under the title
- `safetyTitle`, `safety`: the yellow notes box (a list of strings; `<strong>` is allowed)
- `restMessage` (optional): shown on days with no plan, such as weekends
- `days`: one entry per day, each with `key` (`Mon`…`Sun`), `name`, `focus` and an optional `note`

Each exercise day has `tiles`: `{ step, title, mins, id, tip }`, where `id` is the YouTube video ID.

Each meal plan day has `meals`: `{ slot, dish, items: [...], why }`. Times for each slot come from the plan's top-level `times`.
