# Kundeonboarding — klikbar mockup

Klikbar frontend-prototype af kundeonboarding-sitet, bygget ud fra
`Kundeonboarding-site — UI-specifikation` (dokumentet til SharePoint-udvikleren).
Ren HTML/CSS/JS uden build-trin og uden backend — al "CVR-opslag", ERP-integration
og KYC-tredjepartsproces er simuleret med mock-data, jf. MVP-afgrænsningen nedenfor.

## Kør den

Ingen dependencies. Åbn `index.html` direkte i en browser, eller server mappen
statisk, fx:

```bash
python3 -m http.server 8000
# åbn http://localhost:8000/
```

## Hvad er med

Alle seks faner fra specifikationen, med tab-navigation og reel klient-side logik:

- **Start** — CVR-opslag (mock, kun CVR `15807776` findes), "Intet CVR" →
  Type → CPR-flow.
- **Stamdata** — låste CVR-felter, redigerbart "Internt navn" med
  auto-genudfyldning når feltet tømmes, Afdeling forudfyldt fra SR (eller tomt,
  hvis SR er knyttet til flere afdelinger — vælg "Anna Byrn (demo: flere
  afdelinger)" på startskærmen for at se det).
- **Udvidet stamdata** — kontaktpersoner og samarbejdspartnere med
  tilføj/fjern-rækker, "Primær"-logik der gør Rolle/Telefon/Mail påkrævet,
  "Reel ejer" låst og ikke-fjernelig.
- **Team** — LR er påkrævet for at forlade fanen; en demo-knap simulerer at en
  medarbejder blokeres i Microsoft (fjerner adgang, viser SR/LR-fallback).
- **Hvidvask (KYC)** — reelle ejere med >25%-markering, fallback-knappen
  "Påbegynd hvidvaskproces", trinvis statussimulering.
- **Service** — Revision/Bogføring/Løn/Rådgivning med de betingede
  krav og live beregninger fra specifikationens edge cases.
- **Dokumenter** — uændret placeholder, som i specifikationen.

## MVP-afgrænsning

Dette er en **klikbar frontend-prototype på mock-data**, ikke en produktionsklar
app. Bevidst udeladt, fordi det enten er uafklaret i specifikationen eller kræver
integrationer, der ikke er en del af dette trin:

- Rigtigt CVR-opslag (kun ét hardcodet CVR-nummer virker).
- Uniconta/ERP-integration.
- Det faktiske KYC-tredjepartssystem (kun fallback-knappen fra spec'en er bygget).
- Synkronisering med Microsoft-grupper for team-adgang (simuleret med en demo-knap).
- Dokumentportal fra Evobis (fanen er bevidst kun en placeholder, som i spec'en).
- Persistens — data gemmes ikke mellem sideindlæsninger.

## Antagelser (uafklarede punkter i specifikationen)

Specifikationen markerer selv nogle punkter som ikke fastlagte. For at kunne bygge
en fungerende prototype er der lagt en midlertidig, tydeligt markeret antagelse ind
disse steder — alle bør bekræftes eller ændres, før noget af dette bygges videre på:

1. **Standard-SR ved fjernelse af SR** — spec'en siger "fastlægges senere". Sat til
   `Peter Vinderslev` som placeholder (se `STANDARD_SR` i `app.js`).
2. **Reelle ejere for Fond/Forening uden CVR** — spec'en markerer dette som
   uafklaret. Prototypen viser blot en note på KYC-fanen frem for at gætte på en
   løsning.
3. **Bogførings-timetabellens "Forventede timer"** — antaget at kolonnen
   omregnes til månedlig omsætning ud fra valgt Momsinterval
   (`timepris × timer / måneder i intervallet`). Matcher tallene i den
   oprindelige mockup ved Momsinterval = Kvartal.
4. **Lønperioder pr. år** — indregnet direkte i den månedlige beregning
   (`antal × pris × lønperioder / 12`), jf. edge casen om at 14-dages lønnede
   har 26 lønperioder/år mod 12 for de øvrige. Kan afvige en smule fra de
   håndskrevne dummy-tal i den oprindelige spec (som ikke selv var 100 %
   regnet igennem).

## Filer

- `index.html` — skelet
- `styles.css` — designsystem (samme visuelle sprog som specifikationen)
- `app.js` — al tilstand, rendering og interaktionslogik (ingen frameworks)
