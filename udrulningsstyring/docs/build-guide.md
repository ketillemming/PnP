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

## 0. Opsætning

1. I jeres Team i Microsoft Teams → **Power Apps**-appen → **+ Ny app** →
   **Tom app** → **Tablet-format**. Dette opretter app'en inde i Teamets
   Dataverse for Teams-miljø.
2. **Tilføj data** (højre panel) → tilføj alle fem tabeller: `Brugere`,
   `Projekter`, `Afdelinger`, `ProjektAdgange`, `Aktiviteter`.
3. **App → Formler** (venstre panel, forstørrelsesglas-ikonet → Formler,
   eller `App`-objektet i træet) → indsæt farve-/font-konstanterne fra
   `design-reference.md`, og tilføj denne named formula til at slå den
   aktuelle bruger op ét sted:

   ```
   BrugerNu = LookUp(Brugere, Email = User().Email);
   ErAdmin = !IsBlank(BrugerNu) && BrugerNu.Rolle = 'Rolletype'.Admin;
   ```

   `BrugerNu` og `ErAdmin` genberegnes automatisk og kan bruges på alle
   skærme uden `OnStart` eller globale variabler.

4. Opret fire skærme: `scrProjektoversigt`, `scrProjekt`, `scrAdmin`, og en
   overlay-container til "Del projekt"-panelet (beskrevet under skærm 2).

---

## Milepæl 2 — Kerne-CRUD (uden adgangsbegrænsning)

Byg først uden filtrering på `ProjektAdgange`, så datamodel og UI kan
valideres. Adgangsstyringen lægges oven på i milepæl 3 (nedenfor).

### Skærm: scrProjektoversigt

- **Galleri `galProjekter`** (lodret, tom skabelon):
  - `Items`: `SortByColumns(Projekter, "Navn", SortOrder.Ascending)`
  - I skabelonen: projektnavn (`ThisItem.Navn`, `fontBrand`, 18px, Bold),
    go-live dato (`Text(ThisItem.'Go-live dato', "dd-mm-åååå")`), og et lille
    ADKAR-statuslys (se boks nedenfor).
  - `OnSelect` på skabelonen: `Set(varValgtProjekt, ThisItem); Navigate(scrProjekt)`
- **Knap "+ Nyt projekt"**: kun for admin (adgang lægges til i milepæl 3) —
  `OnSelect`: `Patch(Projekter, Defaults(Projekter), {Navn: "Nyt projekt", Projektejer: BrugerNu})`

**ADKAR-statuslys (mini)** — genbrug som Power Apps **Komponent**
(`cmpAdkarSkinne`), så den samme logik bruges både her (lille) og på
projektsiden (stor). Inputs: `ProjektRecord` (post), `Kompakt` (boolean).
For hver af de 5 faser beregnes andel gennemført:

```
With(
  {AktiviteterIFase: Filter(Aktiviteter, Projekt = ProjektRecord && Fase = <fase-værdi>)},
  CountRows(Filter(AktiviteterIFase, Status = 'Aktivitetsstatus'.Gennemført))
    / Max(1, CountRows(AktiviteterIFase))
)
```

Brug resultatet (0-1) til at style hver af de 5 cirkler efter reglerne i
`design-reference.md` (ufyldt / delvist / helt fyldt). I kompakt visning:
5 små prikker uden bogstaver. I fuld visning (projektsiden): 5 cirkler med
A-D-K-A-R og klik-til-filter (se nedenfor).

### Skærm: scrProjekt

- **Header**: `varValgtProjekt.Navn` (24px, Bold, `fontBrand`).
- **`cmpAdkarSkinne`** i fuld størrelse, med output-property `ValgtFase`,
  sat via `OnSelect` på hver cirkel: `Set(varFaseFilter, <fase-værdi>)`
  (eller `Blank()` hvis der klikkes på en allerede valgt fase, så filteret
  ryddes).
- **Afdelingsliste** (galleri `galAfdelinger`):
  - `Items`: `Filter(Afdelinger, Projekt = varValgtProjekt)`
  - "+ Tilføj afdeling"-knap → tekstinput + `Patch(Afdelinger, Defaults(Afdelinger), {Navn: txtNyAfdeling.Text, Projekt: varValgtProjekt})`
  - Fjern-ikon pr. række → `Remove(Afdelinger, ThisItem)` (med en bekræft-dialog, se Polering)
- **Filtre** (tre dropdowns/comboboxes over aktivitetstabellen): Fase,
  Afdeling, Status. Gem valg i `varFaseFilter` (deles med ADKAR-skinnen),
  `varAfdelingFilter`, `varStatusFilter`.
- **Aktivitetstabel** (galleri eller `Edit form` i tabel-layout,
  `galAktiviteter`):

  ```
  Items:
  Sort(
    Filter(
      Aktiviteter,
      Projekt = varValgtProjekt,
      IsBlank(varFaseFilter) || Fase = varFaseFilter,
      IsBlank(varAfdelingFilter) || Afdeling = varAfdelingFilter,
      IsBlank(varStatusFilter) || Status = varStatusFilter
    ),
    'Planlagt dato', SortOrder.Ascending
  )
  ```

  - Kolonner: Fase (bogstav-badge), Type, Beskrivelse (afkortet), Afdeling
    (eller "Alle afdelinger" hvis tom), Ansvarlig (`Coalesce(ThisItem.'Ansvarlig (bruger)'.Navn, ThisItem.'Ansvarlig (fritekst)', "-")`),
    Planlagt dato, **Status som dropdown direkte i tabellen**:

    ```
    // Dropdown 'ddStatus' i galleri-skabelonen
    Items: Choices(Aktiviteter.Status)
    Default: ThisItem.Status
    OnChange: Patch(Aktiviteter, ThisItem, {Status: ddStatus.Selected})
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
  - `OnSuccess`: `Set(varNavn, Left(dcBeskrivelse.Update, 80)); Patch(Aktiviteter, LastSubmit(frmNyAktivitet), {Navn: varNavn})`
    (sætter den primære navnekolonne, jf. noten i `datamodel.md`).

---

## Milepæl 3 — Adgangsstyring

### Filtrér projektoversigten til egne projekter

Erstat `Items` på `galProjekter` med:

```
Filter(
  Projekter,
  Projekt in Filter(ProjektAdgange, Bruger = BrugerNu).Projekt
)
```

*(Note: for et internt værktøj i denne størrelse — få hundrede rækker — er
det trygt at ignorere en eventuel "ikke-delegerbar formel"-advarsel her.)*

### Redaktør vs. læser

Named formula i `App.Formulas`:

```
MinAdgang = LookUp(ProjektAdgange, Projekt = varValgtProjekt && Bruger = BrugerNu);
KanRedigere = ErAdmin || (!IsBlank(MinAdgang) && MinAdgang.Adgangsniveau = 'Adgangsniveau'.Redaktør);
```

Sæt `DisplayMode: If(KanRedigere, DisplayMode.Edit, DisplayMode.View)` på:
- "+ Tilføj afdeling" / fjern-afdeling-knapper
- "+ Tilføj aktivitet"-knap
- Status-dropdownen i aktivitetstabellen (læsere ser status som tekst, ikke som redigerbar dropdown)

### "Del projekt"-panel (custom UI, ikke Dataverses standarddeling)

Et overlay-panel (`pnlDelProjekt`), synligt når `varVisDelProjekt = true`,
kun tilgængeligt for admin (`ErAdmin`) eller projektets ejer:

- **Galleri** over eksisterende adgange: `Items: Filter(ProjektAdgange, Projekt = varValgtProjekt)`, med bruger-navn, adgangsniveau-dropdown (samme `OnChange: Patch`-mønster som statusdropdownen), og en fjern-knap (`Remove(ProjektAdgange, ThisItem)`).
- **Tilføj adgang**: combobox mod `Brugere` (`cbNyBruger`) + choice-vælger
  for niveau (`cbNyNiveau`) + knap:

  ```
  Patch(
    ProjektAdgange,
    Defaults(ProjektAdgange),
    {
      Navn: cbNyBruger.Selected.Navn & " – " & varValgtProjekt.Navn,
      Projekt: varValgtProjekt,
      Bruger: cbNyBruger.Selected,
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
- **Responsivt layout**: sæt skærmenes `LoadingSpinnerColor`/container-bredder
  til `%`/`Parent.Width` frem for faste pixelværdier, og test på både
  tablet- og telefonstørrelse i Studios forhåndsvisning (`Fil → Indstillinger
  → Skærmstørrelse`).
- **Tomme tilstande**: vis en venlig besked ("Ingen projekter endnu" /
  "Ingen aktiviteter matcher filtret") når et galleri har 0 rækker
  (`If(CountRows(galX.AllItems) = 0, ...)`), i stedet for et tomt hvidt felt.

---

## Milepæl 5 — Publicering

1. **Publicér løsningen**: Løsninger → Standardløsning → **Publicér alle
   tilpasninger** (nødvendigt efter enhver ny tabel/kolonne, inkl. dem fra
   provisioneringsscriptet).
2. **Gem og publicér app'en**: Fil → Gem → Publicér.
3. **Del app'en** med de rette medarbejdere: da app'en ligger i et Team,
   sker den grundlæggende adgang via Teamets medlemskab. Del desuden selve
   app'en fra Power Apps-fanen i Teamet, så den vises i deres app-liste.
4. Opret mindst én ekstra `Bruger`-række med `Rolle = Admin` for en
   kollega, så I ikke er sårbare over for, at kun én person kan administrere
   projekter.
