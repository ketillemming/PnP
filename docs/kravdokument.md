# Kravdokument — Medarbejder-uddannelsesportal (v0.2, udkast)

Status: **Udkast**. Afventer svar fra GoLearn og RGD (Plan2Learn) samt
afklaring af de resterende åbne spørgsmål i afsnit 9. Antagelser truffet for
at kunne beskrive en sammenhængende v1 er markeret tydeligt og bør bekræftes
eller ændres, før der bygges videre på dem — samme princip som i det
tidligere kundeonboarding-projekt.

## 1. Formål og baggrund

Give alle medarbejdere ét samlet overblik over deres kursus- og
uddannelsesmuligheder: både hvad de har gennemført, og hvad de har adgang
til/bør tage fremadrettet. Appen er et **overbliks- og aggregeringslag**
ovenpå eksterne kursusudbydere (GoLearn, Revisorgruppen Danmark via
Plan2Learn) samt virksomhedens egne kurser/workshops og evt. tredjeparts­kurser
— ikke et selvstændigt LMS.

## 2. Målgruppe og brugere

- **Alle medarbejdere**, logget ind via Microsoft SSO (Entra ID).
- Hvilke kurser der vises som *relevante/tilgængelige* kan styres af
  medarbejderens **gruppetilhørsforhold**, da nogle kurser kun gælder
  bestemte grupper. Gruppetilhørsforhold er dog **valgfrit** — en medarbejder
  kan sagtens have nul grupper og stadig bruge appen (se afsnit 5).
- **Besluttet:** grupper vedligeholdes **manuelt i admin/HR-modulet**, ikke
  hentet automatisk fra Entra ID-grupper. Entra ID bruges udelukkende til
  login.

## 3. Scope for v1 (MVP)

**Med i v1:**
- Login via Microsoft SSO.
- Personligt overblik: gennemførte kurser + tilgængelige/relevante kurser,
  filtreret efter medarbejderens gruppe(r).
- Kursuskatalog der rummer kurser fra flere kilder i samme model: GoLearn,
  RGD/Plan2Learn, egne kurser/workshops, tredjepart.
- **Admin/HR-modul** (se afsnit 5 for detaljer): oprettelse af kurser,
  oprettelse/vedligehold af medarbejdergrupper (inkl. undergrupper),
  tildeling af medarbejdere til grupper, og en tværgående overbliksvisning
  over medarbejdernes kursusstatus.
- Visning af status pr. kursus, hvor data findes (fx: Ikke startet / Tilmeldt
  / I gang / Gennemført).

**Uden for v1 (kandidater til senere):**
- Tilmelding til eksterne kurser (GoLearn/RGD) direkte i appen — v1 linker
  videre til udbyderens egen portal (se åbent spørgsmål 1).
- Notifikationer/påmindelser om deadlines (se åbent spørgsmål 3).
- Fuldautomatisk synkronisering fra GoLearn/RGD, hvis leverandørerne ikke kan
  levere det til v1 — data kan i så fald være manuelt importeret/vedligeholdt
  i en overgangsperiode.

## 4. Brugerroller

| Rolle | Adgang |
|---|---|
| Medarbejder | Ser eget overblik, filtreret efter egne grupper (hvis nogen). |
| Administrator (HR) | Opretter/redigerer kurser, opretter/vedligeholder grupper og gruppetildelinger, ser tværgående overblik over alle medarbejderes kursusstatus. |

**Mindre åbent punkt:** hvem konkret skal have administrator-rollen — hele
HR, en specifik HR-medarbejder, eller også ledelse? (Se afsnit 9.)

## 5. Admin/HR-modul (uddybet)

### 5.1 Medarbejdergrupper
- Grupper oprettes og vedligeholdes manuelt af en administrator i dette
  modul.
- Grupper kan have **hierarki** (overordnet gruppe + undergrupper). Eksempel
  fra jeres organisation:
  - Revisorer
    - Trainee
    - Revisorassistent
    - Ledende revisor
    - Statsautoriseret revisor
  - Økonomikonsulenter
  - Administration
  - Ledere
- En medarbejder kan tilhøre **flere grupper samtidig** (mange-til-mange),
  og gruppetilhørsforhold er **valgfrit**.
- Formålet med grupperne er primært at kunne **målrette kursusudbuddet** —
  ikke en generel organisationsstruktur, der nødvendigvis skal afspejle hele
  virksomheden.
- Administrator tildeler/fjerner medarbejdere fra grupper.

### 5.2 Kursusoprettelse
Når en administrator opretter et kursus (eget/workshop, eller manuelt
registreret fra en ekstern udbyder), registreres som minimum:
- **Titel**
- **Beskrivelse**
- **Forventet tidsforbrug**
- **Type**: Online eller Fysisk
  - Hvis Fysisk: **lokation/adresse**
- Hvilke grupper kurset er synligt for (kan også være "alle")
- Kursusudbyder (Intern / GoLearn / RGD / Tredjepart)
- Obligatorisk eller frivillig *(status: stadig relevant at afklare sammen
  med deadline-spørgsmålet, se afsnit 9)*

### 5.3 Tværgående overblik (HR-visning)
- Administrator kan se kursusstatus på tværs af medarbejdere — fx filtreret
  på gruppe, kursus eller status.
- **Uafklaret detaljeringsgrad:** skal dette i v1 blot være en tabel/liste,
  eller er der behov for egentlig rapportering/eksport? Foreslås holdt til
  simpel tabelvisning i v1 og udbygget senere ved behov.

## 6. Datamodel (foreløbig, høj niveau)

- **Medarbejder** — fra Entra ID til login (navn, e-mail). Gruppetilhørsforhold
  vedligeholdes i appen, ikke i Entra ID.
- **Medarbejdergruppe** — navn, valgfri overordnet gruppe (til hierarki som
  Revisorer → Trainee/Revisorassistent/Ledende revisor/Statsautoriseret
  revisor).
- **Medarbejder ↔ Gruppe** — mange-til-mange kobling, valgfri (0, 1 eller
  flere grupper pr. medarbejder).
- **Kursusudbyder** — GoLearn / RGD (Plan2Learn) / Intern / Tredjepart.
- **Kursus** — titel, beskrivelse, forventet tidsforbrug, type
  (online/fysisk), lokation/adresse (hvis fysisk), udbyder,
  obligatorisk/frivillig, gyldighedsperiode, hvilke grupper det er synligt
  for (eller "alle").
- **Deltagelse/status** — kobling mellem medarbejder og kursus: status, dato
  for evt. gennemførelse, kilde til status (automatisk fra udbyder vs.
  manuelt registreret af administrator).

## 7. Integrationer

### Microsoft Entra ID (SSO)
Bruges udelukkende til login. Gruppetilhørsforhold hentes **ikke** herfra
(se afsnit 2 og 5.1).

### GoLearn
**Status:** Kontaktet, afventer specifikation.
**Åbent:** Leverer de et API/feed med kursuskatalog + fuldførelsesstatus pr.
medarbejder (data-synkronisering), eller forventer de at blive tilgået via
deep-link/SSO fra vores side, uden statustracking tilbage til os?

### RGD / Plan2Learn
**Status:** Kontaktet, afventer specifikation.
**Åbent:** Findes der virksomheds-adgang (API/eksport) til Plan2Learn-data,
eller er individuelle medarbejderkoder den eneste adgangsform? Hvis kun
individuelle koder findes, er en fuld data-synkronisering usandsynlig i v1 —
mest realistiske fallback er enten periodisk manuel import (fx CSV) eller
deep-link uden automatisk statustracking.

### Egne kurser/workshops
Oprettes og vedligeholdes direkte i admin/HR-modulet (afsnit 5.2). Ingen
ekstern integration.

### Tredjepartskurser
**Antagelse:** håndteres i v1 på samme måde som egne kurser (oprettes manuelt
i kataloget af en administrator), medmindre en konkret tredjepartsudbyder
senere kræver sin egen integration.

## 8. Ikke-funktionelle krav

- **GDPR:** kursus-completion er personoplysninger om ansatte.
  Databehandleraftaler med GoLearn og RGD bør være på plads, før deres data
  kobles på — dette bør indgå i leverandørdialogen, ikke kun i selve
  byggeriet.
- **Sprog:** dansk brugerflade.
- **Adgang:** kun medarbejdere med gyldigt virksomhedslogin (Entra ID).
- **Hosting:** Azure forventes at give bedst mening pga. det eksisterende
  Microsoft-økosystem — endelig beslutning tages i arkitekturfasen.

## 9. Åbne spørgsmål der skal afklares

**Afklaret siden v0.1:**
- ~~Skal der være en administrator-/HR-visning med overblik på tværs af
  medarbejdere?~~ → Ja (afsnit 5.3).
- ~~Hvilke medarbejdergrupper findes, og hvordan vedligeholdes de?~~ → Se
  afsnit 5.1: manuelt i admin-modulet, hierarkisk, valgfrit, mange-til-mange.

**Fortsat åbne:**
1. Skal medarbejdere kunne tilmelde sig kurser direkte i appen, eller kun se
   overblikket og blive linket videre til udbyderens egen portal for
   tilmelding? *(Forslag: egne kurser håndteres i appen, eksterne kurser
   linkes videre indtil GoLearn/RGD-svar kendes.)*
2. Hvordan defineres "gennemført" ensartet på tværs af udbydere? *(Forslag:
   kildens egen rapporterede status for GoLearn/RGD; manuel markering af en
   administrator for egne kurser/workshops.)*
3. Skal deadline-håndtering/påmindelser for obligatoriske kurser være med i
   v1? *(Forslag: nej, tilføjes i en senere version.)*
4. Hvem konkret skal have administrator-/HR-adgang (se afsnit 4)?
5. Skal den tværgående HR-visning (5.3) i v1 kun være en simpel tabel, eller
   er der behov for egentlig rapportering/eksport fra start?
6. **GoLearn-svar afventes:** hvilken integrationsmodel tilbyder de?
7. **RGD-svar afventes:** findes der virksomheds-adgang til Plan2Learn, eller
   kun individuelle konti?

## 10. Success-kriterier for v1

- En medarbejder kan logge ind med sit virksomhedslogin og se et overblik
  over egne kurser (gennemførte + relevante), filtreret efter sin(e)
  gruppe(r), hvis nogen.
- En administrator kan oprette en medarbejdergruppe (inkl. undergruppe),
  tildele medarbejdere til en eller flere grupper, og oprette et internt
  kursus/workshop med titel, beskrivelse, tidsforbrug, type og evt. lokation.
- En administrator kan se kursusstatus på tværs af medarbejdere.
- Kurser fra GoLearn og RGD indgår i overblikket — enten via reel integration
  eller via manuelt administreret data, afhængigt af leverandørsvar.
