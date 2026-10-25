# What to test next at Cashify

Files in `docs/next-quotes/` (regenerate with `npm run pricing-evidence:plan`; the plan reads the repository catalog and the committed calibration, so it stays current):

| file | content |
|---|---|
| `iphone12_13_plan.csv` | **400 quotes** for the 26 iPhone 12 / 13 catalog variants, each row saying exactly what that quote teaches the model |
| `existing_models_gaps.csv` | ranked extra quotes for the 19 iPhone models already collected (parameters still borrowed from sibling models, unmeasured interactions, price drift) |

## Why these quotes and not more of the same

Today's data has ~2,160 unique conditions, but they are ~30 *shapes* repeated across storages and models. The model needs different information:

1. **Singles.** Outside the iPhone 18 Pro Max 2 TB, individual deductions are only known as sums (front + rear camera together, display spots + lines + discoloration together). A new variant gets its anchors from *single* answers, so each anchor class needs one quote of its own.
2. **Interactions.** The rules (age applied once, largest screen fault wins, body shares with panel, Wi-Fi overlaps Bluetooth, floor only when aged) were each seen on one model's pairs. Each needs one confirming probe on the new generation.
3. **Scaling.** Whether a deduction is fixed rupees or a share of the price is only visible when the *same* answers are quoted on two storages of one model.
4. **The questionnaire itself.** Which questions Cashify shows (warranty, bill, age, box, charger, eSIM, battery) changes between generations; the first quote of every variant records it.

## The iPhone 12 / 13 plan (400 quotes)

| phase | quotes | what |
|---|---:|---|
| 0 baseline + questionnaire probe | 26 | one flawless quote per catalog variant; write down every question that appears |
| 1 identification set | 248 | on each of the 8 models' **middle storage**: 5 age/ownership cases (A01-A03, warranty No, bill No), 16 single anchors (display D01, cracked glass S01, touch Q02, non-original screen Q03, body C04, panel P01, Wi-Fi F05, Face ID F08, **front camera alone F01, rear camera alone F02**, speaker F06, volume F03, battery F17, battery F18, box missing, dual eSIM), 9 interaction probes (Wi-Fi + Bluetooth; cracked glass + spots; spots + screen scratches; body + panel; panel + cracked glass; body + cracked glass; touch + Wi-Fi; two cameras; the nine-fault mix) and a closing flawless repeat |
| 2 storage scaling | 126 | 7 quotes on each of the 18 other variants: age over 11 months, Wi-Fi, Face ID, display spots, cracked glass, body dents, two cameras |

Run phase 0 first for **all 26** variants; if a flow lacks a question, the "only if" column marks the cases to skip and the reserve is the same-class single from `existing_models_gaps.csv`.

Recording rules (these are what made the current data usable):
- the exact answer set as the form shows it, **including "Not shown"** for questions that did not appear - never leave a blank that could be mistaken for "No";
- headline selling price, base price, IMEI fee, processing fee and total, and the date and time;
- one case at a time, in the order of the CSV, with the flawless baseline repeated at the end of each session (this exposes price drift inside a session);
- do not copy a result from another storage or model, and do not average repeats.

## How to judge the 400 quotes (fixed now, before they are collected)

Treat the iPhone 12 / 13 collection as the **blind test of the method**. Before fitting anything, hold back the phase-2 quotes and the interaction probes of two chosen models. Then:

1. Fit the new models on the rest and predict the held-back quotes with `npm run pricing-evidence:validate` (protocols 1 and 2).
2. A model may be enabled only if it meets the same thresholds as the current models: median error <= 1.0%, p90 <= 5%, p95 over-quote <= 3%, worst over-quote <= 10% of the price, mean error at most half the existing engine's, at least 100 held-out quotes over at least 10 shapes, at most 15% declined.
3. If the structure (not just the numbers) fails on the older generation - for example age is not applied once, or the floor is a different kind of plateau - that is the finding; do not tune the thresholds.

## Highest-value additions for the models already collected

From `existing_models_gaps.csv` (priority 1 first):

- **Touch screen not working** and **cracked glass** *alone*, and **battery in service alone**, on every model where they are inferred. Touch-failure combinations are the weakest region: they decide the floor and were seen as five shapes per model, all in combination.
- **Front camera alone / rear camera alone** on the 16 and 17 families (the deduction of each camera is only known summed).
- **Functional + physical pairs** on the iPhone 18 Pro Max 2 TB (the pair plan stopped at 160 of 764; the 604 untested include every functional x screen/body/panel pair, so additivity across those groups is supported only by the multi-fault checklist shapes).
- **Pairs with the basic-condition answers** (calls, touch, non-original screen), which the pair plan excluded.
- **Larger combinations** (3-5 faults built from the confirmed rules): only ~2 measured shapes have more than 5 faults.
- **A repeat of the flawless baseline and five anchors one week later** on two models, to measure how fast Cashify's own tables move (all current data spans 16-24 Oct; the Get Upto moved ~1% in one week).
- Models kept on the existing engine because they missed a threshold (iPhone 15, 15 Plus, 15 Pro Max, 16 Pro, 17 Pro Max, 17e) need the same single anchors first; iPhone 15 Pro Max has only one 512 GB variant of 24 quotes.
