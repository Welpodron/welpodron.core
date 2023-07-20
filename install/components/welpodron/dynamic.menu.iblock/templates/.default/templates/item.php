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

$arData['arResult']['SECTIONS'] = $arResult['SECTIONS'];
$arData['arResult']['DEPTH_LEVEL'] = $arResult['DEPTH_LEVEL'];

?>

<li <?=($arResult['SECTIONS'] ? 'class="hover-relative"' : '')?>>
  <div class="sidebar-link-parent" <?=($arResult['SECTIONS'] ? 'data-hover-initiator="true"' : '')?>>
    <a href="<?=$arResult['SECTION_PAGE_URL']?>">
      <?if ((int) $arResult['DEPTH_LEVEL'] == 1 && $arResult['PICTURE']['SRC']) {?>
        <span class="sidebar-img-wrapper">
          <img class="sidebar-img" src="<?=$arResult['PICTURE']['SRC']?>" loading="lazy">
        </span>
      <?}?>
      <span><?=$arResult['NAME']?></span>
    </a>
    <?if (is_array($arResult['SECTIONS']) && $arResult['SECTIONS']) {?>
      <button type="button" data-collapse-id="collapse_<?=$arResult['ID']?>" data-collapse-initiator="true" class="t:d-none sidebar-collapse-btn">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"  stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
    <?}?>
  </div>
  <?if (is_array($arResult['SECTIONS']) && $arResult['SECTIONS']) {?>
    <div id="collapse_<?=$arResult['ID']?>" class="w-collapse w-collapse-max hover hover-min hover-min-absolute-left" data-collapse="true" data-collapse-max="768" data-hover="true">
      <?$APPLICATION->IncludeFile($templateFolder . '/templates/items.php', $arData, ['MODE' => 'php', 'SHOW_BORDER' => false])?>
    </div>
  <?}?>
</li>
