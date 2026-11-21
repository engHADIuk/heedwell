# Methodology

Heedwell's scores are **transparent heuristics**, not a validated epidemiological model. They turn a week of weather and a pet's routine into a number from 0 to 100 using published guidance about when each parasite is active. They do not know how many cases have been seen near you, what your pet is already protected with, or anything about your pet's health. The app says this on the plan, in the "Why this score" panel and on the vet summary.

The code is in `src/lib/risk/rules.ts`. A test checks that every rule cites a source that exists in `src/lib/risk/sources.ts`.

## The shape of every score

```
score = 100 × 0.8 × (weather and season, 0 to 1) × (routine multiplier)
```

- Weather and season on their own can reach 80. The pet's routine decides the last 20 points.
- The routine multiplier is clamped to a minimum and maximum per parasite.
- Each day is scored from the **previous 7 days** of weather (for example, the day's score uses the 7 days up to and including that day), plus that day's month for season.
- With no pet profile, Heedwell assumes garden and park walks and says so.

### Levels

| Level | Score |
| --- | --- |
| Low | under 30 |
| Moderate | 30 to 54 |
| High | 55 to 74 |
| Very high | 75 and over |

The overall level for a day is the highest of that day's threats. Confidence is **low** with no pet profile and **medium** with one. It is never high, because Heedwell has no local case counts.

### What you write yourself is not scored

Each setup question has an "Other" option, and the last step asks whether you have noticed anything about your pet. Whatever you type there (an age in your own words, another place you walk, another habit, something about who lives at home, symptoms, a free-text concern) is **not** used in any score. Heedwell has no rules for it and won't guess.

It is shown back to you on the plan and printed on the vet summary, so your vet sees it. If you tick a symptom that could be an emergency (trouble breathing, collapse or a fit, bleeding), or a short list of similar words appears in what you wrote, the app tells you to call your vet now instead of waiting for a plan. That check is a plain keyword match, so it will miss some wording. It is a safety net, not a triage tool.

## Ticks (dogs and cats)

`conditions = warmth × (0.35 + 0.65 × humidity) × (0.25 + 0.75 × season) × (0.9 + 0.1 × rain)`

| Input | Rule | Source |
| --- | --- | --- |
| Warmth | Number of days in a row with a mean of 7 °C or above, divided by 5 (max 1) | McGinley thesis (7 days in a row at 7 °C or above); PMC9142090 (above 7 °C for about 5 days) |
| Humidity | 7-day mean relative humidity: 55% gives 0, 85% gives 1 | PMC5198687 (humidity above about 80%); Springer Nature (humidity controls questing time) |
| Rain | Rain in the last 3 days, 6 mm or more gives 1 | PMC5198687 (more active after rain) |
| Season | Monthly share of peak: Jan 0.05, Feb 0.20, Mar 0.45, Apr 0.85, May 1.00, Jun 0.95, Jul 0.80, Aug 0.70, Sep 0.60, Oct 0.45, Nov 0.25, Dec 0.08 | GOV.UK (active February to November, with spring and early summer peaks) |
| Routine | Base 0.6; woodland +0.40, fields +0.35, parks +0.20, garden +0.10, hunts +0.10; clamped to 0.6 to 1.25 | Habitat guidance on GOV.UK |

## Fleas (dogs and cats)

`score = 100 × (0.30 + 0.55 × temperature × humidity)`

Fleas have **no routine factor**, because they follow the home and the weather rather than where a pet walks. The score has a **floor of 30**, because central heating lets fleas live and breed indoors all year, and UK guidance is to protect pets year-round.

| Input | Rule | Source |
| --- | --- | --- |
| Temperature | 7-day mean: 0 below 8 °C, rising to 1 at 18 °C, 1 from 18 to 25 °C, falling to 0 at 32 °C | Vet Times; Vet Help Direct (best at 18 to 25 °C) |
| Humidity | 7-day mean: 50% gives 0, 70% gives 1 | Vet Help Direct (70 to 85%) |

## Harvest mites (dogs and cats)

`conditions = season × (0.4 + 0.6 × warm) × (0.6 + 0.4 × dry)`

| Input | Rule | Source |
| --- | --- | --- |
| Season | Jun 0.1, Jul 0.5, Aug 1, Sep 1, Oct 0.8, Nov 0.35, other months 0 | PDSA (July to November) |
| Warm | 7-day mean daily maximum: 8 °C gives 0, 20 °C gives 1 | The Scotsman (warm spells) |
| Dry | 7-day rain: up to 2 mm gives 1, 22 mm or more gives 0 | The Scotsman (warm, dry spells) |
| Routine | Base 0.6; woodland, fields, parks and garden raise it; hunts adds a little; clamped 0.6 to 1.25 | PDSA; VetLexicon (woodland and grassland) |

Cats see harvest mites as well as dogs (FOUR PAWS).

## Lungworm (dogs only)

`conditions = (0.15 + 0.85 × slugs) × (0.7 + 0.3 × season)`, with `slugs = mild × wet`

| Input | Rule | Source |
| --- | --- | --- |
| Mild | 7-day mean temperature: 4 °C gives 0, 12 °C gives 1 | Vet Times; VNJ (April 2026) |
| Wet | 60% rain (15 mm in 7 days gives 1) plus 40% soil moisture (0.25 gives 0, 0.40 gives 1) | Press Association / Scotsman |
| Season | Jan to Mar 0.6, Apr 0.65, May 0.7, Jun 0.8, Jul 0.9, Aug to Oct 1, Nov 0.9, Dec 0.7 | VNJ (highest in late summer and autumn, some risk all year) |
| Routine | Base 0.7; eating slugs or snails +0.4; eating grass +0.2; clamped 0.7 to 1.3 | Vet Times |

Lungworm is not shown for cats.

## What Heedwell does not do

- It does not name products, link to shops or suggest doses.
- It does not diagnose, and it does not replace a vet.
- It does not know about your pet's existing protection or health.
- It does not use local case counts. Where such data is published, it could be added as another signal.

## Weather and place data

- Hourly temperature, relative humidity, rain and soil moisture come from [Open-Meteo](https://open-meteo.com) (CC BY 4.0). They are reduced to one row per day in the Europe/London time zone. The app labels this "Open-Meteo", never "Met Office".
- Postcodes are resolved with [postcodes.io](https://postcodes.io). Full postcodes and outward codes (for example `RG27`) both work.
- Weather is cached for 30 minutes at the edge, and the last good response is kept in the browser so the plan still opens offline, marked as out of date.

## Known limits

- Soil moisture from a weather model is an estimate of the area, not of your garden or walk.
- Thresholds are chosen from published ranges and rounded. They have not been fitted to outcome data.
- A "moderate" week is a prompt to think about protection, not a forecast of what will happen.

If you can improve a rule, open an issue with the source. Every number above is meant to be argued with.
