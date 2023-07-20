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
    <? foreach ($arResult['ITEMS'] as $arItem) : ?>
        <?
        $this->AddEditAction(
            $arItem['FIELDS']['ID'],
            $arItem['ACTIONS']['EDIT_LINK'],
            CIBlock::GetArrayByID($arItem['FIELDS']['IBLOCK_ID'], 'ELEMENT_EDIT')
        );
        $this->AddDeleteAction(
            $arItem['FIELDS']['ID'],
            $arItem['ACTIONS']['DELETE_LINK'],
            CIBlock::GetArrayByID($arItem['FIELDS']['IBLOCK_ID'], 'ELEMENT_DELETE'),
            ['CONFIRM' => 'Будет удалена вся информация, связанная с этой записью. Продолжить?']
        );
        ?>
        <div id="<?= $this->GetEditAreaId($arItem['FIELDS']['ID']); ?>">
            <?
            echo '<pre>';
            print_r($arItem);
            echo '</pre>';
            ?>
        </div>
    <? endforeach; ?>
<? endif ?>