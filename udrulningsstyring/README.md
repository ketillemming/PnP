# Udrulningsstyring (ADKAR)

Internt værktøj til Partner Revision (Fællesfunktionen) til at planlægge og
følge træning og udrulning af nye systemer på tværs af projekter og
afdelinger, bygget på ADKAR-modellen. Se det oprindelige projektbrief for
fuld baggrund og krav.

## Stack

Power Apps **Canvas App** (lav-kode, bygget i Power Apps Studio) oven på
**Dataverse for Teams**. Ikke en Power Apps *Code App* — det kræver en
Power Apps Premium-licens, som organisationen ikke har (kun Microsoft 365
Business Basic). Dataverse for Teams følger med Microsoft Teams, som er
inkluderet i Business Basic, og kræver ingen ekstra licens.

Konsekvensen er, at selve app-UI'et ikke er skrevet som kode i dette repo —
det bygges i Power Apps Studios drag-and-drop-editor med Power Fx-formler.
Det, der ligger her, er den præcise specifikation og de scripts, der gør
den opbygning reproducerbar og dokumenteret, i stedet for tavs
klik-arbejde:

| Fil | Indhold |
|---|---|
| `docs/datamodel.md` | Dataverse for Teams-tabellerne, kolonner, choices, relationer |
| `scripts/provision-dataverse.ps1` | Opretter tabellerne fra `datamodel.md` automatisk via Dataverse Web API |
| `docs/design-reference.md` | Farver, typografi, ADKAR-skinnens visuelle regler — oversat til Power Apps-temaværdier |
| `docs/build-guide.md` | Trin-for-trin opbygning af skærmene i Power Apps Studio, med Power Fx-formler |

## Vigtige valg (og hvorfor)

- **Dataverse for Teams i stedet for fuld Dataverse/Code App**: eneste
  Power Platform-datalag der er dækket af jeres nuværende licens
  (Microsoft 365 Business Basic). Kan opgraderes til fuld Dataverse senere
  uden at genbygge datamodellen, hvis I får Premium-licenser.
- **Custom `ProjektAdgang`-tabel i stedet for Dataverses indbyggede
  post-deling**: mere brugervenligt UI ("Del projekt"-panel direkte i
  app'en) for medarbejdere, der ikke er vant til Power Platforms
  standarddialoger — jf. projektbrief'ens egen anbefaling.
- **Miljøet er bundet til ét Microsoft Team**: alle app-brugere skal være
  medlemmer af det Team. Det dækker automatisk kravet om, at kun brugere i
  virksomhedens tenant kan tilgå appen.

## Status

**Færdigt:**

- Milepæl 1 — Dataverse for Teams-tabellerne er oprettet og virker
  end-to-end.
- Milepæl 2 — projektoversigt, projektside, afdelinger og aktivitetstabel
  med redigeringspanel. Aktiviteter kan oprettes, rettes og slettes.
- ADKAR-skinnen med farvegraderede faser, tæller pr. fase og klik-til-filter.
- Milepæl 3, delvist — adgang oprettes automatisk til den, der opretter et
  projekt, og projektoversigten filtreres efter adgang (administratorer ser
  alt). `MinAdgang` og `KanRedigere` er defineret i `App.Formulas`.

**Næste skridt, i rækkefølge:**

1. **Papirkurv-ikonet i `galAdgange` skal laves om** — det blev indsat i det
   forkerte galleri og skal slettes og oprettes inde i `galAdgange`.
   `OnSelect`: `Remove(ProjektAdgange; ThisItem)`.
2. Færdiggør "Del projekt"-panelet (brugerliste, niveauliste, "Giv adgang",
   luk-knap) — se `docs/build-guide.md`.
3. Håndhæv `KanRedigere`: sæt `DisplayMode` på knapper og felter, så læsere
   kun kan se.
4. `scrAdmin` til at oprette brugere og sætte roller.
5. Resterende filtre over aktivitetstabellen (afdeling, status) samt
   ADKAR-statuslys pr. række i projektoversigten.
6. Polering og publicering (milepæl 4-5).

## Kendte begrænsninger

- **Statusskift kan ikke ske direkte i aktivitetstabellen.** Kontrollerne i
  denne udgave af Power Apps har ingen vælger, der kan gengive tekst, så
  status vises som etiket og ændres i redigeringspanelet. Afviger fra
  brief'en.
- **Delegeringsadvarsel på projektoversigtens filter.** Filtreringen sker
  lokalt på de første 500 rækker (kan hæves til 2000 under Indstillinger).
  Uproblematisk ved det forventede antal projekter, men værd at kende, hvis
  `Aktiviteter` en dag vokser markant.
- **ADKAR-cirklerne viser fyldningsgrad som farvestyrke**, ikke som en
  cirkel der fyldes op. Forenkling i forhold til brief'en; tælleren under
  cirklen giver det præcise tal.

## Åbne/antagne punkter (bør bekræftes)

1. Farve til "udskudt"-status og neutrale gråtoner er ikke en del af den
   officielle designguide — midlertidigt sat til prototypens rav-farve
   (`#B9822F`) og en neutral blågrå skala. Se `docs/design-reference.md`.
2. Designguiden angiver kun Helvetica Neue (ingen separat overskrift-/
   mono-skrift som i prototypen) — antaget som ét samlet typografisystem
   med Arial som Power Apps-erstatning. Se `docs/design-reference.md`.
3. `responsibleUserId`/"Ansvarlig" understøtter både en rigtig bruger og
   fritekst parallelt (to felter, udfyld kun ét), jf. brief'ens egen
   formulering — ikke endeligt bekræftet som den ønskede løsning.
