<?if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
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

$APPLICATION->IncludeComponent('welpodron:iblock.element', '', [
    'ELEMENT_CODE' => $arResult['VARIABLES']['ELEMENT_CODE'],
    'IBLOCK_ID' => $arParams['IBLOCK_ID'],	// Инфо-блок
],
	false
);
