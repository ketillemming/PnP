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

## 0. Opsætning

1. I jeres Team i Microsoft Teams → **Power Apps**-appen → **+ Ny app** →
   **Tom app** → **Tablet-format**. Dette opretter app'en inde i Teamets
   Dataverse for Teams-miljø.
2. **Tilføj data** (højre panel) → tilføj alle fem tabeller: `Brugere`,
   `Projekter`, `Afdelinger`, `ProjektAdgange`, `Aktiviteter`.
   Globale valglister (`Rolletype`, `Adgangsniveau`, `ADKARfase`,
   `Aktivitetstype`, `Aktivitetsstatus`) skal **ikke** tilføjes separat —
   de følger automatisk med de tabeller, der bruger dem.
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

**ADKAR-statuslys (mini)** — genbrug som Power Apps **Komponent**
(`cmpAdkarSkinne`), så den samme logik bruges både her (lille) og på
projektsiden (stor). Inputs: `ProjektRecord` (post), `Kompakt` (boolean).
For hver af de 5 faser beregnes andel gennemført:

```
With(
  {AktiviteterIFase: Filter(Aktiviteter; Projekt = ProjektRecord && Fase = <fase-værdi>)};
  CountRows(Filter(AktiviteterIFase; Status = 'Aktivitetsstatus'.Gennemført))
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
| | `OnChange` | `Set(varValgtProjekt; Patch(Projekter; varValgtProjekt; {Navn: txtProjektNavn.Value}))` |
| Datovælger `dpGoLive` | `Value` | `varValgtProjekt.'Go-live dato'` |
| | `OnChange` | `Set(varValgtProjekt; Patch(Projekter; varValgtProjekt; {'Go-live dato': dpGoLive.Value}))` |
| Knap "Slet projekt" | `FillColor` | `White` |
| | `TextColor` | `clrFare` |
| | `OnSelect` | `Remove(Projekter; varValgtProjekt);; Navigate(scrProjektoversigt)` |

`Patch` returnerer den opdaterede række, så den pakkes ind i `Set` og
lægges tilbage i `varValgtProjekt` — ellers viser skærmen stadig den gamle
værdi, indtil man forlader den og kommer tilbage.

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
  - `Items`: `Filter(Afdelinger; Projekt = varValgtProjekt)`
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
      Projekt = varValgtProjekt;
      IsBlank(varFaseFilter) || Fase = varFaseFilter;
      IsBlank(varAfdelingFilter) || Afdeling = varAfdelingFilter;
      IsBlank(varStatusFilter) || Status = varStatusFilter
    );
    'Planlagt dato';
    SortOrder.Ascending
  )
  ```

  - Kolonner: Fase (bogstav-badge), Type, Beskrivelse (afkortet), Afdeling
    (eller "Alle afdelinger" hvis tom), Ansvarlig
    (`Coalesce(ThisItem.'Ansvarlig (bruger)'.Navn; ThisItem.'Ansvarlig (fritekst)'; "-")`),
    Planlagt dato, **Status som dropdown direkte i tabellen**:

    ```
    // Dropdown 'ddStatus' i galleri-skabelonen
    Items: Choices(Aktiviteter.Status)
    Default: ThisItem.Status
    OnChange: Patch(Aktiviteter; ThisItem; {Status: ddStatus.Selected})
    ```

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
  Projekt in Filter(ProjektAdgange; Bruger = BrugerNu).Projekt
)
```

*(Note: for et internt værktøj i denne størrelse — få hundrede rækker — er
det trygt at ignorere en eventuel "ikke-delegerbar formel"-advarsel her.)*

### Redaktør vs. læser

Named formula i `App.Formulas`:

```
MinAdgang = LookUp(ProjektAdgange; Projekt = varValgtProjekt && Bruger = BrugerNu);;
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
  `Items: Filter(ProjektAdgange; Projekt = varValgtProjekt)`, med
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
