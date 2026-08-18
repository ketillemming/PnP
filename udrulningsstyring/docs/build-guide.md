# Byggeguide — Canvas App i Power Apps Studio

Denne guide fører jer gennem opbygningen af selve app'en, skærm for skærm,
oven på tabellerne fra `datamodel.md` og temaet fra `design-reference.md`.
Den følger milepæl 2-5 fra projektbrief'en. Alle Power Fx-formler er
udgangspunkter — juster kontrolnavne, hvis I navngiver anderledes i Studio.

**Forudsætning:** Kør `scripts/provision-dataverse.ps1` (eller opret
tabellerne manuelt via Studio → Tabeller), og opret mindst én `Bruger`-række
med jeres egen e-mail og `Rolle = Admin`, før I går videre — ellers kan
ingen se noget i app'en (se "Adgangsstyring" nedenfor).

> **Appen åbnes altid gennem Microsoft Teams — ikke via make.powerapps.com.**
> Dataverse for Teams-miljøer er adskilt fra det almindelige maker-portal i
> browseren. App og tabeller findes derfor ikke i make.powerapps.com, selvom
> alt er intakt. Det ligner datatab, men er det ikke.
>
> Vej ind: Teams → venstre kant → **"…" (Få vist flere apps)** → **Power
> Apps** → fanen **Build** → vælg Teamet. Højreklik på Power Apps-ikonet og
> vælg **Fastgør** for at få det permanent i venstremenuen.
>
> Vil I på et tidspunkt kunne redigere i browseren (eller bygge en Power Apps
> Code App, som det oprindelige brief lagde op til), kræver det en opgradering
> fra Teams-miljøet til fuld Dataverse — og dermed Power Apps Premium-licenser.

## Formelsprog: semikolon, ikke komma

**Alle formler i denne guide er skrevet i dansk formelsprog.** Power Fx
skifter skilletegn efter forfatterens sprogindstilling, og i dansk
opsætning — som er den, dette projekt bygges i — bruges komma som
decimaltegn. Derfor gælder:

| Rolle | Dansk opsætning | International opsætning |
|---|---|---|
| Mellem argumenter | `;` | `,` |
| Mellem hele sætninger | `;;` | `;` |
| Felter i en post | `{a: 1; b: 2}` | `{a: 1, b: 2}` |

Eksempel — samme formel i de to sprog:

```
LookUp(Brugere; 'E-mail' = User().Email)      // dansk (brug denne)
LookUp(Brugere, 'E-mail' = User().Email)      // international
```

Det er ikke en indstilling, man vælger pr. app — den følger brugerens
sprog i Microsoft 365. Kopierer I formler fra Microsofts dokumentation
eller fra internettet, står de næsten altid i den internationale form og
skal oversættes. Symptomet, når man glemmer det, er fejlen *"Operator
forventet"* eller *"Navnet er ikke gyldigt"* — og fordi en enkelt fejl i
`App.Formulas` slår **hele** blokken ud, ser det ud som om intet virker.

## Moderne kontroller: andre egenskabsnavne

App'en er bygget med Power Apps' **moderne** kontroller, som er standard i
Teams. De har andre egenskabsnavne end de klassiske, og ældre vejledninger
på nettet beskriver næsten altid de klassiske:

| Formål | Moderne (brug denne) | Klassisk |
|---|---|---|
| Tekst i et inputfelt | `Value` | `Text` / `Default` |
| Valgt dato | `Value` | `SelectedDate` / `DefaultDate` |
| Baggrundsfarve på knap | `FillColor` | `Fill` |
| Tekstfarve på knap | `TextColor` | `Color` |

Kanter styres fortsat af `BorderColor` **sammen med** `BorderThickness` —
og `BorderColor` alene gør ingenting, hvis tykkelsen er `0`. Egenskaben
`Appearance` (Fluent-stilarterne Primary/Outline/Subtle) findes **ikke** i
denne udgave af kontrollerne, så knapstil sættes med `FillColor`,
`TextColor`, `BorderColor` og `BorderThickness`.

Praktisk tip: skriv kontrollens navn efterfulgt af et punktum i
formellinjen (`txtProjektNavn.`) — så viser Power Apps alle egenskaber,
kontrollen faktisk har.

### Valgværdier som tekst: brug `& ""`, ikke `Text()`

`Text()` på en valgværdi returnerer det **underliggende tal** (fx `934`),
ikke etiketten. Den underforståede omregning giver derimod etiketten:

```
ThisItem.Aktivitetsstatus              // "Igangværende"  — i en etikets Text
ThisItem.Aktivitetsstatus & ""         // "Igangværende"  — som tekst i en formel
Text(ThisItem.Aktivitetsstatus)        // "934"           — næsten aldrig det, man vil
```

Symptomet er tal i UI'et, hvor man forventede ord. Skal en valgværdi bruges
som tekst — til sammenligning, sammenkædning eller visning — så brug `& ""`.

### Valglister i UI'et: vis som tekst, vælg i et panel

Kontrollerne i denne udgave har ingen brugbar rullemenu, og
**kombinationsfeltet kan ikke gengive tekst** — det viser valglisternes
interne tal, uanset hvad `Items` fodres med. Det gælder også en håndskrevet
liste af rene tekststrenge, så det er kontrollen og ikke dataene, der er
problemet. Den har hverken `Felter`, `DisplayFields` eller `SearchFields`
at stille om på.

Konsekvens for designet: **valgværdier vises som tekstetiketter**, og selve
valget træffes i et redigeringspanel frem for direkte i tabelrækken. En
etiket bundet direkte til kolonnen viser etiketteksten korrekt:

| Egenskab | Værdi |
|---|---|
| `Text` | `ThisItem.Aktivitetsstatus` |
| `Color` | `Switch(ThisItem.Aktivitetsstatus; 'Aktivitetsstatus'.Gennemført; clrBrandGroenMoerk; 'Aktivitetsstatus'.Udskudt; clrStatusUdskudt; 'Aktivitetsstatus'.Igangværende; clrBrandBlaa; 'Aktivitetsstatus'.Planlagt; clrBrandBlaa; clrTekstSekundaer)` |

`Switch` sammenligner valgværdi med valgværdi — ingen omregning til tekst,
og dermed ingen tal.

**Afvigelse fra brief'en:** kravet om at kunne skifte status direkte i
aktivitetstabellen er udskudt til redigeringspanelet, indtil der er fundet
en kontrol, der kan vise etiketter.

## Sammenligning af rækker: brug id, ikke hele rækken

Power Fx kan ikke sammenligne to hele rækker med `=` — det giver fejlen
*"Inkompatible typer til sammenligning: record, record"*. Sammenlign i
stedet rækkernes id-kolonne (GUID'en), som har samme navn som tabellen:

```
Filter(Afdelinger; Projekt.Projekt = varValgtProjekt.Projekt)     // virker
Filter(Afdelinger; Projekt = varValgtProjekt)                     // fejler
```

Læses som: "afdelingens projekt-opslag, dets id" = "det valgte projekts id".

Det gælder **kun ved sammenligning**. Når en værdi *tildeles* i `Patch`,
skal hele rækken bruges — `{Projekt: varValgtProjekt}`, ikke id'et.

## Navnene på de globale valglister

Valglisten refereres med det navn, den har i Dataverse — hverken mere eller
mindre. I dette projekt er det `'ADKARfaser'` (som blev navngivet i flertal)
og `'Aktivitetstype'` / `'Aktivitetsstatus'` (ental). Der er altså ikke nogen
regel om flertal; man skal bare bruge det faktiske navn.

Fejlteksten røber navnet, når man rammer forkert: *"matcher ikke den
forventede type optionsetvalue (ADKARfaser)"*. Er du i tvivl, så skriv et
enkelt anførselstegn `'` i formellinjen — så viser Power Apps alle navne,
den kender i den skrivemåde — og et punktum efter navnet for at se
valgmulighederne.

## Navnesammenfald inde i Filter og LookUp: brug `[@...]`

Kolonnerne `Aktivitetstype` og `Aktivitetsstatus` hedder det samme som de
valglister, de bruger. Inde i en `Filter` eller `LookUp` over `Aktiviteter`
vinder **kolonnen** — så `'Aktivitetsstatus'.Gennemført` slår op i kolonnen
i stedet for i valglisten og bliver til en fejlværdi.

Skriv `[@...]` for at hente navnet uden for tabellens rækkevidde:

```
Filter(Aktiviteter; Aktivitetsstatus = [@'Aktivitetsstatus'].Gennemført)   // virker
Filter(Aktiviteter; Aktivitetsstatus = 'Aktivitetsstatus'.Gennemført)      // fejler
```

Det gælder kun inde i tabel-scope. I en `Patch` er der ingen tabel til at
skygge for navnet, så dér virker `'Aktivitetsstatus'.'Ikke startet'` fint —
hvilket gør fejlen forvirrende, når man møder den første gang.

## 0. Opsætning

1. I jeres Team i Microsoft Teams → **Power Apps**-appen → **+ Ny app** →
   **Tom app** → **Tablet-format**. Dette opretter app'en inde i Teamets
   Dataverse for Teams-miljø.
2. **Tilføj data** (højre panel) → tilføj alle fem tabeller: `Brugere`,
   `Projekter`, `Afdelinger`, `ProjektAdgange`, `Aktiviteter`.
   Globale valglister (`Rolletype`, `Adgangsniveau`, `ADKARfase`,
   `Aktivitetstype`, `Aktivitetsstatus`) skal **ikke** tilføjes separat —
   de følger automatisk med de tabeller, der bruger dem. Navnet i Dataverse
   er også navnet i formler — se afsnittet om valglisternes navne.
3. Vælg **App** i trævisningen, og vælg egenskaben **Formulas** i
   rullelisten øverst til venstre (den viser `StartScreen`, når App er
   markeret). Indsæt hele temaet og brugeropslaget her:

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
   BrugerNu = LookUp(Brugere; 'E-mail' = User().Email);;
   ErAdmin = !IsBlank(BrugerNu) && BrugerNu.Rolle = 'Rolletype'.Admin;;
   ```

   `BrugerNu` og `ErAdmin` genberegnes automatisk og kan bruges på alle
   skærme uden `OnStart` eller globale variabler. Brug `Formulas` — ikke
   `OnStart` — og bland ikke de to: `Formulas` bruger `navn = værdi`,
   mens `OnStart` bruger `Set(navn; værdi)`. De to skrivemåder kan ikke
   byttes rundt.

   Driller `'Rolletype'.Admin`, kan sidste linje skrives som
   `ErAdmin = !IsBlank(BrugerNu) && Text(BrugerNu.Rolle) = "Admin";;`.
   Den er lidt mere skrøbelig (afhænger af, at etiketten hedder præcis
   "Admin"), men undgår at referere valglisten ved navn.

4. Opret fire skærme: `scrProjektoversigt`, `scrProjekt`, `scrAdmin`, og en
   overlay-container til "Del projekt"-panelet (beskrevet under skærm 2).

---

## Milepæl 2 — Kerne-CRUD (uden adgangsbegrænsning)

Byg først uden filtrering på `ProjektAdgange`, så datamodel og UI kan
valideres. Adgangsstyringen lægges oven på i milepæl 3 (nedenfor).

### Skærm: scrProjektoversigt

Skærmens `Fill`: `clrNeutralBaggrund`

- **Overskrift** (tekstetiket): `Text` = `"Udrulning & planlægning"`,
  `Font` = `fontBrand`, `Size` = `28`, `FontWeight` = `FontWeight.Bold`,
  `Color` = `clrBrandBlaa`.
- **Knap "+ Nyt projekt"** (`FillColor` = `clrBrandBlaa`, `TextColor` = `White`):

  ```
  OnSelect:
  Patch(Projekter; Defaults(Projekter); {Navn: "Nyt projekt"; Projektejer: BrugerNu})
  ```

  Adgangsbegrænsning lægges på i milepæl 3.
- **Galleri `galProjekter`** (lodret, layout "Titel og undertekst"):
  - `Items`: `Sort(Projekter; Navn)`
  - `TemplateSize`: `88`
  - `Title1.Text`: `ThisItem.Navn` (`fontBrand`, `clrTekstPrimaer`)
  - `Subtitle1.Text` (`fontBrand`, `clrTekstSekundaer`):

    ```
    If(
      IsBlank(ThisItem.'Go-live dato');
      "Ingen go-live dato";
      "Go-live: " & Text(ThisItem.'Go-live dato'; DateTimeFormat.ShortDate)
    )
    ```

  - Plus et lille ADKAR-statuslys pr. række (se boks nedenfor)
  - `OnSelect` på skabelonen:
    `Set(varValgtProjekt; ThisItem);; Navigate(scrProjekt)`

**ADKAR-skinnen** — bygget som et **vandret galleri** (`galAdkar`) frem for
en komponent. Galleriet løber over `Choices(Aktiviteter.Fase)`, så de fem
cirkler kommer af sig selv og altid står i fasernes rækkefølge.

| Kontrol | Egenskab | Værdi |
|---|---|---|
| `galAdkar` | `Items` | `Choices(Aktiviteter.Fase)` |
| | `TemplateSize` | `130` (i et vandret galleri er dette elementets **bredde**) |
| | `ShowScrollbar` | `false` |
| `shpFase` (cirkel) | `Fill` | `With({ialt: CountRows(Filter(Aktiviteter; Projekt.Projekt = varValgtProjekt.Projekt; Fase = ThisItem.Value))}; If(ialt = 0; clrNeutralBaggrund; ColorFade(clrBrandGroen; 1 - CountRows(Filter(Aktiviteter; Projekt.Projekt = varValgtProjekt.Projekt; Fase = ThisItem.Value; Aktivitetsstatus = [@'Aktivitetsstatus'].Gennemført)) / ialt)))` |
| | `BorderColor` | `If(varFaseFilter = ThisItem.Value; clrBrandBlaa; clrNeutralKant)` |
| | `BorderThickness` | `If(varFaseFilter = ThisItem.Value; 3; 1)` |
| | `OnSelect` | `Set(varFaseFilter; If(varFaseFilter = ThisItem.Value; Blank(); ThisItem.Value))` |
| `lblFaseBogstav` | `Text` | `Switch(ThisItem.Value; 'ADKARfaser'.Awareness; "A"; 'ADKARfaser'.Desire; "D"; 'ADKARfaser'.Knowledge; "K"; 'ADKARfaser'.Ability; "A"; 'ADKARfaser'.Reinforcement; "R")` |
| `lblFaseAntal` | `Text` | `With({ialt: CountRows(Filter(Aktiviteter; Projekt.Projekt = varValgtProjekt.Projekt; Fase = ThisItem.Value))}; CountRows(Filter(Aktiviteter; Projekt.Projekt = varValgtProjekt.Projekt; Fase = ThisItem.Value; Aktivitetsstatus = [@'Aktivitetsstatus'].Gennemført)) & "/" & ialt)` |

Placering inde i elementet: `shpFase` 35/8 (60×60), `lblFaseBogstav` 35/20
(60×36), `lblFaseAntal` 20/65 (90×25).

**Fyldningen er farvestyrke, ikke fyldningsgrad.** `ColorFade` lysner den
grønne efter, hvor lidt der er gennemført — ingen gennemførte giver næsten
hvid, alle gennemførte giver fuld grøn. Brief'en beskriver cirkler, der
fyldes op; dette er en forenkling, som er væsentligt enklere at bygge og
aflæses lige så hurtigt. Tælleren under cirklen ("2/5") giver det præcise tal.

Kun `Gennemført` tæller med. `Igangværende` tæller som ikke-færdig.

Klik på en cirkel sætter `varFaseFilter` og filtrerer aktivitetstabellen;
klik på den samme cirkel igen rydder filteret. Den valgte fase markeres med
en blå kant frem for med farve, så markeringen ikke forveksles med
fyldningsgraden.

To ting, der koster tid, hvis man overser dem:

- Kontroller **skal indsættes inde i galleriets skabelon**, ellers findes
  `ThisItem` ikke, og alle formler bliver til fejl. Kontrollér i
  trævisningen, at de står indrykket under galleriet.
- Skriv den formel, der **sætter** en variabel (`OnSelect`), før dem der
  **læser** den (`BorderColor`). Power Apps kender først et variabelnavn,
  når der findes et `Set()` for det.
- Slå **ombrydning** fra på etiketter med ét ord eller tegn. Med ombrydning
  reserveres plads til en ekstra linje, og teksten forskydes opad.

### Skærm: scrProjektoversigt

Skærmens `Fill`: `clrNeutralBaggrund`

- **Overskrift** (tekstetiket): `Text` = `"Udrulning & planlægning"`,
  `Font` = `fontBrand`, `Size` = `28`, `FontWeight` = `FontWeight.Bold`,
  `Color` = `clrBrandBlaa`.
- **Knap "+ Nyt projekt"** (`FillColor` = `clrBrandBlaa`, `TextColor` = `White`):

  ```
  OnSelect:
  Patch(Projekter; Defaults(Projekter); {Navn: "Nyt projekt"; Projektejer: BrugerNu})
  ```

  Adgangsbegrænsning lægges på i milepæl 3.
- **Galleri `galProjekter`** (lodret, layout "Titel og undertekst"):
  - `Items`: `Sort(Projekter; Navn)`
  - `TemplateSize`: `88`
  - `Title1.Text`: `ThisItem.Navn` (`fontBrand`, `clrTekstPrimaer`)
  - `Subtitle1.Text` (`fontBrand`, `clrTekstSekundaer`):

    ```
    If(
      IsBlank(ThisItem.'Go-live dato');
      "Ingen go-live dato";
      "Go-live: " & Text(ThisItem.'Go-live dato'; DateTimeFormat.ShortDate)
    )
    ```

  - Plus et lille ADKAR-statuslys pr. række (se boks nedenfor)
  - `OnSelect` på skabelonen:
    `Set(varValgtProjekt; ThisItem);; Navigate(scrProjekt)`

**ADKAR-statuslys (mini)** — genbrug som Power Apps **Komponent**
(`cmpAdkarSkinne`), så den samme logik bruges både her (lille) og på
projektsiden (stor). Inputs: `ProjektRecord` (post), `Kompakt` (boolean).
For hver af de 5 faser beregnes andel gennemført:

```
With(
  {AktiviteterIFase: Filter(Aktiviteter; Projekt.Projekt = ProjektRecord.Projekt && Fase = <fase-værdi>)};
  CountRows(Filter(AktiviteterIFase; Aktivitetsstatus = 'Aktivitetsstatus'.Gennemført))
    / Max(1; CountRows(AktiviteterIFase))
)
```

Brug resultatet (0-1) til at style hver af de 5 cirkler efter reglerne i
`design-reference.md` (ufyldt / delvist / helt fyldt). I kompakt visning:
5 små prikker uden bogstaver. I fuld visning (projektsiden): 5 cirkler med
A-D-K-A-R og klik-til-filter (se nedenfor).

Bemærk: kun `Gennemført` tæller med. `Igangværende` tæller som ikke-færdig.

### Skærm: scrProjekt

Skærmens `Fill`: `clrNeutralBaggrund`

**Projekthoved — bygges først.** Uden det kan de auto-oprettede
"Nyt projekt"-rækker hverken navngives eller slettes.

| Kontrol | Egenskab | Værdi |
|---|---|---|
| Knap "← Tilbage" | `OnSelect` | `Navigate(scrProjektoversigt)` |
| Tekstinput `txtProjektNavn` | `Value` | `varValgtProjekt.Navn` |
| Datovælger `dpGoLive` | `Value` | `varValgtProjekt.'Go-live dato'` |
| Knap "Gem" | `FillColor` | `clrBrandBlaa` |
| | `TextColor` | `White` |
| | `DisplayMode` | `If(IsBlank(txtProjektNavn.Value); DisplayMode.Disabled; DisplayMode.Edit)` |
| | `OnSelect` | `Set(varValgtProjekt; Patch(Projekter; varValgtProjekt; {Navn: txtProjektNavn.Value; 'Go-live dato': dpGoLive.Value}));; Notify("Projektet er gemt"; NotificationType.Success; 2000)` |
| Knap "Slet projekt" | `FillColor` | `White` |
| | `TextColor` | `clrFare` |
| | `OnSelect` | `Remove(Projekter; varValgtProjekt);; Navigate(scrProjektoversigt)` |

`Patch` returnerer den opdaterede række, så den pakkes ind i `Set` og
lægges tilbage i `varValgtProjekt` — ellers viser skærmen stadig den gamle
værdi, indtil man forlader den og kommer tilbage.

Navn og dato gemmes med en **eksplicit gem-knap** frem for via `OnChange`
på hvert felt. Det koster et klik, men brugeren kan se, hvornår noget er
gemt — og `Notify` bekræfter det. Med `OnChange` sker gemningen usynligt,
når man klikker væk, og det er uklart, om ændringen nåede med.

Slet-knappen bruger `clrFare`, ikke `clrStatusUdskudt`: rav betyder
"udskudt" i aktivitetstabellen, og samme farve må ikke betyde to ting.
Bekræft-dialog tilføjes under Polering.

**Resten af projektsiden:**

- **Header**: `varValgtProjekt.Navn` (24px, Bold, `fontBrand`).
- **`cmpAdkarSkinne`** i fuld størrelse, med output-property `ValgtFase`,
  sat via `OnSelect` på hver cirkel: `Set(varFaseFilter; <fase-værdi>)`
  (eller `Blank()` hvis der klikkes på en allerede valgt fase, så filteret
  ryddes).
- **Afdelingsliste** (galleri `galAfdelinger`):
  - `Items`: `Filter(Afdelinger; Projekt.Projekt = varValgtProjekt.Projekt)`
  - "+ Tilføj afdeling"-knap → tekstinput +
    `Patch(Afdelinger; Defaults(Afdelinger); {Navn: txtNyAfdeling.Text; Projekt: varValgtProjekt})`
  - Fjern-ikon pr. række → `Remove(Afdelinger; ThisItem)` (med en bekræft-dialog, se Polering)
- **Filtre** (tre dropdowns/comboboxes over aktivitetstabellen): Fase,
  Afdeling, Status. Gem valg i `varFaseFilter` (deles med ADKAR-skinnen),
  `varAfdelingFilter`, `varStatusFilter`.
- **Aktivitetstabel** (galleri eller `Edit form` i tabel-layout,
  `galAktiviteter`):

  ```
  Items:
  Sort(
    Filter(
      Aktiviteter;
      Projekt.Projekt = varValgtProjekt.Projekt;
      IsBlank(varFaseFilter) || Fase = varFaseFilter;
      IsBlank(varAfdelingFilter) || Afdeling.Afdeling = varAfdelingFilter.Afdeling;
      IsBlank(varStatusFilter) || Aktivitetsstatus = varStatusFilter
    );
    'Planlagt dato';
    SortOrder.Ascending
  )
  ```

  Hurtig-opret-knap ("+ Ny aktivitet") — alle påkrævede felter skal have en
  værdi, ellers afviser Dataverse rækken:

  ```
  Patch(Aktiviteter; Defaults(Aktiviteter);
    {Navn: "Ny aktivitet"; Beskrivelse: "Ny aktivitet"; Projekt: varValgtProjekt;
     Fase: 'ADKARfaser'.Awareness;
     Aktivitetstype: 'Aktivitetstype'.Kommunikation;
     Aktivitetsstatus: 'Aktivitetsstatus'.'Ikke startet'})
  ```

  Bogstavet til fase-badgen er etikettens forbogstav, da faserne bruger de
  engelske ADKAR-navne: `Left(Text(ThisItem.Fase); 1)`.

  - Kolonner: Fase (bogstav-badge), Type, Beskrivelse (afkortet), Afdeling
    (eller "Alle afdelinger" hvis tom), Ansvarlig
    (`Coalesce(ThisItem.'Ansvarlig (bruger)'.Navn; ThisItem.'Ansvarlig (fritekst)'; "-")`),
    Planlagt dato, **Status som dropdown direkte i tabellen**:

    ```
    // Kombinationsfelt 'ddStatus' i galleri-skabelonen
    Items: Choices(Aktiviteter.Aktivitetsstatus)
    DefaultSelectedItems: Filter(Choices(Aktiviteter.Aktivitetsstatus); Value = Text(ThisItem.Aktivitetsstatus))
    AllowMultipleSelection: false
    OnChange: Patch(Aktiviteter; ThisItem; {Aktivitetsstatus: ddStatus.Selected.Value})
    ```

    Kombinationsfeltet får `Height` 40 mod etiketternes 24, så det kan
    rammes med musen. Begge er stadig lodret centreret i en række på 56.

    Farvelæg badgen efter tabellen i `design-reference.md` (Statusfarver).
- **"+ Tilføj aktivitet"**-formular (separat panel/modal, `frmNyAktivitet`,
  `Edit form` bundet til `Aktiviteter`):
  - `Item`: `Defaults(Aktiviteter)`
  - Skjulte/forudfyldte felter: `Projekt` sættes til `varValgtProjekt` i
    `OnSuccess`/via `UpdateContext`, ikke som synligt felt i formen.
  - `DataCard` for "Ansvarlig": to felter side om side — combobox mod
    `Brugere` (sætter `Ansvarlig (bruger)`) OG et tekstfelt (sætter
    `Ansvarlig (fritekst)`) — udfyld kun ét, jf. `datamodel.md`.
  - `OnSuccess`:

    ```
    Set(varNavn; Left(dcBeskrivelse.Update; 80));;
    Patch(Aktiviteter; LastSubmit(frmNyAktivitet); {Navn: varNavn})
    ```

    (sætter den primære navnekolonne, jf. noten i `datamodel.md`).

---

## Milepæl 3 — Adgangsstyring

### Filtrér projektoversigten til egne projekter

Erstat `Items` på `galProjekter` med:

```
Filter(
  Projekter;
  Projekt in Filter(ProjektAdgange; Bruger.Bruger = BrugerNu.Bruger).Projekt
)
```

*(Note: for et internt værktøj i denne størrelse — få hundrede rækker — er
det trygt at ignorere en eventuel "ikke-delegerbar formel"-advarsel her.)*

### Redaktør vs. læser

Named formula i `App.Formulas`:

```
MinAdgang = LookUp(ProjektAdgange; Projekt.Projekt = varValgtProjekt.Projekt && Bruger.Bruger = BrugerNu.Bruger);;
KanRedigere = ErAdmin || (!IsBlank(MinAdgang) && MinAdgang.Adgangsniveau = 'Adgangsniveau'.Redaktør);;
```

Sæt `DisplayMode: If(KanRedigere; DisplayMode.Edit; DisplayMode.View)` på:
- "+ Tilføj afdeling" / fjern-afdeling-knapper
- "+ Tilføj aktivitet"-knap
- Status-dropdownen i aktivitetstabellen (læsere ser status som tekst, ikke som redigerbar dropdown)

### "Del projekt"-panel (custom UI, ikke Dataverses standarddeling)

Et overlay-panel (`pnlDelProjekt`), synligt når `varVisDelProjekt = true`,
kun tilgængeligt for admin (`ErAdmin`) eller projektets ejer:

- **Galleri** over eksisterende adgange:
  `Items: Filter(ProjektAdgange; Projekt.Projekt = varValgtProjekt.Projekt)`, med
  bruger-navn, adgangsniveau-dropdown (samme `OnChange: Patch`-mønster som
  statusdropdownen), og en fjern-knap (`Remove(ProjektAdgange; ThisItem)`).
- **Tilføj adgang**: combobox mod `Brugere` (`cbNyBruger`) + choice-vælger
  for niveau (`cbNyNiveau`) + knap:

  ```
  Patch(
    ProjektAdgange;
    Defaults(ProjektAdgange);
    {
      Navn: cbNyBruger.Selected.Navn & " – " & varValgtProjekt.Navn;
      Projekt: varValgtProjekt;
      Bruger: cbNyBruger.Selected;
      Adgangsniveau: cbNyNiveau.Selected
    }
  )
  ```

### Skærm: scrAdmin

Kun tilgængelig i navigationen når `ErAdmin = true`. Indeholder:
- Galleri over `Brugere` (opret/redigér navn, e-mail, rolle) — bruges til
  at give nye medarbejdere adgang til overhovedet at optræde som
  vælgbare "Ansvarlig"/"Del med"-personer i appen. Husk: retten til at
  *åbne appen* styres af Team-medlemskab (se `datamodel.md`); denne liste
  styrer kun rollen (`Admin`/`Medarbejder`) inde i appen.

---

## Milepæl 4 — Polering

- **Bekræft-dialog** ved sletning (afdeling/aktivitet/adgang): brug en
  simpel `Confirm`-boks-komponent (variabel `varSlettesEmne` +
  `varSletBekraeft`) i stedet for `Remove` direkte på klik.
- **ADKAR-skinnens klik-til-filter**: sørg for at klik på en allerede-valgt
  fase-cirkel rydder filteret igen (toggle), jf. beskrivelsen i
  `design-reference.md`.
- **Responsivt layout**: sæt container-bredder til `%`/`Parent.Width` frem
  for faste pixelværdier, og test på både tablet- og telefonstørrelse i
  Studios forhåndsvisning (`Indstillinger → Skærmstørrelse`).
- **Tomme tilstande**: vis en venlig besked ("Ingen projekter endnu" /
  "Ingen aktiviteter matcher filtret") når et galleri har 0 rækker
  (`If(CountRows(galX.AllItems) = 0; ...)`), i stedet for et tomt hvidt felt.

---

## Milepæl 5 — Publicering

1. **Publicér løsningen**: Løsninger → Standardløsning → **Publicér alle
   tilpasninger** (nødvendigt efter enhver ny tabel/kolonne, inkl. dem fra
   provisioneringsscriptet).
2. **Gem og publicér app'en**: Gem → Publicér.
3. **Del app'en** med de rette medarbejdere: da app'en ligger i et Team,
   sker den grundlæggende adgang via Teamets medlemskab. Del desuden selve
   app'en fra Power Apps-fanen i Teamet, så den vises i deres app-liste.
4. Opret mindst én ekstra `Bruger`-række med `Rolle = Admin` for en
   kollega, så I ikke er sårbare over for, at kun én person kan administrere
   projekter.
