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

$arSortDirections = [
    'ASC' => 'По возрастанию',
    'DESC' => 'По убыванию'
];
$arSortFields = [
    'ID' => 'По id',
    'NAME' => 'По названию',
    'CODE' => 'По мнемоническому коду',
    'XML_ID' => 'По внешнему коду',
    'SORT' => 'По индексу сортировки',
    'CREATED' => 'По времени создания',
    'CREATED_DATE' => 'По дате создания (без учета времени)',
    'TIMESTAMP_X' => 'По дате изменения',
    'SHOW_COUNTER' => 'По количеству показов',
    'SHOW_COUNTER_START' => 'По времени первого показа',
    'SHOWS' => 'По усредненному количеству показов',
    'IBLOCK_ID' => 'По id информационного блока',
    'ACTIVE' => 'По признаку активности',
    'ACTIVE_FROM' => '(устаревший) По началу периода действия',
    'ACTIVE_TO' => '(устаревший) По окончанию периода действия',
    'STATUS' => 'По коду статуса в документообороте',
    'MODIFIED_BY' => 'По коду последнего изменившего пользователя'
];

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
        'FIRST_SORT_FIELD' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Первое поле для сортировки',
            'TYPE' => 'LIST',
            'DEFAULT' => 'ID',
            'VALUES' => $arSortFields,
            'ADDITIONAL_VALUES' => 'Y'
        ],
        'FIRST_SORT_ORDER' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Направление первого поля для сортировки',
            'TYPE' => 'LIST',
            'DEFAULT' => 'DESC',
            'VALUES' => $arSortDirections
        ],
        'SECOND_SORT_FIELD' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Второе поле для сортировки',
            'TYPE' => 'LIST',
            'DEFAULT' => 'SORT',
            'VALUES' => $arSortFields,
            'ADDITIONAL_VALUES' => 'Y'
        ],
        'SECOND_SORT_ORDER' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Направление второго поля для сортировки',
            'TYPE' => 'LIST',
            'DEFAULT' => 'ASC',
            'VALUES' => $arSortDirections
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
