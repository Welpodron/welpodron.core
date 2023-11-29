<?
if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Iblock\IblockTable;
use Bitrix\Iblock\ElementTable;
use Bitrix\Main\UserFieldTable;
use Bitrix\Main\UserFieldLangTable;
use Bitrix\Main\ORM\Fields\Relations\Reference;

if (!Loader::includeModule('iblock')) {
    return;
}

// Начало блока параметров для источника данных

$arIblocks = ['-' => '-'];

$dbIblocks = IblockTable::getList([
    'select' => ['ID', 'NAME'],
    'filter' => ['ACTIVE' => 'Y'],
])->fetchAll();

foreach ($dbIblocks as $arIblock) {
    $arIblocks[$arIblock['ID']] = '[' . $arIblock['ID'] . '] ' . $arIblock['NAME'];
}

$entity = ElementTable::getEntity();

$arFields = ['-' => '-'];

foreach ($entity->getFields() as $field) {
    if ($field instanceof Reference) {
        continue;
    }

    $arFields[$field->getName()] = '[' . $field->getName() . '] ' . $field->getTitle();
}

// Props fields 

$arUfs = [];

$dbUfs = UserFieldTable::getList([
    'select' => [
        'FIELD_NAME',
        'EDIT_FORM_LABEL' => 'LABELS.EDIT_FORM_LABEL',
        // 'LIST_COLUMN_LABEL' => 'LABELS.LIST_COLUMN_LABEL',
    ],
    'filter' => ['=ENTITY_ID' => 'IBLOCK_' . ($arCurrentValues['IBLOCK_ID'] ?? '0') . '_SECTION'],
    'runtime' => [
        new Reference(
            'LABELS',
            UserFieldLangTable::class,
            ['=this.ID' => 'ref.USER_FIELD_ID']
        )
    ]
])->fetchAll();

foreach ($dbUfs as $arUf) {
    $arUfs[$arUf['FIELD_NAME']] = '[' . $arUf['FIELD_NAME'] . '] ' . ($arUf['EDIT_FORM_LABEL'] ? $arUf['EDIT_FORM_LABEL'] : $arUf['FIELD_NAME']);
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
$arPagerTemplateInfo = CComponentUtil::GetTemplatesList('bitrix:main.pagenavigation');

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
        ],
        'SEO_SETTINGS' => [
            'NAME' => 'Настройки SEO',
        ]
    ],
    'PARAMETERS' => [
        // Начало блока связанного с источником данных
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
        'SELECTED_FIELDS' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Поля для выборки',
            'TYPE' => 'LIST',
            'MULTIPLE' => 'Y',
            "SIZE" => 10,
            'VALUES' => $arFields,
            'ADDITIONAL_VALUES' => 'Y'
        ],
        'SELECTED_PROPS' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Пользовательские свойства для выборки',
            'TYPE' => 'LIST',
            'MULTIPLE' => 'Y',
            "SIZE" => 10,
            'VALUES' => $arUfs,
            'ADDITIONAL_VALUES' => 'Y'
        ],
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
        //! Влияет на размер кэша (потенциально сильно)
        'USE_PAGER' => [
            'PARENT' => 'PAGER_SETTINGS',
            'NAME' => 'Использовать постраничную навигацию',
            'TYPE' => 'CHECKBOX',
            'DEFAULT' => 'N',
            'REFRESH' => 'Y'
        ],
        // Конец блока связанного с постраничной навигацией
        //! Влияет на размер кэша (не сильно) и количество запросов к БД (сильно)  
        'USE_SEO' => [
            'PARENT' => 'SEO_SETTINGS',
            'NAME' => 'Использовать SEO параметры инфоблока',
            'TYPE' => 'CHECKBOX',
            'DEFAULT' => 'N',
        ],
    ]
];

if (Loader::includeModule('welpodron.optimizer')) {
    //! Влияет на размер кэша (потенциально сильно)
    $arComponentParameters['PARAMETERS']['USE_MINIFY_CACHE'] = [
        'PARENT' => 'CACHE_SETTINGS',
        'NAME' => 'Использовать минификацию кэша (экспериментально)',
        'TYPE' => 'CHECKBOX',
        'DEFAULT' => 'N',
    ];
}


if ($arCurrentValues['USE_PAGER'] == 'Y') {
    $arComponentParameters['PARAMETERS']['PAGER_TEMPLATE'] = [
        'PARENT' => 'PAGER_SETTINGS',
        'NAME' => 'Название шаблона',
        "TYPE" => "LIST",
        "VALUES" => $arPagerTemplates,
        "DEFAULT" => ".default",
        "ADDITIONAL_VALUES" => "Y"
    ];

    $arComponentParameters['PARAMETERS']['PAGER_COUNT'] = [
        'PARENT' => 'PAGER_SETTINGS',
        'NAME' => 'Количество элементов на странице',
        'TYPE' => 'STRING',
        'DEFAULT' => '20',
    ];
}
