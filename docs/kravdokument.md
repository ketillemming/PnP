# Kravdokument — Medarbejder-uddannelsesportal (v0.3, udkast)

Status: **Udkast**. Svar modtaget fra Plan2Learn (RGD) — møde afventes for
detaljer. Afventer stadig svar fra GoLearn, samt afklaring af de resterende
åbne spørgsmål i afsnit 9. Antagelser truffet for
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
  videre til udbyderens egen portal (se afsnit 7, RGD/Plan2Learn).
- Notifikationer/påmindelser om deadlines (se afsnit 9, spørgsmål 2).
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
**Status:** Svar modtaget. Plan2Learn har erfaring med at udstille kurser via
webservice/API til kunder, der viser kurser/hold på egen platform — det
bruges typisk primært til at håndtere **tilmelding, betaling og login**
gennem Plan2Learn selv, ikke kun til at hente data. De har tilbudt et møde om
vores konkrete use-case.

**Vigtigt benspænd:** vi logger ikke ind hos Plan2Learn med vores Entra
ID/SSO — de har deres eget separate login (eget AD). Det betyder tilmelding
og evt. login til et kursus hos Plan2Learn ikke kan foregå sømløst inde i
vores portal uden yderligere afklaring (fx en form for kontokobling), og at
en deep-link/redirect til Plan2Learn er den mest realistiske løsning for
tilmelding i v1 (se afsnit 9, spørgsmål 1 — nu foreløbigt afklaret for RGDs
vedkommende).

**Stadig åbent til mødet:** kan de også udstille **fuldførelsesstatus**
tilbage til os via API (så vi kan vise "gennemført" i vores overblik uden
manuel indtastning), eller er webservicen kun til visning/tilmelding? Hvis
kun visning/tilmelding, er periodisk manuel import (fx CSV) eller
individuel medarbejder-login den mest realistiske fallback for
statustracking i v1.

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

**Yderligere afklaret siden v0.2 (Plan2Learn-svar):**
- ~~Skal medarbejdere kunne tilmelde sig kurser direkte i appen, eller kun se
  overblikket og blive linket videre?~~ → For RGD/Plan2Learn: **linkes
  videre** til Plan2Learn til tilmelding, da de ikke deler SSO med os og selv
  vil håndtere tilmelding/betaling/login. Samme mønster foreslås som default
  for GoLearn, indtil deres svar bekræfter eller afkræfter det. Egne kurser
  håndteres fortsat direkte i appen.

**Fortsat åbne:**
1. Hvordan defineres "gennemført" ensartet på tværs af udbydere? *(Forslag:
   kildens egen rapporterede status for GoLearn/RGD; manuel markering af en
   administrator for egne kurser/workshops. For RGD afhænger det af om
   Plan2Learns webservice også kan levere fuldførelsesstatus, eller kun
   tilmelding/visning — afklares på det kommende møde.)*
2. Skal deadline-håndtering/påmindelser for obligatoriske kurser være med i
   v1? *(Forslag: nej, tilføjes i en senere version.)*
3. Hvem konkret skal have administrator-/HR-adgang (se afsnit 4)?
4. Skal den tværgående HR-visning (5.3) i v1 kun være en simpel tabel, eller
   er der behov for egentlig rapportering/eksport fra start?
5. **GoLearn-svar afventes:** hvilken integrationsmodel tilbyder de, og kan
   det følge samme mønster (link til tilmelding) som Plan2Learn?
6. **RGD/Plan2Learn — møde skal afholdes** for at afklare: kan de levere
   fuldførelsesstatus via API (ikke kun tilmelding/visning)? Og hvordan
   løses login-forskellen (separat AD) i praksis for medarbejderne — skal de
   have et Plan2Learn-login ved siden af Entra ID, eller findes der en
   kontokoblings-mulighed?

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
