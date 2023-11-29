<?
if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) die();

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Engine\UrlManager;
use Bitrix\Main\Web\Json;

global $APPLICATION;
/** @var CMain $APPLICATION */
/** @var array $arParams */
Extension::load(['ui.forms', 'ui.layout-form', 'ui.design-tokens', 'ui.buttons.icons']);
?>

<? if ($arParams) : ?>
    <div class="ui-form-row">
        <? if ($arParams['FIELD_TITLE']) : ?>
            <div class="ui-form-label">
                <div class="ui-ctl-label-text">
                    <? if ($arParams['FIELD_REQUIRED']) : ?>
                        <?= $arParams['FIELD_TITLE'] ?> <span style="color:red; font-weight: bold;">*</span>:
                    <? else : ?>
                        <?= $arParams['FIELD_TITLE'] ?>:
                    <? endif; ?>
                </div>
            </div>
        <? endif; ?>
        <div class="ui-form-content">
            <? if ($arParams['ELEMENT_MULTIPLE']) : ?>
                <div style="display: grid; gap: 15px;">
                    <? $id = 'append_' . md5(uniqid()); ?>
                    <div data-w-zone-append data-w-zone data-w-zone-id="<?= $id ?>" style="display: grid; gap: 15px;">
                        <? if (is_array($arParams['FIELD_VALUE']) && !empty($arParams['FIELD_VALUE'])) : ?>
                            <? foreach ($arParams['FIELD_VALUE'] as $key => $value) : ?>
                                <div style="display: flex;">
                                    <div style="flex-grow: 1;">
                                        <?
                                        $APPLICATION->IncludeFile(
                                            str_replace($_SERVER['DOCUMENT_ROOT'], '', __DIR__ . DIRECTORY_SEPARATOR . 'base.php'),
                                            [
                                                'arMutation' => [
                                                    'PARAMS' => array_merge(
                                                        $arParams,
                                                        [
                                                            'FIELD_ID' => $arParams['FIELD_ID'] . '[]',
                                                            'FIELD_VALUE' => $value
                                                        ]
                                                    )
                                                ]
                                            ],
                                            [
                                                'SHOW_BORDER' => false,
                                                'MODE' => 'php',
                                            ]
                                        )
                                        ?>
                                    </div>
                                    <? if ($key == 0) : ?>
                                        <? if (!$arParams['FIELD_REQUIRED']) : ?>
                                            <button onclick="this.parentElement.remove()" style="margin-left: 15px;" type="button" class="ui-btn ui-btn-danger ui-btn-icon-remove"></button>
                                        <? endif; ?>
                                    <? else : ?>
                                        <button onclick="this.parentElement.remove()" style="margin-left: 15px;" type="button" class="ui-btn ui-btn-danger ui-btn-icon-remove"></button>
                                    <? endif; ?>
                                </div>
                            <? endforeach; ?>
                        <? else : ?>
                            <div style="display: flex;">
                                <div style="flex-grow: 1;">
                                    <?
                                    $APPLICATION->IncludeFile(
                                        str_replace($_SERVER['DOCUMENT_ROOT'], '', __DIR__ . DIRECTORY_SEPARATOR . 'base.php'),
                                        [
                                            'arMutation' => [
                                                'PARAMS' => array_merge(
                                                    $arParams,
                                                    [
                                                        'FIELD_ID' => $arParams['FIELD_ID'] . '[]',
                                                        'FIELD_VALUE' => is_array($arParams['FIELD_VALUE']) && empty($arParams['FIELD_VALUE']) ? '' : $arParams['FIELD_VALUE']
                                                    ]
                                                )
                                            ]
                                        ],
                                        [
                                            'SHOW_BORDER' => false,
                                            'MODE' => 'php',
                                        ]
                                    )
                                    ?>
                                </div>
                                <? if (!$arParams['FIELD_REQUIRED']) : ?>
                                    <button onclick="this.parentElement.remove()" style="margin-left: 15px;" type="button" class="ui-btn ui-btn-danger ui-btn-icon-remove"></button>
                                <? endif; ?>
                            </div>
                        <? endif; ?>
                    </div>

                    <?
                    //! Внимание! PHP объект сущности FIELD_OBJECT недоступен в ajax режиме, также как и большинство других полей
                    $argsString = base64_encode(Json::encode([
                        'FIELD_ID' => $arParams['FIELD_ID'] . '[]',
                        'FIELD_TYPE' => $arParams['FIELD_TYPE'],
                        'ELEMENT' => $arParams['ELEMENT'],
                    ]));

                    ?>

                    <button data-w-zone-control data-w-zone-action-args="<?= $argsString ?>" data-w-zone-action="<?= UrlManager::getInstance()->createByBitrixComponent($component, 'get') ?>" data-w-zone-id="<?= $id ?>" style="justify-self: start;" type="button" class="ui-btn ui-btn-icon-add">Добавить</button>
                </div>
            <? else : ?>
                <div style="display: flex;">
                    <div style="flex-grow: 1;">
                        <?
                        $APPLICATION->IncludeFile(
                            str_replace($_SERVER['DOCUMENT_ROOT'], '', __DIR__ . DIRECTORY_SEPARATOR . 'base.php'),
                            [
                                'arMutation' => [
                                    'PARAMS' => $arParams
                                ]
                            ],
                            [
                                'SHOW_BORDER' => false,
                                'MODE' => 'php',
                            ]
                        )
                        ?>
                    </div>
                    <? if (!$arParams['FIELD_REQUIRED'] && $arParams['IS_AJAX']) : ?>
                        <button onclick="this.closest('.ui-form-row').remove()" style="margin-left: 15px;" type="button" class="ui-btn ui-btn-danger ui-btn-icon-remove"></button>
                    <? endif; ?>
                </div>
            <? endif; ?>
        </div>
    </div>
<? endif; ?>