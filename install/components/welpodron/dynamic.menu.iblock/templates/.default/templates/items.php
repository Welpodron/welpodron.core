<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$arData = [
    'arParams' => $arParams,
    'template' => $template,
    'templateName' => $templateName,
    'templateFile' => $templateFile,
    'templateFolder' => $templateFolder,
    'parentTemplateFolder' => $parentTemplateFolder,
    'templateData' => $templateData,
    'component' => $component,
    'componentPath' => $componentPath
];

?>



<ul <?=($arResult['DEPTH_LEVEL'] ? 'class="t:grid-col-2 d:grid-col-3"' : '')?>>
<?
if (is_array($arResult['SECTIONS']) && $arResult['SECTIONS']) {
    foreach ($arResult['SECTIONS'] as $arSection) {
        if ($arSection['UF_SKRIT'] === '1') {
            continue;
        }

        $arData['arResult'] = $arSection;

        $APPLICATION->IncludeFile($templateFolder . '/templates/item.php', $arData, ['MODE' => 'php', 'SHOW_BORDER' => false]);
    }
}?>
</ul>
