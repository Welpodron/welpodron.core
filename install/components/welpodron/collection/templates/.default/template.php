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
?>
<?if ($arParams['TEMPLATE_ROOT_USE_SECTIONS']): ?>
<?$APPLICATION->IncludeComponent('welpodron:iblock.sections', '', [
    'IBLOCK_ID' => $arParams['IBLOCK_ID'],	// Инфо-блок
],
	false
);?>
<?endif;?>

<?if ($arParams['TEMPLATE_ROOT_USE_ELEMENTS']): ?>
<?$APPLICATION->IncludeComponent('welpodron:iblock.elements', '', [
    'IBLOCK_ID' => $arParams['IBLOCK_ID'],	// Инфо-блок
],
	false
);?>
<?endif;?>
