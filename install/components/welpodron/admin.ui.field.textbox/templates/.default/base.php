<?
if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) die();

/** @var array $arMutation */

$arParams = [];

if (is_array($arMutation) && is_array($arMutation['PARAMS'])) {
    $arParams = $arMutation['PARAMS'];
}

global $APPLICATION;

?>

<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
    <input <?= ($arParams['FIELD_REQUIRED'] ? "required" : "") ?> name="<?= $arParams['FIELD_ID'] ?>" value="<?= $arParams['FIELD_VALUE'] ?>" type="text" class="ui-ctl-element">
</div>