# Bloody Brilliant — The Unreal of North

By [www.kodekid.app](https://www.kodekid.app). En scroll-styret, interaktiv fortælling i syv kapitler. Den starter som et pastel-eventyr, bliver mørkere undervejs og ender i blæk. Når du scroller forbi slutningen, bliver verden genfødt med et nyt seed, og fortællingen begynder forfra. Den slutter aldrig.

| | Kapitel | Hvad sker der | Klik / tryk |
|---|---|---|---|
| I | **The Unreal North** | Dobbelt så langt som de andre. Dag → solnedgang → nat med nordlys. Bjergene vågner med ansigter, der følger musen, og falder i søvn med zzz. En trold kigger frem bag bakken og gemmer sig, når du kommer for tæt på. En ballon med en viking driver forbi, regnbuebroen Bifrost tegner sig over himlen, en søslange svømmer i floden, det sner (musen hvirvler sneen), og en elg med blomstrende gevir går forbi i nordlyset. Til sidst dykker kameraet op i himlen. | Kugler og blomster. Klik på ballonen (viking i faldskærm), på trolden (den fniser) og om natten på himlen (fyrværkeri) |
| II | **The Singing Sky** | Warp-stjerner (scroll = flyv frem), nordlys der bøjer mod musen, en hval af stjernebilleder der synger, vandmænd. | Ny vandmand; klik på hvalen får den til at synge |
| III | **Lantern Woods** | Parallaks-skov med lysende svampe og lanterner, der svinger efter musens fart. Lanternerne slukker én efter én, og øjne åbner sig i mørket. | Slipper en sværm af møl løs, som følger musen |
| IV | **Sunfall** | Solen styrter op, himlen brænder ravgul, det regner med blæk (musen er en paraply), og en ravn krydser solen. | Blæksprøjt |
| V | **Bloody Brilliant** | En ravn af blæk dykker ned foran kæmpebogstaver, der drypper med blod. Vingen opløses i røg med en brændende kant, og musen river fjer løs. | Ravnen eksploderer til blæk og samler sig igen |
| VI | **Ragnarök** | Kulsort, med støj og glitch. Yggdrasil vokser op af mørket, runer brænder i en roterende cirkel, Odin ser med ét rødt øje, Huginn og Muninn kredser, og Fenrir bryder løs og sluger verden. | Thors lyn slår ned, og runerne gløder |
| VII | **The Ink** | Blækket strømmer ud af ulvens gab, og Odins øje åbner sig og følger dig. Øjet er tegnet i samme beskidte blæk som guderne, med trævlet iris, tørpensel-rynker, knoglehvide vipper og blodtårer. *Again?*, og så genfødes verden, ligesom efter Ragnarök. | Øjet blinker |

## Lyd

Tryk **SOUND** i headeren, eller klik et sted i scenen. Lyden starter ved første klik og huskes til næste besøg. Hvert kapitel har sit eget instrumentale musikunderlag (`assets/audio/ch1–7.mp3`, AI-komponeret og klippet til sømløse loops), som crossfader, når du skifter kapitel. Kun det aktuelle og det næste kapitel bliver hentet. Lydeffekterne bliver syntetiseret live med Web Audio og reagerer på det, der sker: kugler, gnister, trold og fyrværkeri, hvalsang, glasklokker, møl, vind, blæksprøjt, ravnekrage, eksplosioner, torden, ulvehyl, glitch og blink.

## Filmlook

Over alt ligger et animeret filmkorn, en papirstruktur, en svag vignet og en blødere, let afmættet canvas, så grafikken ligner tryk og ikke computergrafik. Hvis enheden ikke kan følge med, slår den selv de tunge dele fra. `?film=0` viser den rå version til sammenligning.

Undervejs er der "beats", der udløses, når du scroller fremad forbi dem: hvalen synger, stjerneskud, et vindstød slukker lanterner, ravnen lander og eksploderer, lynet slår ned, og Fenrir hyler.

## Kør den

Ingen build og ingen afhængigheder. Det eneste eksterne er Google Fonts.

- **Vercel:** importér repoet som et statisk projekt (ingen framework, ingen build-kommando, output = roden).
- **Lokalt:** `npx serve .`

`index.html` kan også åbnes direkte via `file://`, men så må browseren ikke bruge ravnebilledet som WebGL-tekstur, og ravnen falder tilbage til en 2D-version uden shader-effekter.

### URL-parametre

- `?seed=1234` låser verdenen (0 eller ingen giver en ny ved hver reload)
- `?energi=1.5` styrer bevægelsesintensiteten (0.3–2)
- `?kapitel=6` starter i et bestemt kapitel (1–7)
- `?p=6.0` starter på et præcist punkt i fortællingen (0–7.1, hvor kapitel I er 0–1)
- `?film=0` slår filmlooket fra

### Styring

- **Scroll / swipe** driver fortællingen. **Piltaster, PageUp/PageDown, mellemrum, Home** virker også.
- **Kapitel-skinnen** til højre hopper direkte til et kapitel.
- **Trackpad, vandret swipe** giver vind.
- `prefers-reduced-motion` dæmper bevægelse og rystelser.

## Teknik

- Én `<canvas>` (2D) tegner alle kapitler. Kun de kapitler, der er synlige, bliver tegnet, og hvert nyt kapitel fader ind over det forrige.
- Ravnen renderes med en lille WebGL-shader (vingeslag, bølgende røg, støjbaseret opløsning med blodrød brændekant og et hul ved musen), som tegnes ind i 2D-canvasset. Hvis GPU-stien er for langsom på en enhed (under ca. 22 fps), skifter den automatisk til 2D.
- Blækpartiklerne bruger 2400 punkter, som er forudberegnet fra ravnens silhuet og indlejret i `index.html`. Siden læser derfor aldrig pixels fra billedet.
- Overskrifterne bruger Fraunces' variable akser (wght, SOFT, WONK) bogstav for bogstav. RAGNARÖK glitcher med RGB-split.
- Ragnarök: runerne er tegnet som linjegeometri (ingen font-afhængighed), og Yggdrasil er et procedurelt træ, der blækkes pr. dybde. Guderne er knoglehvide negativer med skivevis glitch og chromatic aberration, og et efter-pass forskyder billedet i skiver, laver farveblokke og inverterer i korte glimt.

## Filer

- `index.html`: hele oplevelsen.
- `assets/raven.webp`, `assets/odin.webp`, `assets/fenrir.webp`: ravnen, Odin og Fenrir (AI-genereret til projektet og frilagt med alfakanal).
- `assets/og.jpg`: delingsbillede til sociale medier.
- `assets/audio/ch1.mp3` … `ch7.mp3`: musik pr. kapitel (AI-komponeret, sømløst loopet).
- `design-canvas/UnrealDiorama.dc.html`: originalen af kapitel I fra Claude-design-lærredet.
