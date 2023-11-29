<?
if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */
?>

<? if ($arResult) : ?>
    <ul>
        <? foreach ($arResult['ITEMS'] as $arItem) : ?>
            <li id="<?= $this->GetEditAreaId($arItem['FIELDS']['IBLOCK_ID'] . $arItem['FIELDS']['ID']); ?>">
                <?= $arItem['FIELDS']['NAME'] ?>
            </li>
        <? endforeach; ?>
    </ul>
<? endif ?>