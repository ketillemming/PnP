<#
.SYNOPSIS
    Opretter Dataverse for Teams-tabellerne til Udrulningsstyring-appen
    (Bruger, Projekt, ProjektAdgang, Afdeling, Aktivitet), som beskrevet i
    ../docs/datamodel.md.

.DESCRIPTION
    Kalder Dataverse Web API's metadata-endpoints direkte (EntityDefinitions /
    GlobalOptionSetDefinitions / RelationshipDefinitions) for at oprette
    tabeller, kolonner og lookup-relationer. Scriptet er idempotent for
    tabeller/kolonner: det springer over alt, der allerede findes, så det er
    trygt at køre igen efter en fejl midtvejs.

.PREREQUISITES
    - PowerShell 7+
    - Az.Accounts-modulet: Install-Module Az.Accounts -Scope CurrentUser
    - Du skal være logget ind med en konto, der har System Customizer- eller
      System Administrator-rollen i Dataverse for Teams-miljøet.
    - Kør Connect-AzAccount, FØR du kører dette script.

.PARAMETER EnvironmentUrl
    URL'en til jeres Dataverse for Teams-miljø, fx
    https://orgxxxxxxxx.crm4.dynamics.com
    Findes i Power Apps Studio under Løsninger -> Udviklerressourcer, eller
    via Power Platform admin center -> miljøet -> Detaljer -> Miljø-URL.

.PARAMETER Prefix
    Jeres miljøs standard-udgiverpræfiks (uden bindestreg), fx "cra1b".
    Findes i Power Apps Studio under Løsninger -> Standardløsning -> Udgiver.

.EXAMPLE
    ./provision-dataverse.ps1 -EnvironmentUrl "https://orgxxxxxxxx.crm4.dynamics.com" -Prefix "cra1b"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$EnvironmentUrl,

    [Parameter(Mandatory = $true)]
    [string]$Prefix
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ApiVersion = 'v9.2'
$BaseUrl = "$($EnvironmentUrl.TrimEnd('/'))/api/data/$ApiVersion"

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

function Get-DataverseHeaders {
    $tokenResult = Get-AzAccessToken -ResourceUrl $EnvironmentUrl
    if (-not $tokenResult -or -not $tokenResult.Token) {
        throw "Kunne ikke hente adgangstoken. Kør Connect-AzAccount først."
    }
    return @{
        'Authorization'    = "Bearer $($tokenResult.Token)"
        'Content-Type'     = 'application/json; charset=utf-8'
        'OData-MaxVersion' = '4.0'
        'OData-Version'    = '4.0'
        'Accept'           = 'application/json'
    }
}

function Invoke-Dataverse {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body,
        [switch]$IgnoreConflict
    )
    $uri = "$BaseUrl/$Path"
    $headers = Get-DataverseHeaders
    $jsonBody = if ($Body) { $Body | ConvertTo-Json -Depth 20 } else { $null }
    try {
        if ($jsonBody) {
            return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $jsonBody
        }
        else {
            return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($IgnoreConflict -and $statusCode -eq 409) {
            Write-Host "  (findes allerede, springer over)" -ForegroundColor DarkYellow
            return $null
        }
        Write-Error "Dataverse-kald fejlede ($Method $Path): $($_.Exception.Message)"
        throw
    }
}

function Test-TableExists {
    param([string]$LogicalName)
    try {
        Invoke-Dataverse -Method Get -Path "EntityDefinitions(LogicalName='$LogicalName')?`$select=LogicalName" | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-ColumnExists {
    param([string]$EntityLogicalName, [string]$ColumnLogicalName)
    try {
        Invoke-Dataverse -Method Get -Path "EntityDefinitions(LogicalName='$EntityLogicalName')/Attributes(LogicalName='$ColumnLogicalName')?`$select=LogicalName" | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# ---------------------------------------------------------------------------
# Tabel- og kolonne-opret-funktioner
# ---------------------------------------------------------------------------

function New-Table {
    param(
        [Parameter(Mandatory = $true)][string]$SchemaName,
        [Parameter(Mandatory = $true)][string]$DisplayName,
        [Parameter(Mandatory = $true)][string]$DisplayCollectionName,
        [Parameter(Mandatory = $true)][string]$PrimaryColumnSchemaName,
        [Parameter(Mandatory = $true)][string]$PrimaryColumnDisplayName
    )
    $logicalName = $SchemaName.ToLower()
    if (Test-TableExists -LogicalName $logicalName) {
        Write-Host "Tabel '$DisplayName' findes allerede." -ForegroundColor DarkYellow
        return
    }

    Write-Host "Opretter tabel '$DisplayName' ($SchemaName)..." -ForegroundColor Cyan
    $body = @{
        '@odata.type'                  = 'Microsoft.Dynamics.CRM.EntityMetadata'
        SchemaName                     = $SchemaName
        DisplayName                    = @{
            '@odata.type'      = 'Microsoft.Dynamics.CRM.Label'
            LocalizedLabels    = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $DisplayName; LanguageCode = 1030 })
        }
        DisplayCollectionName          = @{
            '@odata.type'      = 'Microsoft.Dynamics.CRM.Label'
            LocalizedLabels    = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $DisplayCollectionName; LanguageCode = 1030 })
        }
        OwnershipType                  = 'UserOwned'
        IsActivity                     = $false
        HasNotes                       = $false
        HasActivities                  = $false
        PrimaryNameAttribute           = $PrimaryColumnSchemaName.ToLower()
        Attributes                     = @(
            @{
                '@odata.type'   = 'Microsoft.Dynamics.CRM.StringAttributeMetadata'
                SchemaName      = $PrimaryColumnSchemaName
                RequiredLevel   = @{ Value = 'ApplicationRequired' }
                MaxLength       = 200
                DisplayName     = @{
                    '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
                    LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $PrimaryColumnDisplayName; LanguageCode = 1030 })
                }
            }
        )
    }
    Invoke-Dataverse -Method Post -Path 'EntityDefinitions' -Body $body -IgnoreConflict | Out-Null
}

function New-TextColumn {
    param(
        [Parameter(Mandatory = $true)][string]$EntitySchemaName,
        [Parameter(Mandatory = $true)][string]$SchemaName,
        [Parameter(Mandatory = $true)][string]$DisplayName,
        [int]$MaxLength = 200,
        [bool]$Required = $false,
        [switch]$MultiLine
    )
    $entityLogical = $EntitySchemaName.ToLower()
    $columnLogical = $SchemaName.ToLower()
    if (Test-ColumnExists -EntityLogicalName $entityLogical -ColumnLogicalName $columnLogical) {
        Write-Host "  Kolonne '$DisplayName' findes allerede." -ForegroundColor DarkYellow
        return
    }
    Write-Host "  Tilføjer tekst-kolonne '$DisplayName'..." -ForegroundColor Gray
    $odataType = if ($MultiLine) { 'Microsoft.Dynamics.CRM.MemoAttributeMetadata' } else { 'Microsoft.Dynamics.CRM.StringAttributeMetadata' }
    $body = @{
        '@odata.type' = $odataType
        SchemaName    = $SchemaName
        MaxLength     = $MaxLength
        RequiredLevel = @{ Value = if ($Required) { 'ApplicationRequired' } else { 'None' } }
        DisplayName   = @{
            '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
            LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $DisplayName; LanguageCode = 1030 })
        }
    }
    Invoke-Dataverse -Method Post -Path "EntityDefinitions(LogicalName='$entityLogical')/Attributes" -Body $body -IgnoreConflict | Out-Null
}

function New-DateColumn {
    param(
        [Parameter(Mandatory = $true)][string]$EntitySchemaName,
        [Parameter(Mandatory = $true)][string]$SchemaName,
        [Parameter(Mandatory = $true)][string]$DisplayName,
        [bool]$Required = $false
    )
    $entityLogical = $EntitySchemaName.ToLower()
    $columnLogical = $SchemaName.ToLower()
    if (Test-ColumnExists -EntityLogicalName $entityLogical -ColumnLogicalName $columnLogical) {
        Write-Host "  Kolonne '$DisplayName' findes allerede." -ForegroundColor DarkYellow
        return
    }
    Write-Host "  Tilføjer dato-kolonne '$DisplayName'..." -ForegroundColor Gray
    $body = @{
        '@odata.type' = 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata'
        SchemaName    = $SchemaName
        Format        = 'DateOnly'
        RequiredLevel = @{ Value = if ($Required) { 'ApplicationRequired' } else { 'None' } }
        DisplayName   = @{
            '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
            LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $DisplayName; LanguageCode = 1030 })
        }
    }
    Invoke-Dataverse -Method Post -Path "EntityDefinitions(LogicalName='$entityLogical')/Attributes" -Body $body -IgnoreConflict | Out-Null
}

function New-ChoiceColumn {
    param(
        [Parameter(Mandatory = $true)][string]$EntitySchemaName,
        [Parameter(Mandatory = $true)][string]$SchemaName,
        [Parameter(Mandatory = $true)][string]$DisplayName,
        [Parameter(Mandatory = $true)][hashtable]$Options, # @{ 1 = 'Label1'; 2 = 'Label2' }
        [bool]$Required = $true
    )
    $entityLogical = $EntitySchemaName.ToLower()
    $columnLogical = $SchemaName.ToLower()
    if (Test-ColumnExists -EntityLogicalName $entityLogical -ColumnLogicalName $columnLogical) {
        Write-Host "  Kolonne '$DisplayName' findes allerede." -ForegroundColor DarkYellow
        return
    }
    Write-Host "  Tilføjer valgliste-kolonne '$DisplayName'..." -ForegroundColor Gray
    $optionMetadata = $Options.GetEnumerator() | Sort-Object Name | ForEach-Object {
        @{
            Value = [int]$_.Name
            Label = @{
                '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
                LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $_.Value; LanguageCode = 1030 })
            }
        }
    }
    $body = @{
        '@odata.type' = 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata'
        SchemaName    = $SchemaName
        RequiredLevel = @{ Value = if ($Required) { 'ApplicationRequired' } else { 'None' } }
        DisplayName   = @{
            '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
            LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $DisplayName; LanguageCode = 1030 })
        }
        OptionSet     = @{
            '@odata.type'  = 'Microsoft.Dynamics.CRM.OptionSetMetadata'
            IsGlobal       = $false
            OptionSetType  = 'Picklist'
            Options        = @($optionMetadata)
        }
    }
    Invoke-Dataverse -Method Post -Path "EntityDefinitions(LogicalName='$entityLogical')/Attributes" -Body $body -IgnoreConflict | Out-Null
}

function New-LookupColumn {
    param(
        [Parameter(Mandatory = $true)][string]$FromEntitySchemaName,   # tabellen der får lookup-feltet
        [Parameter(Mandatory = $true)][string]$ToEntitySchemaName,     # tabellen der peges på
        [Parameter(Mandatory = $true)][string]$LookupSchemaName,       # navn på selve lookup-kolonnen
        [Parameter(Mandatory = $true)][string]$LookupDisplayName,
        [Parameter(Mandatory = $true)][string]$RelationshipSchemaName,
        [bool]$Required = $false
    )
    $fromLogical = $FromEntitySchemaName.ToLower()
    $lookupLogical = $LookupSchemaName.ToLower()
    if (Test-ColumnExists -EntityLogicalName $fromLogical -ColumnLogicalName $lookupLogical) {
        Write-Host "  Lookup '$LookupDisplayName' findes allerede." -ForegroundColor DarkYellow
        return
    }
    Write-Host "  Tilføjer lookup '$LookupDisplayName' -> $ToEntitySchemaName..." -ForegroundColor Gray
    $body = @{
        '@odata.type'            = 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata'
        SchemaName               = $RelationshipSchemaName
        ReferencedEntity         = $ToEntitySchemaName.ToLower()
        ReferencingEntity        = $fromLogical
        ReferencedAttribute      = "$($ToEntitySchemaName.ToLower())id"
        Lookup                   = @{
            '@odata.type' = 'Microsoft.Dynamics.CRM.LookupAttributeMetadata'
            SchemaName    = $LookupSchemaName
            RequiredLevel = @{ Value = if ($Required) { 'ApplicationRequired' } else { 'None' } }
            DisplayName   = @{
                '@odata.type'   = 'Microsoft.Dynamics.CRM.Label'
                LocalizedLabels = @(@{ '@odata.type' = 'Microsoft.Dynamics.CRM.LocalizedLabel'; Label = $LookupDisplayName; LanguageCode = 1030 })
            }
        }
    }
    Invoke-Dataverse -Method Post -Path 'RelationshipDefinitions' -Body $body -IgnoreConflict | Out-Null
}

# ---------------------------------------------------------------------------
# Skema — se ../docs/datamodel.md for begrundelse for hvert valg
# ---------------------------------------------------------------------------

Write-Host "`n=== Udrulningsstyring: opretter Dataverse-tabeller ===" -ForegroundColor Green
Write-Host "Miljø: $EnvironmentUrl"
Write-Host "Præfiks: ${Prefix}_`n"

function P { param($name) "${Prefix}_$name" }

# --- Bruger ---
New-Table -SchemaName (P 'Bruger') -DisplayName 'Bruger' -DisplayCollectionName 'Brugere' `
    -PrimaryColumnSchemaName (P 'navn') -PrimaryColumnDisplayName 'Navn'
New-TextColumn -EntitySchemaName (P 'Bruger') -SchemaName (P 'email') -DisplayName 'Email' -MaxLength 200 -Required $true
New-ChoiceColumn -EntitySchemaName (P 'Bruger') -SchemaName (P 'rolle') -DisplayName 'Rolle' -Options @{ 1 = 'Admin'; 2 = 'Medarbejder' }

# --- Projekt ---
New-Table -SchemaName (P 'Projekt') -DisplayName 'Projekt' -DisplayCollectionName 'Projekter' `
    -PrimaryColumnSchemaName (P 'navn') -PrimaryColumnDisplayName 'Navn'
New-DateColumn -EntitySchemaName (P 'Projekt') -SchemaName (P 'golivedato') -DisplayName 'Go-live dato'
New-LookupColumn -FromEntitySchemaName (P 'Projekt') -ToEntitySchemaName (P 'Bruger') `
    -LookupSchemaName (P 'oprettetaf') -LookupDisplayName 'Oprettet af' `
    -RelationshipSchemaName (P 'projekt_oprettetaf_bruger') -Required $true

# --- Afdeling ---
New-Table -SchemaName (P 'Afdeling') -DisplayName 'Afdeling' -DisplayCollectionName 'Afdelinger' `
    -PrimaryColumnSchemaName (P 'navn') -PrimaryColumnDisplayName 'Navn'
New-LookupColumn -FromEntitySchemaName (P 'Afdeling') -ToEntitySchemaName (P 'Projekt') `
    -LookupSchemaName (P 'projekt') -LookupDisplayName 'Projekt' `
    -RelationshipSchemaName (P 'afdeling_projekt') -Required $true

# --- ProjektAdgang ---
New-Table -SchemaName (P 'ProjektAdgang') -DisplayName 'ProjektAdgang' -DisplayCollectionName 'ProjektAdgange' `
    -PrimaryColumnSchemaName (P 'navn') -PrimaryColumnDisplayName 'Navn'
New-LookupColumn -FromEntitySchemaName (P 'ProjektAdgang') -ToEntitySchemaName (P 'Projekt') `
    -LookupSchemaName (P 'projekt') -LookupDisplayName 'Projekt' `
    -RelationshipSchemaName (P 'projektadgang_projekt') -Required $true
New-LookupColumn -FromEntitySchemaName (P 'ProjektAdgang') -ToEntitySchemaName (P 'Bruger') `
    -LookupSchemaName (P 'bruger') -LookupDisplayName 'Bruger' `
    -RelationshipSchemaName (P 'projektadgang_bruger') -Required $true
New-ChoiceColumn -EntitySchemaName (P 'ProjektAdgang') -SchemaName (P 'adgangsniveau') -DisplayName 'Adgangsniveau' `
    -Options @{ 1 = 'Redaktør'; 2 = 'Læser' }

# --- Aktivitet ---
New-Table -SchemaName (P 'Aktivitet') -DisplayName 'Aktivitet' -DisplayCollectionName 'Aktiviteter' `
    -PrimaryColumnSchemaName (P 'navn') -PrimaryColumnDisplayName 'Navn'
New-LookupColumn -FromEntitySchemaName (P 'Aktivitet') -ToEntitySchemaName (P 'Projekt') `
    -LookupSchemaName (P 'projekt') -LookupDisplayName 'Projekt' `
    -RelationshipSchemaName (P 'aktivitet_projekt') -Required $true
New-LookupColumn -FromEntitySchemaName (P 'Aktivitet') -ToEntitySchemaName (P 'Afdeling') `
    -LookupSchemaName (P 'afdeling') -LookupDisplayName 'Afdeling' `
    -RelationshipSchemaName (P 'aktivitet_afdeling') -Required $false
New-LookupColumn -FromEntitySchemaName (P 'Aktivitet') -ToEntitySchemaName (P 'Bruger') `
    -LookupSchemaName (P 'ansvarligbruger') -LookupDisplayName 'Ansvarlig (bruger)' `
    -RelationshipSchemaName (P 'aktivitet_ansvarligbruger') -Required $false
New-ChoiceColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'fase') -DisplayName 'Fase' `
    -Options @{ 1 = 'Bevidsthed (Awareness)'; 2 = 'Ønske (Desire)'; 3 = 'Viden (Knowledge)'; 4 = 'Evne (Ability)'; 5 = 'Fastholdelse (Reinforcement)' }
New-ChoiceColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'type') -DisplayName 'Type' `
    -Options @{ 1 = 'Kommunikation'; 2 = 'Fælles igangsætning'; 3 = 'Træning'; 4 = 'Opfølgning' }
New-ChoiceColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'status') -DisplayName 'Status' `
    -Options @{ 1 = 'Ikke startet'; 2 = 'Planlagt'; 3 = 'Gennemført'; 4 = 'Udskudt' }
New-TextColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'beskrivelse') -DisplayName 'Beskrivelse' -MaxLength 2000 -Required $true -MultiLine
New-TextColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'ansvarligfritekst') -DisplayName 'Ansvarlig (fritekst)' -MaxLength 200
New-DateColumn -EntitySchemaName (P 'Aktivitet') -SchemaName (P 'planlagtdato') -DisplayName 'Planlagt dato'

Write-Host "`n=== Færdig. Åbn Power Apps Studio -> Tabeller for at se resultatet. ===" -ForegroundColor Green
Write-Host "Husk: publicér evt. custom ændringer via Løsninger -> Standardløsning -> Publicér alle tilpasninger." -ForegroundColor Yellow
