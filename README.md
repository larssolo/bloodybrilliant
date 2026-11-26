# The Unreal North — Levende diorama

Et levende, scroll-styret pastel-diorama: bjerge, skyer, svævende øer, kugler, blomster og en flod, der hele tiden bevæger sig. Hver reload genererer en ny verden.

## Kør den

Den er én selvstændig fil uden build-trin og uden afhængigheder. Det eneste eksterne er Google Fonts.

- Åbn `index.html` i en browser, eller
- server mappen, fx `npx serve .`, eller slå GitHub Pages til på `main`.

URL-parametre:

- `?seed=1234` låser verdenen (0 eller ingen giver en ny ved hver reload)
- `?energi=1.5` styrer bevægelsesintensiteten (0.3–2)

## Interaktion

- **Scroll / swipe:** en dag går, fra morgen over solnedgang til nat med nordlys. Kameraet kører ind i dybden, bjergene morfer (kegle → kuppel → krystal), blomsterne vokser og forvandles, og floden følger scrollfarten og vender med scrollretningen.
- **Mus:** kuglerne viger, blomsterne drejer, og bogstaverne skubbes væk.
- **Klik:** kaster en ny kugle, der hopper. Klik ved en blomst får den til at eksplodere.
- **Trackpad, vandret swipe:** vind.
- **Overraskelser:** hvert 5.–9. sekund dukker en kæmpekugle, en blomstereksplosion eller en fisk op.

## Filer

- `index.html`: den selvstændige version.
- `design-canvas/UnrealDiorama.dc.html`: originalen fra Claude-design-lærredet.
