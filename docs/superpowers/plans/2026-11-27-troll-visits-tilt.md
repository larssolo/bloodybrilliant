# Trolden, besøg og bevægelsessensor: implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trolden følger med gennem kapitel I–III, siden ændrer sig efter kalender, klokkeslæt og antal besøg, og mobilen kan vippes og rystes.

**Architecture:** Den rene logik ligger i et lille nyt script, `assets/bb-memory.js`, som indlæses før hovedscriptet og kan testes i Node:
- sæson og nat
- besøgshukommelse
- replikvalg
- hældning
- rystelsesdetektor
- test-parametre

Alt der tegnes, bliver i `index.html` i den eksisterende stil: canvas-funktioner, `S`-state og `W0`-verden. Visuelle trin verificeres med headless Edge-skærmbilleder via test-parametre.

**Tech Stack:** Vanilla JS, Canvas 2D, Web Audio (eksisterende `snd()`), DeviceOrientation/DeviceMotion, `node --test` (Node 24, ingen afhængigheder).

**Spec:** `docs/superpowers/specs/2026-11-27-troll-visits-tilt-design.md`

## Global Constraints

- Ingen build og ingen npm-afhængigheder. Siden skal stadig kunne serveres statisk.
- UI-tekst og replikker på engelsk, præcis som angivet nedenfor.
- localStorage-nøgle `bb-visit`. Alle læsninger og skrivninger i try/catch, og siden virker uændret, hvis storage fejler.
- Lokal tid på enheden. Perioder:
  - jul 1.–26. december
  - nytår 31. december – 1. januar
  - halloween 25.–31. oktober
  - nat kl. 21:00–05:59
- Test-parametre: `?dato=YYYY-MM-DD`, `?time=H`, `?besoeg=N`, `?tilt=x,y`. De påvirker kun visningen og skriver aldrig til localStorage.
- `prefers-reduced-motion` (eksisterende `reduce`): halv hældningseffekt, og rystelse slår ikke kaos til.
- Børnetilstand (`S.kid`) er standard. Trolden må ikke tegnes i kapitel IV–VII.
- Kodestil som omgivelserne: korte navne, kompakte linjer, kommentarer i samme sparsomme tæthed.

## Review Focus

1. **Same-day reload:** en replik vises kun ved et nyt dagsbesøg. Genindlæsning samme dag viser ingen boble, men tilbehør (halstørklæde osv.) er der stadig. Test i Task 1: `recordVisit` samme dag giver `isNewDay: false`, og `pickLine` returnerer `null`.
2. **localStorage blokeret eller korrupt** (privat vindue, gammel JSON-streng): siden skal starte som førstegangsbesøg uden fejl. Test i Task 1: `recordVisit` med `prev = 'garbage'` behandles som `null`.
3. **iPhone afslår eller ignorerer bevægelsestilladelsen:** der må ikke komme flere prompts, og intet må gå i stykker. Tjek i Task 6: tilladelse spørges højst én gang pr. sidevisning, og ved afslag sættes `TILT.off`.
4. **Liggende telefon:** når skærmen er roteret, skal hældningen stadig føles som "ned". Test i Task 1: `tiltFromOrientation` med skærmvinkel 90 og −90.
5. **Baglæns scroll gennem III → II → I og i børnenes portal:** trolden må ikke blinke, dukke op dobbelt eller forsvinde. Tjek i Task 4: skærmbilleder ved `p` = 2.25, 2.35, 3.25 og 7.9.

---

### Task 1: `assets/bb-memory.js`, den rene logik

**Files:**
- Create: `assets/bb-memory.js`
- Test: `tests/bb-memory.test.js`

**Interfaces:**
- Produces (på `window.BBMemory` og `module.exports`):
  - `season(d: Date) -> 'xmas' | 'newyear' | 'halloween' | null`. Nytår vinder over jul den 31.12.
  - `isNight(hour: number) -> boolean`, sand for `hour >= 21 || hour < 6`.
  - `dayKey(d: Date) -> 'YYYY-MM-DD'` i lokal tid.
  - `recordVisit(prev: any, today: string) -> { n, first, last, gapDays, isNewDay }`:
    - ugyldig `prev` giver `{ n: 1, first: today, last: today, gapDays: 0, isNewDay: true }`
    - samme dag: `n` uændret, `isNewDay: false`
    - ny dag: `n + 1`, `gapDays` = antal dage siden `last`
  - `unlocks(n: number) -> { scarf: n >= 2, baby: n >= 3, whale: n >= 4, crown: n >= 5 }`
  - `pickLine({ n, isNewDay, gapDays, season, night, date }) -> string | null`. Første regel, der passer, vinder:
    1. `!isNewDay || n < 2` giver `null`
    2. jul 24.–26.: `"Merry Christmas!"`; jul ellers: `"It's snowing! I got a hat."`
    3. nytår: `"Happy New Year!"`
    4. halloween: `"Boo! Did I scare you?"`
    5. nat: `"Shouldn't you be asleep?"`
    6. `gapDays > 30`: `"Long time no see!"`
    7. besøg:
       - n = 2: `"You came back!"`
       - n = 3: `"Third time! I brought a friend."`
       - n = 4: `"I named the whale. It's Gertrud."`
       - n = 5: `"Five visits. You get a crown."`
       - n ≥ 6: `ROTATE[(n - 6) % ROTATE.length]` med `ROTATE = ["Back again? Good.", "The moose says hi.", "I saved you a snowflake.", "Gertrud sang about you.", "Shh. The mountains are napping."]`
  - `tiltFromOrientation(beta: number, gamma: number, angle: number) -> { x, y }`, begge klemt til [−1, 1]:
    - `x = gamma / 35`, `y = (beta - 40) / 35`
    - drej med `angle` (0, 90, −90, 180), så "ned" følger skærmen
  - `makeShake(thresh = 17, coolMs = 2000) -> (ax, ay, az, tMs) => boolean`. Sand når `hypot(ax, ay, az) > thresh` og der er gået mindst `coolMs` siden sidste sande. Bruger acceleration uden tyngdekraft.
  - `overrides(search: string) -> { date: Date | null, hour: number | null, visit: number | null, tilt: { x, y } | null }`, fra `dato`, `time`, `besoeg`, `tilt`. Ugyldige værdier giver `null`.

- [ ] **Step 1: Write the failing tests** i `tests/bb-memory.test.js` med `node:test` og `node:assert/strict`, ét `test()` pr. punkt:
  - `season`: 2026-12-01 → `'xmas'`; 2026-12-26 → `'xmas'`; 2026-12-27 → `null`; 2026-12-31 → `'newyear'`; 2027-01-01 → `'newyear'`; 2027-01-02 → `null`; 2026-10-25 → `'halloween'`; 2026-10-24 → `null`
  - `isNight`: 21 → true, 5 → true, 6 → false, 20 → false
  - `recordVisit`:
    - `(null, '2026-11-27')` → n 1, isNewDay true
    - `('garbage', …)` → samme som null
    - samme dag → n uændret, isNewDay false
    - `{n:2, last:'2026-10-01'}` med today `'2026-11-27'` → n 3, gapDays 57
  - `unlocks(4)` → scarf, baby og whale true; crown false
  - `pickLine`:
    - n 1 → null; isNewDay false → null
    - jul 2026-12-24 n 3 → "Merry Christmas!"
    - nat og n 2 uden sæson → "Shouldn't you be asleep?"
    - gapDays 40, n 3, dag → "Long time no see!"
    - n 3 → "Third time! I brought a friend."
    - n 6 → "Back again? Good."; n 11 → "Back again? Good."
  - `tiltFromOrientation`:
    - (40, 0, 0) → {0, 0}
    - (40, 35, 0) → x 1
    - (40, 35, 90) → y ≈ ±1 og x ≈ 0
    - (40, 200, 0) → x 1 (klemt)
  - `makeShake`:
    - (0, 0, 20, 0) → true; (0, 0, 20, 500) → false; (0, 0, 20, 2600) → true
    - (0, 0, 5, 5000) → false
  - `overrides('?dato=2026-12-24&time=23&besoeg=4&tilt=0.5,-1')` → date er 24.12, hour 23, visit 4, tilt {0.5, −1}
  - `overrides('?time=99')` → hour null

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/`
  Expected: FAIL, "Cannot find module '../assets/bb-memory.js'"

- [ ] **Step 3: Implement `assets/bb-memory.js`**
  - Én IIFE, der sætter `window.BBMemory` i browseren og `module.exports` i Node.
  - Datoer i lokal tid via `getFullYear/getMonth/getDate`.
  - `gapDays` = `Math.round` af forskellen mellem to lokale midnatter.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test tests/`
  Expected: alle tests PASS

- [ ] **Step 5: Commit** med `git add assets/bb-memory.js tests/bb-memory.test.js` og beskeden "Visit memory, seasons, tilt and shake logic"

---

### Task 2: Besøg, sæson og troldens boble ind i siden

**Files:**
- Modify: `index.html`:
  - `<head>`: script-tag før hovedscriptet
  - CSS: ny `.un-say`
  - markup ved `data-pop`
  - hovedscriptet: nær `S`-init (ca. linje 237) og `typo`/tagline (ca. linje 479)
- Create: `tests/shots.ps1`, et skærmbilledscript til visuelle tjek

**Interfaces:**
- Consumes: `BBMemory.*` fra Task 1
- Produces i hovedscriptet:
  - `MEM = { season, night, n, un, line }`, hvor `un` = `unlocks(n)`. Overrides vinder over ægte dato, time og besøg.
  - `say(text: string, ms = 4000)` viser boblen. `sayHide()` skjuler den.

- [ ] **Step 1:** Opret `tests/shots.ps1`:
  - parametre `-Query` (streng), `-Name` og `-Size` (standard `1280,760`)
  - kører headless Edge mod `http://localhost:5179/?<Query>` med `--virtual-time-budget=6000`
  - gemmer i `$env:TEMP\bb-shots\<Name>.png`
  - start serveren med `npx -y serve -l 5179 .`

- [ ] **Step 2:** Tilføj script-tagget for `assets/bb-memory.js` og beregn `MEM` ved start:
  - Læs `bb-visit` i try/catch og kald `recordVisit`.
  - Gem kun, når der ikke er nogen `besoeg`-override.
  - Med `besoeg=N`: `n = N`, `isNewDay = true`, `gapDays = 0`.

- [ ] **Step 3:** Tilføj `.un-say`:
  - samme bobleudtryk som `.un-pop .bub` (creme, mørk kant, orange skygge)
  - placeret over trolden i kapitel I; positionen sættes fra `W0.troll.hit` hver frame, mens boblen er synlig
  - `aria-live="polite"`, `pointer-events: none`
  - fader ud efter `ms`, eller når `S.sv` > 0.05

- [ ] **Step 4:** Kald `say(MEM.line)` 1,8 s efter start, når `MEM.line` ikke er null, lyd-pop-uppen ikke vises, og `S.P < 0.5`.

- [ ] **Step 5:** I jul sættes taglinen (`[data-tag]`) til `A LITTLE BIT NORDIC. A LOT OF SNOW.`

- [ ] **Step 6: Verify**
  - Kør `node --test tests/` (PASS).
  - Tag skærmbilleder med `-Query 'besoeg=2&p=0.3'` og `-Query 'dato=2026-12-24&besoeg=3&p=0.3'`.
  - Forventet: boblen med "You came back!", henholdsvis "Merry Christmas!" og jul-taglinen.
  - `-Query 'p=0.3'` uden parametre i et rent headless-vindue: ingen boble.

- [ ] **Step 7: Commit** med beskeden "Troll remembers visits: speech bubble, seasonal tagline"

---

### Task 3: Troldens figur og tilbehør, og den følger hele kapitel I

**Files:**
- Modify: `index.html`: `drawTroll` (ca. linje 1746) og `genNorth2` (ca. linje 1715)

**Interfaces:**
- Consumes: `MEM`
- Produces: `trollFig(x, y, r, t, o)`, som tegner trolden i et lokalt koordinatsystem omkring (x, y) med radius r.
  - `o = { look: [lx, ly], bl, jump, hat, scarf, crown, prop, wave }`
  - `hat`: `'santa' | 'party' | 'night' | null`
  - `prop`: `'lantern' | 'pumpkin' | null`
  - `wave`: 0..1, armen vinker
  - `drawTroll` bliver en tynd wrapper om `trollFig`.

- [ ] **Step 1:** Udtræk kroppen fra `drawTroll` til `trollFig` uden visuel ændring. Verificér med `-Query 'seed=7&p=0.3'` før og efter: billederne skal være ens.
- [ ] **Step 2:** Tilføj tilbehør til `trollFig`:
  - **nissehue:** rød med hvid kant og kvast; kvasten svinger med `t`
  - **papirhat:** stribet kegle
  - **nathue:** blå med prik, vipper; munden er et gab (oval), hver 3–5 s
  - **halstørklæde:** orange, med to flagrende ender
  - **guldkrone:** tre takker
  - **`prop`:** lanterne i strakt arm (`lantern` = varm gul glød via radial gradient; `pumpkin` = orange med udskåret ansigt)
  - **`wave`:** en arm, der svinger
  - Hatten vælges fra sæson og ur: `xmas → santa`, `newyear → party`, `night → night`, `halloween → prop 'pumpkin'`.
- [ ] **Step 3:** Ændr synligheden i kapitel I fra "ud ved 0.5–0.56" til "ud ved 0.93–1.0". Ved `s > 0.93` hopper trolden op og ud af toppen (`tr.up` med `backOut`), så den forlader kapitlet i hop.
- [ ] **Step 4:** Ved `MEM.un.baby` tegnes en troldeunge (`trollFig` med `r * 0.55`) ved siden af trolden. Den hopper forsinket efter den store.
- [ ] **Step 5: Verify** med skærmbilleder:
  - `dato=2026-12-10&p=0.3`: nissehue
  - `time=23&p=0.3`: nathue
  - `besoeg=5&p=0.3`: halstørklæde, unge og krone
  - `besoeg=1&p=0.8`: trolden er stadig synlig ved 0.8
  - `p=1.05`: trolden er ude
- [ ] **Step 6: Commit** med beskeden "Troll figure with seasonal hats, scarf, crown and a baby troll; stays through chapter I"

---

### Task 4: Troldens rejse gennem II og III, portalen og farvellet

**Files:**
- Modify: `index.html`:
  - `drawSky` (ca. linje 714) og `whaleSing`
  - `drawWoods` og `lanterns` (ca. linje 837–960)
  - `kidPortal` (ca. linje 2385)
  - `drawPrism` (ca. linje 2293)
  - klikhåndtering pr. kapitel (`chapterSurprise`/klik-switch ca. linje 1539)

**Interfaces:**
- Consumes: `trollFig`, `MEM`
- Produces: `W0.tj = { j: 0, x, y, vx, wave: 0, drop: 0, run: 0 }`, troldens tilstand i II/III. Nulstilles i `genNorth2`.

- [ ] **Step 1: II.** Trolden hænger i tentaklerne under vandmanden `W0.jellies[W0.tj.j]`:
  - Den tegnes efter vandmanden i samme alfa (`A`), med radius `u * 0.05` og armene op.
  - `whaleSing` sætter `W0.tj.wave = 1`; den falder med `Math.pow(0.3, dt)`.
  - Klik inden for trolden skifter `j` til nærmeste anden vandmand med en lille hop-bue (0,6 s) og `snd('giggle')`.
- [ ] **Step 2: III.** Trolden går på skovbunden (y = `H * 0.86`) med `prop: 'lantern'`, eller `'pumpkin'` i halloween:
  - Lanternen har sin egen glød, der ikke slukker.
  - x går mod cursoren med maks `W * 0.12` pr. sekund; uden cursor går den langsomt mod midten.
  - Når skovens lanterner er slukket (`q3 > 0.6`), øges glødens radius × 1,6.
- [ ] **Step 3: Voksne.** Når `P` går fra 3.2 til 3.36:
  - `drop` går 0 → 1: lanternen falder og bliver liggende.
  - `run` går 0 → 1: trolden løber ud til nærmeste kant.
  - Lanternens glød slukker ved 3.36.
  - Ved baglæns scroll reverseres begge, da de er ren funktion af `P` og ikke af events.
- [ ] **Step 4: Børn.** I `kidPortal(k)`, ved `k < 0.4`:
  - Trolden står midt i billedet og løfter lanternen.
  - Portalens centrum er lanternens position.
  - Ved `k > 0.4` skrumper trolden ind i lyset.
  - I `drawPrism`, ved `q8` 0–0.12: trolden kigger op fra nederste venstre hjørne og vinker (`wave: 1`), derefter dykker den ned.
- [ ] **Step 5: Sæson i III.**
  - **Jul:** lanternernes farver skifter mellem `#d6312b` og `#2f8f4e`.
  - **Halloween:** lanternerne tegnes som græskar (orange oval med trekantøjne). Genbrug lanternens svingning og slukning.
- [ ] **Step 6: Hvalens navn.** Ved `MEM.un.whale` tegnes "GERTRUD" i små stjerneprikker langs hvalens ryg i II, med samme glimt som stjernerne.
- [ ] **Step 7: Verify** med skærmbilleder:
  - `p=1.5`: trolden i vandmanden
  - `p=2.5` og `p=2.9`: trolden med lanterne, stort lys i mørket
  - `mode=adult&p=3.3`: lanternen tabt, trolden på vej ud
  - `p=7.9` (børn): trolden i portalen
  - `p=8.0`: trolden vinker i Prism
  - `besoeg=4&p=1.6`: GERTRUD
  - `dato=2026-10-30&p=2.6`: græskar
  - Review Focus 5: `p=2.25`, `2.35`, `3.25` og `7.9`, ingen dobbelt trold
- [ ] **Step 8: Commit** med beskeden "Troll travels through II and III: jellyfish ride, lantern guide, rainbow portal, goodbye"

---

### Task 5: Sæson i verden: sne og fyrværkeri

**Files:**
- Modify: `index.html`:
  - `genNorth2` og `drawSnowZzzFireworks` (ca. linje 1878)
  - `drawSky`

**Interfaces:**
- Consumes: `MEM.season`
- Produces: intet nyt for andre tasks

- [ ] **Step 1: Jul.**
  - Kapitel I: snemængden fra 150 til 260 flager, og sneen er synlig fra kapitlets start, ikke kun om natten.
  - Kapitel II: 60 små flager med alfa 0.5.
- [ ] **Step 2: Nytår.** Når `N > 0.6` (nat i I), affyres eksisterende fyrværkeri af sig selv hvert 0,8–1,6 s på tilfældige punkter i øverste halvdel.
- [ ] **Step 3: Verify** med skærmbilleder: `dato=2026-12-10&p=0.2` (sne om dagen), `dato=2026-12-31&p=0.9` (fyrværkeri uden klik) og `p=0.2` (normal, ingen dagsne).
- [ ] **Step 4: Commit** med beskeden "Christmas snow and New Year fireworks"

---

### Task 6: Vip og ryst på mobilen

**Files:**
- Modify: `index.html`:
  - nær `gesture` (ca. linje 1960)
  - `frame` (ca. linje 2776)
  - `drawSky`, `lanterns`, `drawPrism`-bobler og `drawMulti` (ca. linje 2632 og 2657)

**Interfaces:**
- Consumes: `BBMemory.tiltFromOrientation`, `BBMemory.makeShake`, `rollChaos`, `MEM`/overrides
- Produces: `TILT = { x: 0, y: 0, tx: 0, ty: 0, on: false, off: false, asked: false }`. `TILT.x` og `TILT.y` er udglattede værdier i [−1, 1], som alle kapitler læser.

- [ ] **Step 1: Tilladelse.**
  - Ved første `touchend` eller `click` på `root` (eget listener, `{ once: true }`, uafhængigt af `AU.asked`): hvis `DeviceOrientationEvent.requestPermission` findes, kaldes den én gang.
  - `'granted'` slår listeners til; alt andet sætter `TILT.off = true`.
  - Uden `requestPermission` slås listeners til med det samme, men kun på touch-enheder (`matchMedia('(pointer: coarse)')`).
- [ ] **Step 2: Lyt.**
  - `deviceorientation` sætter `TILT.tx/ty` via `tiltFromOrientation(beta, gamma, screen.orientation?.angle ?? window.orientation ?? 0)`.
  - `devicemotion` fodrer `makeShake()` med `e.acceleration`. Ved sand og uden `reduce` kaldes `rollChaos()`.
  - `?tilt=x,y` sætter `tx/ty` fast og `on = true` til test.
- [ ] **Step 3: Udglat** i `frame`:
  - `TILT.x += (TILT.tx * k - TILT.x) * min(1, dt * 4)`, med `k = reduce ? 0.5 : 1`.
  - Læg `TILT.x * 1.6` til `S.wind` hver frame, mens `TILT.on`. Det flytter sne, skyer, blade og lanterner, der allerede læser `S.wind`.
- [ ] **Step 4: Pr. kapitel.**
  - **II:** vandmændenes x forskydes `TILT.x * W * 0.06`, og deres stigefart ændres med `-TILT.y * 0.3`.
  - **III:** lanternernes `va += TILT.x * 1.2 * dt`.
  - **Prism:** boblernes `vx += TILT.x * 140 * dt`, og hestenes svæv-offset forskydes `TILT.y * u * 0.03`.
  - **Multiverset:** frie figurer får `vx += TILT.x * H * 1.6 * dt` og konfetti `vx += TILT.x * 240 * dt`.
  - **Trolden i I:** hælder `TILT.x * 0.25` radianer.
- [ ] **Step 5: Verify**
  - Skærmbilleder: `tilt=1,0&p=0.9` (sneen driver mod højre i forhold til `tilt=-1,0&p=0.9`), `tilt=1,0&p=1.5` og `tilt=1,0&p=9.8`.
  - Kør `node --test tests/` (PASS).
  - Manuelt på telefon: vip, ryst, og afslå på iPhone.
- [ ] **Step 6: Commit** med beskeden "Tilt and shake on phones: the world leans, a shake brings chaos"

---

### Task 7: Dokumentation og udrulning

**Files:**
- Modify: `README.md`:
  - tabellen for kapitel I–III: trolden
  - nyt afsnit "Fra besøg til besøg"
  - "Styring": vip og ryst
  - URL-parametre: `dato`, `time`, `besoeg`, `tilt`
  - "Filer": `assets/bb-memory.js`, `tests/`
- Modify: `about.html` og `llms.txt`: én sætning hver om, at trolden følger dig og husker dig, at siden skifter med årstiderne, og at telefonen kan vippes

- [ ] **Step 1:** Opdatér de tre filer i samme tone som eksisterende tekst.
- [ ] **Step 2: Verify**
  - Kør `node --test tests/` (PASS).
  - Lav en fuld runde skærmbilleder fra Task 2–6.
  - Ingen fejl i konsollen: kør Edge headless med `--enable-logging=stderr --v=0` og find "Uncaught".
- [ ] **Step 3: Commit, push, PR og merge** (brugeren har godkendt PR og merge i denne session). Tjek bagefter https://www.bloodybrilliant.xyz/?besoeg=3&p=0.3 live.
