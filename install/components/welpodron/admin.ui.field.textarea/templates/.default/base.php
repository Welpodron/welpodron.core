<?
if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) die();

/** @var array $arMutation */

$arParams = [];

if (is_array($arMutation) && is_array($arMutation['PARAMS'])) {
    $arParams = $arMutation['PARAMS'];
}

global $APPLICATION;

?>

<div class="ui-ctl ui-ctl-textarea ui-ctl-resize-y ui-ctl-w100">
    <textarea <?= ($arParams['FIELD_REQUIRED'] ? "required" : "") ?> name="<?= $arParams['FIELD_ID'] ?>" class="ui-ctl-element"><?= $arParams['FIELD_VALUE'] ?></textarea>
</div>