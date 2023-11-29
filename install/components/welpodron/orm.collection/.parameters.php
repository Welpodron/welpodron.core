<?
if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Iblock\IblockTable;

if (!Loader::includeModule('iblock')) {
    return;
}

$arIblocks = ['-' => '-'];

$dbIblocks = IblockTable::getList([
    'select' => ['ID', 'NAME'],
    'filter' => ['ACTIVE' => 'Y'],
    'order' => ['NAME' => 'ASC']
])->fetchAll();

foreach ($dbIblocks as $arIblock) {
    $arIblocks[$arIblock['ID']] = $arIblock['NAME'];
}

$arComponentParameters = [
    'PARAMETERS' => [
        'IBLOCK_ID' => [
            'PARENT' => 'DATA_SOURCE',
            'NAME' => 'Инфоблок',
            'TYPE' => 'LIST',
            'VALUES' => $arIblocks,
            'REFRESH' => 'Y'
        ],
        'SEF_MODE' => [
            'collection_element' => [
                'NAME' => 'Страница детального просмотра элемента (collection_element)',
                'DEFAULT' => '#SECTION_CODE#/#ELEMENT_CODE#/',
                'VARIABLES' => ['ELEMENT_CODE', 'SECTION_CODE']
            ],
            'collection_section' => [
                'NAME' => 'Страница раздела (collection_section)',
                'DEFAULT' => '#SECTION_CODE#/',
                'VARIABLES' => ['SECTION_CODE']
            ]
        ],
    ]
];
