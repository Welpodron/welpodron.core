<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Loader;

if (!Loader::includeModule('iblock')) {
    return;
}

// Начало блока параметров для источника данных

$arIblockTypes = CIBlockParameters::GetIBlockTypes(['-' => '-']);
$arIblocks = ['-' => '-'];

$dbIblocks = CIBlock::GetList(['SORT' => 'ASC'], ['SITE_ID' => $_REQUEST['site'], 'TYPE' => $arCurrentValues['IBLOCK_TYPE']]);

while ($arFetchRes = $dbIblocks->Fetch()) {
    $arIblocks[$arFetchRes['ID']] = '[' . $arFetchRes['ID'] . '] ' . $arFetchRes['NAME'];
}

// Конец блока параметров для источника данных

// Начало блока параметров для сортировки

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
    'MODIFIED_BY' => 'По коду последнего изменившего пользователя',
    'RAND' => 'В случайном порядке'
];

// Конец блока параметров для сортировки

// Начало блока параметров для постраничной навигации

//! Когда будет выполнен переход на D7 данный код перестанет быть актуальным и его нужно будет заменить на аналогичный
$arPagerTemplateInfo = CComponentUtil::GetTemplatesList('bitrix:system.pagenavigation');

$arPagerTemplates = [];

foreach ($arPagerTemplateInfo as &$arPagerTemplate) {
    if ('' != $arPagerTemplate["TEMPLATE"] && '.default' != $arPagerTemplate["TEMPLATE"])
        $arPagerTemplateIDs[] = $arPagerTemplate["TEMPLATE"];
    if (!isset($arPagerTemplate['TITLE']))
        $arPagerTemplate['TITLE'] = $arPagerTemplate['NAME'];
}
unset($arPagerTemplate);

if (!empty($arPagerTemplateIDs)) {
    $dbSiteTemplates = CSiteTemplate::GetList(
        [],
        ["ID" => $arPagerTemplateIDs],
        []
    );
    while ($arSiteTemplate = $dbSiteTemplates->Fetch()) {
        $arSiteTemplateList[$arSiteTemplate['ID']] = $arSiteTemplate['NAME'];
    }
}

foreach ($arPagerTemplateInfo as &$arPagerTemplate) {
    $arPagerTemplates[$arPagerTemplate['NAME']] = $arPagerTemplate["TITLE"] . ' (' . ('' != $arPagerTemplate["TEMPLATE"] && '' != $arSiteTemplateList[$arPagerTemplate["TEMPLATE"]] ? $arSiteTemplateList[$arPagerTemplate["TEMPLATE"]] : 'Встроенный шаблон') . ')';;
}
unset($arPagerTemplate);

// Конец блока параметров для постраничной навигации

$arComponentParameters = [
    'GROUPS' => [
        'PAGER_SETTINGS' => [
            'NAME' => 'Настройки постраничной навигации',
        ]
    ],
    'PARAMETERS' => [
        // Начало блока связанного с источником данных
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
        // Конец блока связанного с источником данных
        // Начало блока связанного с сортировкой
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
        // Конец блока связанного с сортировкой
        'SELECTED_FIELDS' => CIBlockParameters::GetFieldCode('Поля/Свойства для выборки из инфоблока', 'DATA_SOURCE'),
        // Начало блока связанного с кэшированием
        'CACHE_TIME' => ['DEFAULT' => 36000],
        'CACHE_GROUPS' => [
            'PARENT' => 'CACHE_SETTINGS',
            'NAME' => 'Учитывать права доступа',
            'TYPE' => 'CHECKBOX',
            'DEFAULT' => 'Y'
        ],
        // Конец блока связанного с кэшированием
        // Начало блока связанного с постраничной навигацией
        'PAGER_TEMPLATE' => [
            'PARENT' => 'PAGER_SETTINGS',
            'NAME' => 'Название шаблона',
            "TYPE" => "LIST",
            "VALUES" => $arPagerTemplates,
            "DEFAULT" => ".default",
            "ADDITIONAL_VALUES" => "Y"
        ],
        'PAGER_COUNT' => [
            'PARENT' => 'PAGER_SETTINGS',
            'NAME' => 'Количество элементов на странице',
            'TYPE' => 'STRING',
            'DEFAULT' => '20',
        ],
        // Конец блока связанного с постраничной навигацией
    ]
];

// // настройка постраничной навигации
// CIBlockParameters::AddPagerSettings(
//     $arComponentParameters,
//     'Элементы',  // $pager_title
//     false,       // $bDescNumbering
//     true,        // $bShowAllParam
// );
