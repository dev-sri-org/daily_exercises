"""Saumya eats Srinivas's Meal 1 and Meal 2 (read from his plan) plus her own breakfast.
Run "python tools/saumya_meals.py" after changing srinivas/plans/meals.json to keep the shared meals in step."""
import json, copy
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
s = json.load(open(ROOT + "srinivas/plans/meals.json", encoding="utf-8"))

def meal(dish, items, why):
    return {"slot": "Breakfast", "dish": dish, "items": items, "why": why}

BREAKFAST = {
  "Mon": meal("Overnight oats", ["½ cup rolled oats soaked overnight in unsweetened soy milk", "1 tbsp chia seeds", "1 tbsp ground flaxseed", "½ cup berries or chopped apple"],
              "About 18 g protein. Flaxseed and soy support women's health; oats keep you full for hours."),
  "Tue": meal("Moong dal chilla", ["2 moong dal chillas with grated vegetables", "2 tbsp mint chutney", "1 glass unsweetened soy milk"],
              "About 20 g protein for very few calories."),
  "Wed": meal("Tofu scramble", ["100 g tofu scrambled with spinach, onion and tomato", "1 slice multigrain toast or 1 small roti", "Black coffee or tea, no sugar"],
              "About 17 g protein. Calcium-set tofu helps keep bones strong."),
  "Thu": meal("Soy milk smoothie", ["1 glass unsweetened soy milk", "1 scoop pea or soy protein powder (optional)", "½ cup berries or ½ banana", "1 tbsp ground flaxseed"],
              "About 25 g protein with the powder, 10 g without. Quick on busy mornings."),
  "Fri": meal("Sprouts chaat", ["1½ cups moong sprouts with onion, tomato, cucumber and lemon", "1 tbsp roasted pumpkin seeds", "1 glass unsweetened soy milk"],
              "About 17 g protein and lots of fibre."),
  "Sat": meal("Ragi idli with sambar", ["2 ragi or millet idlis", "1 cup sambar", "1 tbsp peanut chutney"],
              "About 12 g protein. Ragi is one of the best plant sources of calcium."),
  "Sun": meal("Chia pudding", ["2 tbsp chia seeds soaked in 1 cup unsweetened soy milk", "½ cup papaya or berries", "1 tbsp roasted pumpkin seeds"],
              "About 14 g protein. Chia adds omega-3 and fibre."),
}

# Srinivas's day names are about his gym days
FOCUS = {"Mon": "Tofu & rajma", "Wed": "Besan & chana", "Fri": "Protein bowl", "Sun": "Chole & tofu"}

# Srinivas's notes about his gym and workouts don't apply to Saumya
WHY_SWAP = {
  "About 35 g protein. Rajma and brown rice together give a full set of amino acids for recovery after the gym.":
    "About 35 g protein. Rajma and brown rice together give a full set of amino acids.",
  "About 40 g protein before the home workout.": "About 40 g protein.",
  "About 45 g protein to recover from the workout.": "About 45 g protein.",
  "About 38 g protein. Soft, easy to digest, and good for recovery after the gym.": "About 38 g protein. Soft and easy to digest.",
}

p = {
  "subtitle": "Vegan meals for strength and weight loss. Meal 1 and Meal 2 are the same dishes as Srinivas's, in lighter portions, plus a high-protein breakfast.",
  "safetyTitle": "Daily rules of thumb",
  "safety": [
    "<strong>Shared meals, smaller plate:</strong> take the same dishes as Srinivas but half the rice, roti or millet (1 roti instead of 2). Keep the full protein and fill up on extra vegetables and salad.",
    "<strong>Protein:</strong> about 1.2 g per kg of body weight a day, spread over the three meals. Protein keeps you full and protects muscle while losing weight.",
    "<strong>Soy and flaxseed:</strong> have soy foods (tofu, soy milk, soya chunks) and 1 tbsp ground flaxseed most days; they support women's health after 40. Spicy food, caffeine and alcohol can cause sudden warmth and sweating.",
    "<strong>Bones:</strong> aim for calcium-rich foods every day: calcium-set tofu, fortified soy milk, ragi, sesame and leafy greens. Ask the doctor about vitamin D and B12, which are needed on a vegan diet.",
    "<strong>No added sugar</strong>, jaggery or honey; whole fruit instead of juice. Nuts are healthy but calorie-dense: a small handful a day.",
    "Finish dinner 2 to 3 hours before bed. Drink 2.5 litres of water a day; thirst is often mistaken for hunger.",
    "Lose weight slowly, about ½ kg a week. Crash diets take away muscle and bone.",
  ],
  "times": {"Breakfast": "8:00 am", **s["times"]},
  "days": [],
}
for d in s["days"]:
    d = copy.deepcopy(d)
    for m in d["meals"]:
        m["why"] = WHY_SWAP.get(m["why"], m["why"])
    d["focus"] = FOCUS.get(d["key"], d["focus"])
    d["meals"].insert(0, BREAKFAST[d["key"]])
    p["days"].append(d)

with open(ROOT + "saumya/plans/meals.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(p, f, ensure_ascii=False, indent=2); f.write("\n")
print("ok")
