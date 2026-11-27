# Trolden, besøg og bevægelsessensor: design

## Hvorfor

Siden er fuld af ting, der reagerer, men den er den samme hver gang. Lars vil give folk (især børn) en grund til at komme igen og noget at dele: siden skal ændre sig fra besøg til besøg. De første kapitler skal bindes sammen af en figur, og mobilen skal bruges som mere end en skærm.

## Mål

1. **Trolden som følgesvend gennem kapitel I–III.**
2. **Besøg der ændrer sig:**
   - kalender og ur (højtider, nat)
   - en trold der husker dig og viser noget nyt for hvert besøg
3. **Bevægelsessensor på mobil:** vip for at påvirke verden, ryst for kaos.

## Ikke-mål

- Ingen konti, ingen server og ingen sporing. Al hukommelse ligger i browserens localStorage, og siden virker som før, hvis den er tom eller blokeret.
- Ingen sjældne tilfældige hændelser (mulighed 3 er valgt fra for nu).
- Ingen ændringer i de mørke kapitler IV–VII ud over at trolden forlader scenen før dem.

## Anti-mål (fejl, selv hvis det teknisk virker)

- At trolden står i vejen: den må ikke dække klikbare ting eller blokere scroll.
- Snakkebobler, der kommer for tit eller kræver klik for at forsvinde.
- At siden bliver tungere eller hakker på mobil.
- At iPhone-tilladelsen til bevægelse dukker op som en irriterende prompt før brugeren har rørt siden.

## Begrænsninger

- Alt ligger i `index.html` uden build. Ny kode skrives i samme stil som den eksisterende: korte funktioner tegnet på 2D-canvas, `S`-state, `W0`-verden og `snd()`-lyde.
- Børnetilstand er standard. Trolden følger børnenes rute (I → II → III → regnbueportal → Prism) og voksnes rute (I → II → III → mørke).
- `prefers-reduced-motion` dæmper sensor-effekter og hop.
- UI-tekst er engelsk, som resten af siden.

## Tilgange

1. **Trolden som overlag (HTML/CSS, ligesom lyd-pop-uppen).** Den er let at bygge og let at give snakkebobler, men den lever uden for canvas-verdenen og kan ikke svæve i en vandmand eller bære en lanterne i dybden. **Fravalgt.**
2. **Trolden tegnet i canvas, med snakkebobler som HTML (valgt).** Vi genbruger den eksisterende `drawTroll`, får den med i hvert kapitels tegning og bruger samme boble-stil som lyd-pop-uppen til korte replikker. Den passer ind i parallakse og filmlook.
3. **Alt i canvas inklusive tekst.** Det er mest konsistent, men tekst i canvas er dårlig for skærmlæsere og sværere at style. **Fravalgt.**

## Design

### 1. Trolden gennem I–III

**Fælles:** én troldfigur (`drawTroll` generaliseres med position, skala og rekvisit: lanterne, vandmand eller hat). Den kigger stadig efter musen, blinker og fniser ved klik.

**Kapitel I:**
- Som nu bag bakken.
- Når kapitlet slutter, hopper den op og ud af billedet i samme retning som kameraet.
- Den bliver ikke væk midtvejs: den er synlig fra 0,15 af kapitlet til overgangen.

**Kapitel II:**
- Trolden hænger under en vandmand og driver langsomt over skærmen.
- Når hvalen synger (eksisterende beat), vinker den.
- Et klik får den til at slippe og gribe en ny vandmand.

**Kapitel III:**
- Trolden går nederst i skoven med sin egen lanterne, som aldrig slukker.
- Når skovens lanterner slukker, er dens lys det eneste, og musen kan "lede" den (den går mod cursoren i x).
- **Børn:** ved portalen løfter trolden lanternen, og lyset bliver til regnbueportalen. Den hopper med ind, kigger kort frem i starten af Prism og vinker farvel.
- **Voksne:** lige før Sunfall taber den lanternen, ser forskrækket op og løber ud af billedet. Lanternen bliver liggende og slukker.

**Baglæns scroll:** trolden følger med tilbage, så den aldrig "springer".

### 2. Kalender og ur (lokal tid på enheden)

| Periode | Hvad sker der |
|---|---|
| 1.–26. december | Nissehue på trolden. Mere sne i kapitel I og let sne i II. Taglinen bliver **A LITTLE BIT NORDIC. A LOT OF SNOW.** Lanternerne i III er røde og grønne julelys. |
| 31. december – 1. januar | Fyrværkeri af sig selv på nattehimlen i kapitel I, uden klik. Trolden har en papirhat. |
| 25.–31. oktober | Halloween: lanternerne i III er græskar, og trolden har en græskarlanterne. |
| Kl. 21–06 lokal tid | Trolden har nathue og gaber. Første replik: *"Shouldn't you be asleep?"* |

`?dato=2026-12-24` og `?time=23` overstyrer dato og klokkeslæt til test.

### 3. Den husker dig (localStorage `bb-visit`: antal, første og sidste besøg)

Et besøg tæller én gang pr. kalenderdag. Trolden siger én kort replik i en boble ved starten af kapitel I. Boblen forsvinder af sig selv efter ca. 4 sekunder eller ved scroll. Første besøg har ingen replik, fordi lyd-pop-uppen allerede taler.

| Besøg | Replik og nyt |
|---|---|
| 2 | *"You came back!"* Trolden har fået et halstørklæde, som den beholder. |
| 3 | *"Third time! I brought a friend."* En lille troldeunge følger med i kapitel I. |
| 4 | *"I named the whale. It's Gertrud."* Hvalen får et navn i stjernebilledet i II. |
| 5 | *"Five visits. You get a crown."* Trolden har en guldkrone i I–III. |
| 6+ | Skifter mellem korte replikker. Kronen og ungen bliver. |
| Væk i mere end 30 dage | *"Long time no see!"* i stedet for den normale replik. |

Kalender og ur vinder over besøgsreplikken (fx juleaften: *"Merry Christmas!"*). Kun én replik pr. besøg.

### 4. Bevægelsessensor (kun på enheder med sensor)

- **Tilladelse:** på iPhone bedes der om tilladelse i det første tryk, der allerede låser lyden op. Siger man nej, sker der intet mere. Android kræver ingen tilladelse.
- **Vip:** en udglattet hældning i x og y bruges som "vind":
  - kapitel I: sne og trold
  - kapitel II: vandmænd
  - kapitel III: lanterner
  - Prism: bobler og hestenes svæv
  - multiverset: tyngdekraftens retning
- **Ryst:** en kraftig rystelse slår kaos til (samme som trekant-knappen), højst én gang hvert andet sekund.
- **Reduceret bevægelse:** effekten halveres, og rystelse slår ikke kaos til.

## Overladt til den, der bygger

- Præcise positioner, timing og animationskurver, så det passer med det, der allerede er der.
- Tegningen af hue, halstørklæde, krone, unge og græskar, i samme stil som trolden.
- Lyde til nye hændelser bygges med de eksisterende `snd()`-syntheser.

## Test

- Kør med `?dato=` og `?time=` for hver periode.
- Ryd localStorage og simulér besøg 1–6 og "30 dage væk".
- Børne- og voksentilstand, frem og tilbage gennem I–III og videre.
- Mobil (Android og iPhone): vip, ryst og afslået tilladelse.
- Tjek, at forsiden ikke hakker mere end før.
