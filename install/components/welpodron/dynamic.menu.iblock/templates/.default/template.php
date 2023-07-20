<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

$arData = [
    'arResult' => $arResult,
    'arParams' => $arParams,
    'template' => $this,
    'templateName' => $templateName,
    'templateFile' => $templateFile,
    'templateFolder' => $templateFolder,
    'parentTemplateFolder' => $parentTemplateFolder,
    'templateData' => $templateData,
    'component' => $component,
    'componentPath' => $componentPath
];

?>
<?if ($arResult['SECTIONS']): ?>
<div>
    <div class="sidebar-container t:d-none">
        <button
data-collapse-initiator="true"
data-collapse-id="collapse_menu_sidebar_js"
type="button"
class="sidebar-collapse-btn-main t:d-none"
>
Каталог мебели
</button>
    </div>
<nav
    class="w-collapse w-collapse-max"
    id="collapse_menu_sidebar_js"
    data-collapse="true"
    data-collapse-max="768"
>
<?$APPLICATION->IncludeFile($templateFolder . '/templates/items.php', $arData, ['MODE' => 'php', 'SHOW_BORDER' => false]);?>
	<?//$component->buildTree($arResult['SECTIONS'])?>
</nav>
</div>
<?endif;?>
