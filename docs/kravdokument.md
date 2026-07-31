# Kravdokument — Medarbejder-uddannelsesportal (v0.1, udkast)

Status: **Udkast**. Afventer svar fra GoLearn og RGD (Plan2Learn) samt afklaring
af de åbne spørgsmål i afsnit 8. Antagelser truffet for at kunne beskrive en
sammenhængende v1 er markeret tydeligt og bør bekræftes eller ændres, før der
bygges videre på dem — samme princip som i det tidligere
kundeonboarding-projekt.

## 1. Formål og baggrund

Give alle medarbejdere ét samlet overblik over deres kursus- og
uddannelsesmuligheder: både hvad de har gennemført, og hvad de har adgang
til/bør tage fremadrettet. Appen er et **overbliks- og aggregeringslag**
ovenpå eksterne kursusudbydere (GoLearn, Revisorgruppen Danmark via
Plan2Learn) samt virksomhedens egne kurser/workshops og evt. tredjeparts­kurser
— ikke et selvstændigt LMS.

## 2. Målgruppe og brugere

- **Alle medarbejdere**, logget ind via Microsoft SSO (Entra ID).
- Hvilke kurser der vises som *relevante/tilgængelige* styres af
  medarbejderens **gruppetilhørsforhold** (fx afdeling/rolle), da nogle kurser
  kun gælder bestemte grupper.
- **Antagelse:** gruppetilhørsforhold hentes fra eksisterende Entra
  ID-grupper frem for at blive vedligeholdt separat i appen. *Skal bekræftes:
  findes de relevante grupper allerede i Entra ID, eller skal de etableres?*

## 3. Scope for v1 (MVP)

**Med i v1:**
- Login via Microsoft SSO.
- Personligt overblik: gennemførte kurser + tilgængelige/relevante kurser,
  filtreret efter medarbejderens gruppe(r).
- Kursuskatalog der rummer kurser fra flere kilder i samme model: GoLearn,
  RGD/Plan2Learn, egne kurser/workshops, tredjepart.
- Admin-funktion til at oprette/redigere egne kurser og styre hvilke grupper
  et kursus er synligt for.
- Visning af status pr. kursus, hvor data findes (fx: Ikke startet / Tilmeldt
  / I gang / Gennemført).

**Uden for v1 (kandidater til senere):**
- Tilmelding til kurser direkte i appen (v1 kan i stedet linke videre til
  udbyderens egen portal — se åbent spørgsmål 1).
- Notifikationer/påmindelser om deadlines.
- Tværgående rapportering til HR/ledelse (fx hvem mangler obligatoriske
  kurser).
- Fuldautomatisk synkronisering fra GoLearn/RGD, hvis leverandørerne ikke kan
  levere det til v1 — data kan i så fald være manuelt importeret/vedligeholdt
  i en overgangsperiode.

## 4. Brugerroller

| Rolle | Adgang |
|---|---|
| Medarbejder | Ser eget overblik, filtreret efter egne grupper. |
| Administrator | Opretter/redigerer kurser (egne/tredjepart), styrer gruppe-synlighed. Evt. tværgående overblik (se åbent spørgsmål 2). |

**Åbent spørgsmål:** hvem skal have administrator-rollen (HR, ledelse, IT)?

## 5. Datamodel (foreløbig, høj niveau)

- **Medarbejder** — fra Entra ID (navn, e-mail, gruppetilhørsforhold).
- **Medarbejdergruppe** — fra Entra ID-grupper.
- **Kursusudbyder** — GoLearn / RGD (Plan2Learn) / Intern / Tredjepart.
- **Kursus** — titel, beskrivelse, udbyder, obligatorisk/frivillig,
  gyldighedsperiode, hvilke grupper det er synligt for.
- **Deltagelse/status** — kobling mellem medarbejder og kursus: status, dato
  for evt. gennemførelse, kilde til status (automatisk fra udbyder vs.
  manuelt registreret).

## 6. Integrationer

### Microsoft Entra ID (SSO)
Login og gruppetilhørsforhold. Ingen kendte åbne spørgsmål.

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
Oprettes og vedligeholdes direkte i appens admin-funktion. Ingen ekstern
integration.

### Tredjepartskurser
**Antagelse:** håndteres i v1 på samme måde som egne kurser (oprettes manuelt
i kataloget af en administrator), medmindre en konkret tredjepartsudbyder
senere kræver sin egen integration.

## 7. Ikke-funktionelle krav

- **GDPR:** kursus-completion er personoplysninger om ansatte.
  Databehandleraftaler med GoLearn og RGD bør være på plads, før deres data
  kobles på — dette bør indgå i leverandørdialogen, ikke kun i selve
  byggeriet.
- **Sprog:** dansk brugerflade.
- **Adgang:** kun medarbejdere med gyldigt virksomhedslogin (Entra ID).
- **Hosting:** Azure forventes at give bedst mening pga. det eksisterende
  Microsoft-økosystem — endelig beslutning tages i arkitekturfasen.

## 8. Åbne spørgsmål der skal afklares

1. Skal medarbejdere kunne tilmelde sig kurser direkte i appen, eller kun se
   overblikket og blive linket videre til udbyderens egen portal for
   tilmelding?
2. Skal der være en administrator-/HR-visning med overblik på tværs af
   medarbejdere (fx opfølgning på obligatoriske kurser)?
3. Hvilke medarbejdergrupper findes reelt i praksis, og er de allerede opsat
   som Entra ID-grupper?
4. Hvordan defineres "gennemført" ensartet på tværs af udbydere (bestået
   prøve, registreret fremmøde, andet)?
5. Skal deadline-håndtering/påmindelser for obligatoriske kurser være med i
   v1, eller er det en senere udvidelse?
6. **GoLearn-svar afventes:** hvilken integrationsmodel tilbyder de?
7. **RGD-svar afventes:** findes der virksomheds-adgang til Plan2Learn, eller
   kun individuelle konti?

## 9. Success-kriterier for v1

- En medarbejder kan logge ind med sit virksomhedslogin og se et overblik
  over egne kurser (gennemførte + relevante), filtreret efter sin(e)
  gruppe(r).
- En administrator kan oprette et internt kursus/workshop og styre hvilke
  grupper det er synligt for.
- Kurser fra GoLearn og RGD indgår i overblikket — enten via reel integration
  eller via manuelt administreret data, afhængigt af leverandørsvar.
