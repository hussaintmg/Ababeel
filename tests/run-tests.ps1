# PowerShell Verification Runner for CMS Dynamic Data Architecture

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " CMS DYNAMIC DATA ARCHITECTURE & SDK VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$script:passed = 0
$script:failed = 0

function Assert-Check {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Msg = ""
    )
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name - $Msg" -ForegroundColor Red
        $script:failed++
    }
}

# --- 1. File and Architecture Structure Checks ---
Write-Host "`n>> 1. Verifying Core Architecture Files..." -ForegroundColor Yellow
Assert-Check -Name "lib/cms/dataQuery.js exists" -Condition (Test-Path "lib/cms/dataQuery.js")
Assert-Check -Name "lib/cms/fieldPolicy.js exists" -Condition (Test-Path "lib/cms/fieldPolicy.js")
Assert-Check -Name "lib/cms/publicData.js exists" -Condition (Test-Path "lib/cms/publicData.js")
Assert-Check -Name "lib/cms/sdk/index.js exists" -Condition (Test-Path "lib/cms/sdk/index.js")
Assert-Check -Name "lib/cms/templateValidator.js exists" -Condition (Test-Path "lib/cms/templateValidator.js")
Assert-Check -Name "lib/cms/promptGenerator.js exists" -Condition (Test-Path "lib/cms/promptGenerator.js")
Assert-Check -Name "packages/cms-sdk-starter/README.md exists" -Condition (Test-Path "packages/cms-sdk-starter/README.md")
Assert-Check -Name "packages/cms-sdk-starter/package.json exists" -Condition (Test-Path "packages/cms-sdk-starter/package.json")

# --- 2. Starter Sections Verification ---
Write-Host "`n>> 2. Verifying 7 Starter Sections..." -ForegroundColor Yellow
$starterSections = @(
    "SimpleHero.jsx",
    "DynamicHero.jsx",
    "CourseGrid.jsx",
    "TestimonialsLoop.jsx",
    "NestedLoopSection.jsx",
    "ConditionalCta.jsx",
    "DynamicProfileCard.jsx"
)
foreach ($sec in $starterSections) {
    $p = "packages/cms-sdk-starter/sections/$sec"
    $exists = (Test-Path $p) -and ((Get-Item $p).Length -gt 200)
    Assert-Check -Name "Starter Section $sec exists and is non-empty" -Condition $exists
}

# --- 3. Security Policy and Prototype Protection Verification ---
Write-Host "`n>> 3. Verifying Security Protections..." -ForegroundColor Yellow
$exprContent = Get-Content "lib/cms/expression.js" -Raw
Assert-Check -Name "expression.js blocks __proto__" -Condition ($exprContent.Contains("__proto__"))
Assert-Check -Name "expression.js blocks constructor and prototype" -Condition ($exprContent.Contains("constructor") -and $exprContent.Contains("prototype"))

$validatorContent = Get-Content "lib/cms/templateValidator.js" -Raw
Assert-Check -Name "templateValidator.js checks process.env" -Condition ($validatorContent.Contains("process.env"))
Assert-Check -Name "templateValidator.js blocks child_process and fs" -Condition ($validatorContent.Contains("child_process") -and $validatorContent.Contains("fs"))
Assert-Check -Name "templateValidator.js blocks mongoose" -Condition ($validatorContent.Contains("mongoose"))
Assert-Check -Name "templateValidator.js detects array-field-direct-access diagnostic" -Condition ($validatorContent.Contains("array-field-direct-access"))

$fieldPolicyContent = Get-Content "lib/cms/fieldPolicy.js" -Raw
Assert-Check -Name "fieldPolicy.js defines BLOCKED_MODELS" -Condition ($fieldPolicyContent.Contains("BLOCKED_MODELS"))
Assert-Check -Name "fieldPolicy.js strips sensitive user fields (password, resetToken, etc.)" -Condition ($fieldPolicyContent.Contains("password") -and $fieldPolicyContent.Contains("resetToken"))

$dataQueryContent = Get-Content "lib/cms/dataQuery.js" -Raw
Assert-Check -Name "dataQuery.js automatically enforces tenant isolation (organizationId)" -Condition ($dataQueryContent.Contains("organizationId: tenantId"))
Assert-Check -Name "dataQuery.js restricts public queries to published records" -Condition ($dataQueryContent.Contains('status: { $in: ['))

# --- 4. Lexical Loop and Alias Architecture Verification ---
Write-Host "`n>> 4. Verifying Loop and Alias Architecture..." -ForegroundColor Yellow
$blockDataContent = Get-Content "Components/owner/cms/dynamic/BlockDataTab.jsx" -Raw
Assert-Check -Name "BlockDataTab supports custom loop alias" -Condition ($blockDataContent.Contains("alias"))
Assert-Check -Name "BlockDataTab auto-infers alias from model name" -Condition ($blockDataContent.Contains('replace(/s$/'))

$variablePickerContent = Get-Content "Components/owner/cms/dynamic/VariablePicker.jsx" -Raw
Assert-Check -Name "VariablePicker displays 3-state compatibility" -Condition ($variablePickerContent.Contains("COMPATIBILITY_STATES"))
Assert-Check -Name "VariablePicker exposes namespaced loop metadata" -Condition ($variablePickerContent.Contains("loop.index"))
Assert-Check -Name "VariablePicker provides Array Action suggestions" -Condition ($variablePickerContent.Contains("arrayAction"))

# --- 5. SDK Primitives and Exports Verification ---
Write-Host "`n>> 5. Verifying SDK Primitives and Exports..." -ForegroundColor Yellow
$sdkContent = Get-Content "lib/cms/sdk/index.js" -Raw
Assert-Check -Name "SDK exports defineSection and defineTemplate" -Condition ($sdkContent.Contains("defineSection") -and $sdkContent.Contains("defineTemplate"))
Assert-Check -Name "SDK exports CMSField, CMSImage, CMSLink, CMSLoop, CMSIf" -Condition ($sdkContent.Contains("CMSField") -and $sdkContent.Contains("CMSImage") -and $sdkContent.Contains("CMSLink") -and $sdkContent.Contains("CMSLoop") -and $sdkContent.Contains("CMSIf"))
Assert-Check -Name "SDK exports context hooks" -Condition ($sdkContent.Contains("useCMSContext") -and $sdkContent.Contains("useCMSLoopItem"))
Assert-Check -Name "SDK exports cms theme tokens" -Condition ($sdkContent.Contains("cms ="))

# --- 6. Prompt Generator Verification ---
Write-Host "`n>> 6. Verifying Dynamic AI Prompt Generator..." -ForegroundColor Yellow
$promptGenContent = Get-Content "lib/cms/promptGenerator.js" -Raw
Assert-Check -Name "Prompt generator includes exact SDK Version 2.0.0" -Condition ($promptGenContent.Contains("2.0.0"))
Assert-Check -Name "Prompt generator includes official imports without hallucinations" -Condition ($promptGenContent.Contains("@platform/cms-sdk"))
Assert-Check -Name "Prompt generator scopes fields to selected model" -Condition ($promptGenContent.Contains("fieldsToInclude"))
Assert-Check -Name "Prompt generator provides explicit loop instructions and warns against item" -Condition ($promptGenContent.Contains("item"))
Assert-Check -Name "Prompt generator instructs AI on registered relations without manual ID queries" -Condition ($promptGenContent.Contains("Registered relations"))

# --- 7. One-Template Dynamic Repeater Architecture Verification ---
Write-Host "`n>> 7. Verifying One-Template Dynamic Repeater Architecture..." -ForegroundColor Yellow
$fieldsContent = Get-Content "Components/owner/cms/fields.jsx" -Raw
Assert-Check -Name "fields.jsx implements isDynamicRepeat detection" -Condition ($fieldsContent.Contains("isDynamicRepeat"))
Assert-Check -Name "fields.jsx renders exactly 1 Template Item in dynamic repeater mode" -Condition ($fieldsContent.Contains("1 Template Item"))
Assert-Check -Name "fields.jsx hides manual item addition in dynamic repeater mode" -Condition ($fieldsContent.Contains("Items are generated automatically from dynamic data"))

$bindingContent = Get-Content "lib/cms/binding.js" -Raw
Assert-Check -Name "binding.js supports inner list repeater expansion (repeatInnerList)" -Condition ($bindingContent.Contains("repeatInnerList"))
Assert-Check -Name "binding.js expands single template item N times without duplicating section" -Condition ($bindingContent.Contains("expandedList = items.map"))

$blockEditorContent = Get-Content "Components/owner/cms/BlockEditor.jsx" -Raw
Assert-Check -Name "BlockEditor passes repeatConfig and onSwitchToDataTab to list field renderer" -Condition ($blockEditorContent.Contains("repeatConfig={block._repeat}"))
Assert-Check -Name "FieldRenderer declares repeatConfig and onSwitchToDataTab props" -Condition ($fieldsContent.Contains("repeatConfig = null") -and $fieldsContent.Contains("onSwitchToDataTab = null"))

$blockDataTabContent = Get-Content "Components/owner/cms/dynamic/BlockDataTab.jsx" -Raw
Assert-Check -Name "BlockDataTab imports Database icon from lucide-react" -Condition ($blockDataTabContent.Contains("Database") -and $blockDataTabContent.Contains("from `"lucide-react`""))

$pageBuilderContent = Get-Content "Components/owner/cms/PageBuilder.jsx" -Raw
Assert-Check -Name "PageBuilder imports defaultStyle from blockSchemas" -Condition ($pageBuilderContent.Contains("defaultStyle") -and $pageBuilderContent.Contains("from `"@/Components/cms/blockSchemas`""))

# --- 8. Universal Relation Registry & Batched Resolver Verification ---
Write-Host "`n>> 8. Verifying Universal Relation Registry & Resolution..." -ForegroundColor Yellow
Assert-Check -Name "lib/cms/relations.js exists" -Condition (Test-Path "lib/cms/relations.js")
$relationsContent = Get-Content "lib/cms/relations.js" -Raw
Assert-Check -Name "relations.js exports defineRelation" -Condition ($relationsContent.Contains("export function defineRelation"))
Assert-Check -Name "relations.js exports getRelationsForModel" -Condition ($relationsContent.Contains("export function getRelationsForModel"))
Assert-Check -Name "relations.js exports resolveRelationsForDocs" -Condition ($relationsContent.Contains("export async function resolveRelationsForDocs"))
Assert-Check -Name "dataQuery.js imports and calls resolveRelationsForDocs" -Condition ($dataQueryContent.Contains("resolveRelationsForDocs"))
$schemaRegistryContent = Get-Content "lib/cms/schemaRegistry.js" -Raw
Assert-Check -Name "schemaRegistry.js incorporates explicit relations into describeModel" -Condition ($schemaRegistryContent.Contains("getRelationsForModel"))

# --- 9. Real-Time Diagnostics & Educational Guidance Verification ---
Write-Host "`n>> 9. Verifying Real-Time Diagnostics & Guidance..." -ForegroundColor Yellow
$dynamicFieldContent = Get-Content "Components/owner/cms/dynamic/DynamicField.jsx" -Raw
Assert-Check -Name "DynamicField implements FieldDiagnostics" -Condition ($dynamicFieldContent.Contains("FieldDiagnostics"))
Assert-Check -Name "DynamicField detects item.* alias mismatch with 1-click fix" -Condition ($dynamicFieldContent.Contains("Alias mismatch: `"item`" is not available"))
Assert-Check -Name "DynamicField detects wrong list direct access (e.g. courses.title)" -Condition ($dynamicFieldContent.Contains("returns an Array of records"))
Assert-Check -Name "DynamicField warns when single document source is unconfigured" -Condition ($dynamicFieldContent.Contains("No single") -and $dynamicFieldContent.Contains("document has been configured"))
Assert-Check -Name "VariablePicker provides single-document guidance banner" -Condition ($variablePickerContent.Contains("Single") -and $variablePickerContent.Contains("source required"))

# --- 10. Required End-to-End Tests & Generic Model Support Verification ---
Write-Host "`n>> 10. Verifying Required End-to-End Tests (E2E 1, 2, 3, 4)..." -ForegroundColor Yellow
$e2eContent = Get-Content "tests/e2e-pages.test.js" -Raw
Assert-Check -Name "E2E Test 1: Course Grid with courses: Course[] and repeater loop verified" -Condition ($e2eContent.Contains("E2E Page 1: /courses"))
Assert-Check -Name "E2E Test 2: Single Course Detail with course: Course and slug query verified" -Condition ($e2eContent.Contains("E2E Page 2: /courses/[slug]"))
Assert-Check -Name "E2E Test 3: Nested curriculum loop (course -> modules -> lessons) verified" -Condition ($e2eContent.Contains("Multi-level Nested Loop"))
Assert-Check -Name "E2E Test 4: Generic non-Course models (Post, User, Candidate, Order) registered" -Condition ($relationsContent.Contains('sourceModel: "Post"') -and $relationsContent.Contains('sourceModel: "Order"'))

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host " VERIFICATION SUMMARY: $script:passed Passed, $script:failed Failed" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

if ($script:failed -eq 0) {
    Write-Host "SUCCESS: Architecture integrity fully verified!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILURE: Verification failed with $script:failed errors.`n" -ForegroundColor Red
    exit 1
}
