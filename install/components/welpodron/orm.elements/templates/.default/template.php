<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
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
            <li>
                <?
                echo '<pre>';
                print_r($arItem);
                echo '</pre>';
                ?>
            </li>
        <? endforeach; ?>
    </ul>
    <?
    $APPLICATION->IncludeComponent(
        "bitrix:main.pagenavigation",
        "",
        array(
            "NAV_OBJECT" => $arResult['NAV_OBJECT'],
            // "SEF_MODE" => "Y",
        ),
        false
    );
    ?>
<? endif ?>