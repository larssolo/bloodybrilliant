# Bloody Brilliant — en endeløs fortælling

En scroll-styret, interaktiv fortælling i seks kapitler. Den starter som et pastel-eventyr, bliver mørkere undervejs og ender i blæk. Når du scroller forbi slutningen, bliver verden genfødt med et nyt seed, og fortællingen begynder forfra. Den slutter aldrig.

| | Kapitel | Hvad sker der | Klik / tryk |
|---|---|---|---|
| I | **The Unreal North** | Dag → solnedgang → nat med nordlys. Bjerge morfer, blomster vokser, floden følger scrollfarten. Til sidst dykker kameraet op i himlen. | Kaster kugler, får blomster til at eksplodere |
| II | **The Singing Sky** | Warp-stjerner (scroll = flyv frem), nordlys der bøjer mod musen, en hval af stjernebilleder der synger, vandmænd. | Ny vandmand; klik på hvalen får den til at synge |
| III | **Lantern Woods** | Parallaks-skov med lysende svampe og lanterner, der svinger efter musens fart. Lanternerne slukker én efter én, og øjne åbner sig i mørket. | Slipper en sværm af møl løs, som følger musen |
| IV | **Sunfall** | Solen styrter op, himlen brænder ravgul, det regner med blæk (musen er en paraply), og en ravn krydser solen. | Blæksprøjt |
| V | **Bloody Brilliant** | En ravn af blæk dykker ned foran kæmpebogstaver, der drypper med blod. Vingen opløses i røg med en brændende kant, og musen river fjer løs. | Ravnen eksploderer til blæk og samler sig igen |
| VI | **The Ink** | Blækket opsluger alt, og et ravøje åbner sig og følger dig. *Again?*, og så genfødes verden. | Øjet blinker |

Undervejs er der "beats", der udløses, når du scroller fremad forbi dem: hvalen synger, stjerneskud, et vindstød slukker lanterner, ravnen lander og eksploderer.

## Kør den

Ingen build og ingen afhængigheder. Det eneste eksterne er Google Fonts.

- **Vercel:** importér repoet som et statisk projekt (ingen framework, ingen build-kommando, output = roden).
- **Lokalt:** `npx serve .`

`index.html` kan også åbnes direkte via `file://`, men så må browseren ikke bruge ravnebilledet som WebGL-tekstur, og ravnen falder tilbage til en 2D-version uden shader-effekter.

### URL-parametre

- `?seed=1234` låser verdenen (0 eller ingen giver en ny ved hver reload)
- `?energi=1.5` styrer bevægelsesintensiteten (0.3–2)
- `?kapitel=5` starter i et bestemt kapitel (1–6)
- `?p=4.8` starter på et præcist punkt i fortællingen (0–6)

### Styring

- **Scroll / swipe** driver fortællingen. **Piltaster, PageUp/PageDown, mellemrum, Home** virker også.
- **Kapitel-skinnen** til højre hopper direkte til et kapitel.
- **Trackpad, vandret swipe** giver vind.
- `prefers-reduced-motion` dæmper bevægelse og rystelser.

## Teknik

- Én `<canvas>` (2D) tegner alle kapitler. Kun de kapitler, der er synlige, bliver tegnet, og hvert nyt kapitel fader ind over det forrige.
- Ravnen renderes med en lille WebGL-shader (vingeslag, bølgende røg, støjbaseret opløsning med blodrød brændekant og et hul ved musen), som tegnes ind i 2D-canvasset. Hvis GPU-stien er for langsom på en enhed (under ca. 22 fps), skifter den automatisk til 2D.
- Blækpartiklerne bruger 2400 punkter, som er forudberegnet fra ravnens silhuet og indlejret i `index.html`. Siden læser derfor aldrig pixels fra billedet.
- Overskrifterne bruger Fraunces' variable akser (wght, SOFT, WONK) bogstav for bogstav.

## Filer

- `index.html`: hele oplevelsen.
- `assets/raven.webp`: ravnen (AI-genereret til projektet og frilagt med alfakanal).
- `design-canvas/UnrealDiorama.dc.html`: originalen af kapitel I fra Claude-design-lærredet.
