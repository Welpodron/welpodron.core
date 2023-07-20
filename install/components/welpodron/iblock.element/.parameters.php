<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Loader;

if (!Loader::includeModule('iblock')) {
    return;
}

$arIblockTypes = CIBlockParameters::GetIBlockTypes(['-' => '-']);
$arIblocks = ['-' => '-'];

$dbIblocks = CIBlock::GetList(['SORT' => 'ASC'], ['SITE_ID' => $_REQUEST['site'], 'TYPE' => $arCurrentValues['IBLOCK_TYPE']]);

while ($arFetchRes = $dbIblocks->Fetch()) {
    $arIblocks[$arFetchRes['ID']] = '[' . $arFetchRes['ID'] . '] ' . $arFetchRes['NAME'];
}

$arComponentParameters = [
    'PARAMETERS' => [
        'IBLOCK_TYPE' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Тип инфоблока',
            'TYPE' => 'LIST',
            'VALUES' => $arIblockTypes,
            'REFRESH' => 'Y'
        ],
        'IBLOCK_ID' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Инфоблок',
            'TYPE' => 'LIST',
            'VALUES' => $arIblocks,
            'REFRESH' => 'Y'
        ],
        'ID' => [
            'NAME' => 'Id элемента',
            'PARENT' => 'BASE',
            'TYPE' => 'STRING',
        ],
        'SELECTED_FIELDS' => CIBlockParameters::GetFieldCode('Поля/Свойства для выборки из инфоблока', 'DATA_SOURCE'),
        'CACHE_TIME' => ['DEFAULT' => 36000],
        'CACHE_GROUPS' => [
            'PARENT' => 'CACHE_SETTINGS',
            'NAME' => 'Учитывать права доступа',
            'TYPE' => 'CHECKBOX',
            'DEFAULT' => 'Y'
        ]
    ]
];
