<? if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
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

use Bitrix\Main\ORM\Query\Query;

?>

<p>$arParams</p>
<pre>
    <? print_r($arParams) ?>
</pre>
<p>$arResult</p>
<pre>
    <? print_r($arResult) ?>
</pre>

<p>collection section</p>

<? $APPLICATION->IncludeComponent(
    "welpodron:iblock.elements",
    ".default",
    array(
        "CACHE_GROUPS" => "Y",
        "CACHE_TIME" => "36000",
        "CACHE_TYPE" => "A",
        "FIRST_SORT_FIELD" => "ID",
        "FIRST_SORT_ORDER" => "DESC",
        "IBLOCK_ID" => $arParams['IBLOCK_ID'],
        "PAGER_COUNT" => "20",
        "PAGER_TEMPLATE" => ".default",
        "SECOND_SORT_FIELD" => "SORT",
        "SECOND_SORT_ORDER" => "ASC",
        "SELECTED_FIELDS" => array(
            0 => "NAME",
            1 => "CODE",
        ),
        'FILTER' => Query::filter()->where([
            ['IBLOCK_SECTION.CODE', $arResult['VARIABLES']['SECTION_CODE']]
        ]),
        "COMPONENT_TEMPLATE" => ".default"
    ),
    false
); ?>