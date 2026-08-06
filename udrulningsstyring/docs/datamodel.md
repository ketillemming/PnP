# Datamodel — Dataverse for Teams

Dette dokument oversætter datamodellen fra projektbrief'en til konkrete
Dataverse for Teams-tabeller. Det er grundlaget for både
`scripts/provision-dataverse.ps1` og Power Fx-formlerne i `build-guide.md`.

## Vigtigt at vide, før I bygger

- **Miljø er bundet til ét Team.** Dataverse for Teams-miljøet hører til én
  bestemt Microsoft Team. Alle brugere, der skal have adgang til appen, skal
  være medlemmer af det Team (almindelige medlemmer eller gæster). Det
  Team'et løser i praksis brief'ens krav 1 ("kun brugere med en konto i
  virksomhedens tenant") — der er ikke behov for ekstra kode til det.
- **Tabel-præfiks.** Når I opretter tabeller i Power Apps Studio (eller kører
  provisioneringsscriptet), får de et automatisk løsnings-præfiks fra jeres
  miljøs standardudgiver. **I dette miljø er præfikset `cr18b_`** (aflæst på
  den oprettede `cr18b_bruger`-tabel). I dokumentets eksempler bruges
  `{prefix}_` som pladsholder for det.
  Praktisk konsekvens: flere steder i Studio optræder to tabeller med samme
  viste navn — fx `Bruger` (Dataverses indbyggede `systemuser`) og `Bruger`
  (vores `cr18b_bruger`). **Vælg altid den med `cr18b_`.**
- **Systemkolonner genbruges.** Hver Dataverse-tabel har automatisk
  `Oprettet den` (createdon), `Ændret den` (modifiedon), `Oprettet af` og
  `Ejer`. Brief'ens `createdAt`/`updatedAt`-felter er derfor ikke lavet som
  separate, custom kolonner nedenfor — de findes allerede.
- **Primær navnekolonne på tabeller uden naturligt navn.** Dataverse kræver,
  at hver tabel har én "primær navnekolonne" (kort enkeltlinje-tekst), som
  bruges til at identificere rækken i lister, søgning og lookup-felter. For
  `Projekt`, `Afdeling` og `Bruger` er det oplagt `{prefix}_navn`. For
  `ProjektAdgang` og `Aktivitet`, som ikke har et naturligt navn, oprettes
  også en `{prefix}_navn`-kolonne som primær navnekolonne, men den udfyldes
  automatisk af app'en (Power Fx) i stedet for af brugeren:
  - `ProjektAdgang`: sættes til `"<bruger> – <projekt>"`.
  - `Aktivitet`: sættes til de første ca. 80 tegn af `Beskrivelse`. Den
    fulde tekst ligger fortsat i `{prefix}_beskrivelse` (flere linjer).
- **"User" hedder `Bruger`, ikke `User`.** Dataverse har i forvejen en
  indbygget systemtabel til brugere (`systemuser`), som automatisk
  synkroniseres fra Entra ID/Teams-medlemskab, og som man normalt ikke bør
  til- eller ombygge i et for-Teams-miljø. Brief'ens `User`-tabel (med
  `role`-feltet) er derfor lavet som sin egen custom tabel, `Bruger`, der
  refererer til den rigtige bruger via e-mail. Det er `Bruger`, resten af
  modellen peger på — ikke `systemuser`.
- **Choice-værdier (tallene) er ligegyldige — men rækkefølgen er ikke.**
  Værditallene 1, 2, 3 … i tabellerne nedenfor er kun til at vise den
  ønskede rækkefølge. Opretter I kolonnerne manuelt i Studio, tildeler
  Dataverse automatisk sine egne tal (typisk 973100000 og opefter) — det er
  helt fint og skal ikke rettes. Formlerne i `build-guide.md` refererer til
  valgmulighedernes **navne**, ikke deres tal.
  Vigtigt: indtast valgmulighederne i den rækkefølge, de står nedenfor.
  De auto-tildelte tal tælder op i indtastningsrækkefølgen, og for
  `Aktivitet.Fase` er det dem, der giver den korrekte ADKAR-sortering
  (A-D-K-A-R) i UI'et.
- **Alle choices er globale ("synkroniserede"), ikke tabel-lokale.** De
  oprettes som genbrugelige valg på miljøniveau, så en valgliste kan rettes
  ét sted. Det har betydning for Power Fx-syntaksen: et globalt valg
  refereres som `'Rolletype'.Admin`, hvor et lokalt ville hedde
  `'Rolle (Brugere)'.Admin`. Formlerne i `build-guide.md` bruger den globale
  form. Navnene på de globale valg står i hver tabel nedenfor.

## Tabeller

### Bruger
App-specifik brugerprofil: rolle i appen (admin/medarbejder) og navn/e-mail
til visning og opslag. Én række pr. person, der skal bruge appen.

| Kolonne (skema) | Visningsnavn | Type | Noter |
|---|---|---|---|
| (primærnøgle, auto) | Bruger | Unikt tekst-id | Auto-genereret GUID |
| `{prefix}_navn` | Navn | Tekst (enkelt linje), påkrævet | |
| `{prefix}_email` | Email | Tekst (enkelt linje), påkrævet | Skal matche brugerens login-mail i Teams/Entra ID — brug `User().Email` i Power Fx til opslag |
| `{prefix}_rolle` | Rolle | Choice, påkrævet | Globalt valg `Rolletype`, se nedenfor |

**Globalt valg: `Rolletype`** (bruges af `Bruger.Rolle`)
| Værdi | Label |
|---|---|
| 1 | Admin |
| 2 | Medarbejder |

`Admin` kan oprette projekter og give/fjerne adgang. `Medarbejder` svarer til
brief'ens `member`.

---

### Projekt
| Kolonne (skema) | Visningsnavn | Type | Noter |
|---|---|---|---|
| (primærnøgle, auto) | Projekt | Unikt tekst-id | |
| `{prefix}_navn` | Navn | Tekst (enkelt linje), påkrævet | |
| `{prefix}_golivedato` | Go-live dato | Kun dato, valgfri | |
| `{prefix}_projektejer` | Projektejer | Lookup → Bruger, påkrævet | Peger på den custom `Bruger`-tabel (`{prefix}_bruger`), ikke Dataverses indbyggede `systemuser`. Navnet er bevidst ikke "Oprettet af", da Dataverse selv har en systemkolonne med det navn |

(Oprettelsestidspunkt dækkes af systemkolonnen `Oprettet den`.)

---

### ProjektAdgang
Kobler brugere til projekter og styrer redigerings-/læseadgang. Erstatter
Dataverses indbyggede post-deling — se begrundelse i `README.md`.

| Kolonne (skema) | Visningsnavn | Type | Noter |
|---|---|---|---|
| (primærnøgle, auto) | ProjektAdgang | Unikt tekst-id | |
| `{prefix}_projekt` | Projekt | Lookup → Projekt, påkrævet | |
| `{prefix}_bruger` | Bruger | Lookup → Bruger, påkrævet | |
| `{prefix}_adgangsniveau` | Adgangsniveau | Choice, påkrævet | Globalt valg `Adgangsniveau`, se nedenfor |

**Globalt valg: `Adgangsniveau`** (bruges af `ProjektAdgang.Adgangsniveau`)
| Værdi | Label |
|---|---|
| 1 | Redaktør |
| 2 | Læser |

`Redaktør` svarer til brief'ens `editor` (kan tilføje/redigere afdelinger og
aktiviteter). `Læser` svarer til `viewer` (kan kun se).

**Regel (håndhæves i app'ens Power Fx, ikke som databasebegrænsning):** en
bruger uden en `ProjektAdgang`-række til et givent projekt kan ikke se det i
projektoversigten eller åbne det direkte.

---

### Afdeling
| Kolonne (skema) | Visningsnavn | Type | Noter |
|---|---|---|---|
| (primærnøgle, auto) | Afdeling | Unikt tekst-id | |
| `{prefix}_projekt` | Projekt | Lookup → Projekt, påkrævet | |
| `{prefix}_navn` | Navn | Tekst (enkelt linje), påkrævet | Pr.-projekt, så navne kan tilpasses jf. brief |

---

### Aktivitet
| Kolonne (skema) | Visningsnavn | Type | Noter |
|---|---|---|---|
| (primærnøgle, auto) | Aktivitet | Unikt tekst-id | |
| `{prefix}_projekt` | Projekt | Lookup → Projekt, påkrævet | |
| `{prefix}_fase` | Fase | Choice, påkrævet | ADKAR-fase, se nedenfor |
| `{prefix}_type` | Type | Choice, påkrævet | Se nedenfor |
| `{prefix}_afdeling` | Afdeling | Lookup → Afdeling, valgfri | Tom = gælder alle afdelinger |
| `{prefix}_beskrivelse` | Beskrivelse | Tekst (flere linjer), påkrævet | |
| `{prefix}_ansvarligbruger` | Ansvarlig (bruger) | Lookup → Bruger, valgfri | |
| `{prefix}_ansvarligfritekst` | Ansvarlig (fritekst) | Tekst (enkelt linje), valgfri | Bruges når den ansvarlige ikke er bruger i systemet — udfyld enten dette eller "Ansvarlig (bruger)", ikke begge |
| `{prefix}_planlagtdato` | Planlagt dato | Kun dato, valgfri | |
| `{prefix}_status` | Status | Choice, påkrævet | Se nedenfor |

(Oprettelses-/ændringstidspunkt dækkes af systemkolonnerne `Oprettet den` og
`Ændret den`.)

**Globalt valg: `ADKARfase`** (bruges af `Aktivitet.Fase`) — indtast de fem
faser i præcis denne rækkefølge, så de auto-tildelte værdier stiger i
ADKAR-rækkefølge og kan sorteres korrekt i UI'et.
| Værdi | Label | Bogstav på skinnen |
|---|---|---|
| 1 | Bevidsthed (Awareness) | A |
| 2 | Ønske (Desire) | D |
| 3 | Viden (Knowledge) | K |
| 4 | Evne (Ability) | A |
| 5 | Fastholdelse (Reinforcement) | R |

**Globalt valg: `Aktivitetstype`** (bruges af `Aktivitet.Type`)
| Værdi | Label | Svarer til |
|---|---|---|
| 1 | Kommunikation | generel kommunikation |
| 2 | Fælles igangsætning | kickoff / online demo |
| 3 | Træning | træning i afdeling |
| 4 | Opfølgning | followup |

**Globalt valg: `Aktivitetsstatus`** (bruges af `Aktivitet.Status`)
| Værdi | Label |
|---|---|
| 1 | Ikke startet |
| 2 | Planlagt |
| 3 | Gennemført |
| 4 | Udskudt |

---

## Relationer — overblik

```
Bruger ─┬─< ProjektAdgang >─┬─ Projekt ─┬─< Afdeling
        │                   │           │
        └───────────────────┘           └─< Aktivitet >─ Afdeling (valgfri)
                                                │
                                     Bruger ────┘ (Ansvarlig, valgfri)
```

- Et Projekt har mange Afdelinger og mange Aktiviteter.
- En Aktivitet hører til præcis ét Projekt, og valgfrit én Afdeling.
- ProjektAdgang er koblingstabellen, der afgør hvem der kan se/redigere hvert
  Projekt.

## Farvekodning pr. status (bruges i build-guide.md)

| Status | Farve | Kilde |
|---|---|---|
| Gennemført | Grøn accent `#C8D400` (mørkere nuance for tekst/kontrast) | Designguide |
| Udskudt | Rav/orange (midlertidig, se `design-reference.md`) | Prototype-arv |
| Planlagt / Ikke startet | Neutrale gråtoner | Design-reference |
