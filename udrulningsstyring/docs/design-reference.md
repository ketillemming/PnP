# Design-reference — farver, typografi, ADKAR-skinne

Oversætter jeres designguide til konkrete værdier til Power Apps Studio.
Farverne herunder er testet for tilgængelighed (WCAG AA-kontrast) — se
begrundelsen under hver farve, da et par af dem kræver et bevidst valg af
tekstfarve ovenpå.

## Officielle farver (fra jer)

| Navn | Hex | Kommentar |
|---|---|---|
| Blå (primær) | `#00668C` | Mørk, mættet blå. God kontrast med **hvid** tekst ovenpå (kontrastforhold ≈ 6,4:1 — består WCAG AA for normal tekst). Brug til: header/navigation, primærknapper, links, valgt/aktiv tilstand. |
| Grøn (accent) | `#C8D400` | Lys, høj-luminans gul-grøn. **Fungerer ikke** med hvid ELLER sort tekst i klassisk "farvet knap"-stil uden justering — se note. Kontrastforhold mod hvid er kun ≈ 1,6:1. Skal derfor altid kombineres med **mørk tekst ovenpå** (kontrastforhold mod sort/mørk tekst ≈ 12,9:1 — meget stærkt). Brug til: udfyldning i ADKAR-skinnen, badges, positive highlights — ikke til store knapper med hvid tekst. |

## Afledte farver (nødvendige for tilgængelighed — bør bekræftes)

Den lyse grønne kan ikke selv bruges som **tekstfarve** (fx et grønt ikon på
hvid baggrund) — den er for lys til at læses tydeligt. Der er derfor afledt
en mørkere version af samme grønne til tekst/ikoner, hvor det er nødvendigt:

| Navn | Hex | Kontrast mod hvid | Brug |
|---|---|---|---|
| Grøn — mørk (afledt) | `#5A5F00` | ≈ 6,8:1 (består AA) | Tekst/ikoner, hvor grøn identitet er ønsket, fx "gennemført"-tekst i tabellen |
| Blå — mørk (hover/tryk) | `#004D69` | — | Hover-/tryk-tilstand for primærknapper (ca. 25 % mørkere end `#00668C`) |

**Antagelse — bør bekræftes:** I har ikke opgivet en farve til "udskudt"-status
eller til neutrale gråtoner. Indtil videre genbruges rav-farven fra den
oprindelige prototype (`#B9822F`) til "udskudt", og en neutral blågrå
gråskala er valgt til baggrunde/kanter/sekundær tekst, så den harmonerer med
den kølige blå:

| Navn | Hex | Brug |
|---|---|---|
| Status: udskudt (midlertidig) | `#B9822F` | Kun "udskudt"-status i aktivitetstabellen |
| Fare / destruktiv | `#A33A2A` | Slet-knapper og andre uoprettelige handlinger. Kontrast på hvid ≈ 6,6:1. Bevidst en anden farve end rav, så "udskudt" beholder sin betydning — og fordi rav på hvid kun giver ≈ 3,3:1 og dermed er for lys til knaptekst |
| Neutral baggrund | `#F5F6F7` | Sideindhold, kort-baggrunde |
| Neutral kant | `#D8DBDE` | Rammer, adskillelseslinjer |
| Tekst — primær | `#1A1A1A` | Brødtekst |
| Tekst — sekundær | `#5C6570` | Metadata, hjælpetekst, datoer |

## Statusfarver — samlet oversigt

| Status | Baggrund | Tekst |
|---|---|---|
| Ikke startet | Neutral kant `#D8DBDE` | Tekst sekundær `#5C6570` |
| Planlagt | Blå, 10 % opacity (`#00668C1A`) | Blå `#00668C` |
| Igangværende | Blå, fuld `#00668C` | Hvid |
| Gennemført | Grøn `#C8D400` | Grøn — mørk `#5A5F00` (eller sort) |
| Udskudt | Rav (midlertidig) `#B9822F`, 15 % opacity | Rav `#B9822F` |

**Farvefeltet på choice-muligheder i Dataverse er noget andet.** Dataverse
lader jer sætte én farve pr. valgmulighed, men den bruges kun i
tabelvisninger og modeldrevne apps — en Canvas App tegner selv sine
kontroller og henter farverne fra formlerne. Feltet kan derfor stå tomt.
Udfyldes det alligevel, så brug én mættet farve pr. status i stedet for de
lyse baggrundstoner ovenfor: Ikke startet `#9AA3AB`, Planlagt `#6FA8BF`,
Igangværende `#00668C`, Gennemført `#C8D400`, Udskudt `#B9822F`.

Statusfarverne danner bevidst en trappe fra neutral til grøn: grå (ikke
begyndt) → lys blå (planlagt) → **fuld blå (i gang)** → grøn (færdig), med
rav som sidespor for det udskudte. `Igangværende` er den eneste med fuld
farvemætning, så øjet falder på det, der faktisk kører lige nu. Hvid tekst
på `#00668C` har et kontrastforhold på ca. 6,4:1 og består WCAG AA.

## Typografi

**Antagelse — bør bekræftes:** Jeres designguide angiver kun **Helvetica
Neue** (én skrifttype), i modsætning til prototypens tredelte system
(serif til overskrifter, sans til brødtekst, mono til tal). Jeg har derfor
antaget, at I ønsker ét samlet typografisystem — ikke tre forskellige
skrifttyper — og bygger hierarkiet med vægt og størrelse i stedet.

Da Power Apps Canvas-appens `Font`-egenskab er en fast liste uden Helvetica
Neue, bruges **Arial** som praktisk erstatning (se tidligere aftale) —
Arial er historisk tegnet som en metrisk-kompatibel erstatning for
Helvetica, så det visuelle udtryk ligger tæt på.

| Element | Skrifttype (Power Apps `Font`) | Størrelse | Vægt |
|---|---|---|---|
| Projektnavn / sidetitel | Arial | 24-28 | Bold (Semibold findes ikke i Power Apps — brug Bold) |
| Sektionsoverskrift | Arial | 18 | Bold |
| Brødtekst / labels | Arial | 14 | Normal |
| Metadata / hjælpetekst | Arial | 12 | Normal, `Tekst sekundær`-farve |
| Datoer og tal i tabeller | Arial | 14 | Normal — se note om mono nedenfor |

**Note om tal/datoer:** Prototypens `IBM Plex Mono` (til datoer/tal) findes
heller ikke i Power Apps' skriftliste. Nærmeste indbyggede erstatning er
`Courier New`, men den bryder visuelt med en ellers ren Arial-app. Anbefaling:
brug almindelig Arial til tal/datoer og opnå den "tabel-agtige" ensretning i
stedet ved at højrestille tal og bruge samme kolonnebredde — ikke ved en
separat skrifttype. Sig til, hvis I hellere vil have `Courier New` alligevel.

## Named formulas til appens tema

Sæt disse som **App.Formulas** i Power Apps Studio (vælg `App` i
trævisningen, og vælg egenskaben `Formulas`). Bemærk de dobbelte
semikolonner — dansk formelsprog, se `build-guide.md`, så alle skærme refererer til de samme farvenavne i stedet
for at hardcode hex-koder hvert sted:

```
clrBrandBlaa = ColorValue("#00668C");;
clrBrandBlaaMoerk = ColorValue("#004D69");;
clrBrandGroen = ColorValue("#C8D400");;
clrBrandGroenMoerk = ColorValue("#5A5F00");;
clrStatusUdskudt = ColorValue("#B9822F");;
clrFare = ColorValue("#A33A2A");;
clrNeutralBaggrund = ColorValue("#F5F6F7");;
clrNeutralKant = ColorValue("#D8DBDE");;
clrTekstPrimaer = ColorValue("#1A1A1A");;
clrTekstSekundaer = ColorValue("#5C6570");;
fontBrand = Font.Arial;;
```

Bruges fx som `FillColor: clrBrandBlaa` og `Font: fontBrand` på en kontrol
(bemærk: moderne kontroller bruger `FillColor`/`TextColor`, ikke `Fill`/`Color`),
fremfor at gentage hex-koden hvert sted — så kan farverne rettes ét sted,
hvis I senere får de præcise partner-revision.dk-koder eller vil justere
"udskudt"-farven.

## Tilstandsfarver: hover, tryk og markering

Kontrollernes farver for **hover, tryk og markering** arver fra Power Apps'
standardtema, ikke fra `Fill`/`Color`. Sætter man kun hvilende farver, blinker
UI'et i standardtemaets lilla, så snart musen rører et element.

Skift derfor app'ens tema (knappen **Tema** i værktøjslinjen) til et neutralt
eller blåt tema, og sæt derudover eksplicit på lister og knapper:

| Egenskab | Værdi |
|---|---|
| `SelectionFill` | `clrBrandBlaa` |
| `SelectionColor` | `White` |
| `HoverFill` | `ColorFade(clrBrandBlaa; 0.8)` |
| `HoverColor` | `clrTekstPrimaer` |
| `PressedFill` | `clrBrandBlaa` |
| `PressedColor` | `White` |

`ColorFade(farve; 0.8)` lysner farven, så hover bliver en antydning frem for
et farveskift, mens det valgte element står i fuld blå.

**Slå ombrydning fra på alle etiketter i en tabelrække.** Med ombrydning
til bliver en lang tekst til to linjer, og etiketten centrerer sit indhold
anderledes end nabokolonnerne — så flugter rækken ikke længere. Teksten
klippes til gengæld af; sæt `Tooltip` til den fulde værdi, så den kan læses
ved at holde musen over.

Det samme gælder etiketter med ét ord eller tegn — fx bogstaverne i
ADKAR-skinnen. Med ombrydning reserveres plads til en linje mere, og det
ene tegn skubbes opad i sit felt.

**Rektangler, der kun er baggrund, skal have `HoverFill` og `PressedFill`
sat lig `Fill`.** Et rektangel er teknisk set en klikbar kontrol og skifter
derfor farve, når musen passerer — også når det bare er et panel eller en
baggrundsdæmpning. Uden det blinker paneler og overlays, hver gang markøren
bevæger sig hen over dem.

## ADKAR-skinnen (signaturelement)

Vandret række af 5 cirkler (A-D-K-A-R), matcher `Fase`-choicen i
`datamodel.md`:

- **Ufyldt cirkel**: `clrNeutralBaggrund`-fyld, `clrNeutralKant`-kant, bogstav i `clrTekstSekundaer`.
- **Delvist fyldt**: fyldes med `clrBrandGroen` i takt med andel gennemførte
  aktiviteter i fasen (fx via en `Rectangle`, der er clip-maskeret til
  cirklens bredde × andel gennemført — beskrevet i `build-guide.md`).
- **Helt fyldt (100 % gennemført)**: `clrBrandGroen`-fyld, bogstav i
  `clrBrandGroenMoerk` (ikke hvid — se kontrast-note ovenfor).
  - **Valgt/aktiv fase** (bruger har klikket for at filtrere): `clrBrandBlaa`-kant rundt om cirklen, uanset fyldningsgrad.
- Klik på en cirkel filtrerer aktivitetstabellen til den fase — samme
  interaktion som i prototypen.
