<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

if (!CModule::IncludeModule('iblock')) {
    return;
}

$arIBlockType = CIBlockParameters::GetIBlockTypes();

$arIBlock = [
    '-' => GetMessage('IBLOCK_ANY')
];

$rsIBlock = CIBlock::GetList(['sort' => 'asc'], ['TYPE' => $arCurrentValues['IBLOCK_TYPE'], 'ACTIVE' => 'Y']);
while ($arr = $rsIBlock->Fetch()) {
    $arIBlock[$arr['ID']] = '[' . $arr['ID'] . '] ' . $arr['NAME'];
}

$arComponentParameters = [
    'PARAMETERS' => [
        'IBLOCK_TYPE' => [
            'PARENT' => 'BASE',
            'NAME' => GetMessage('IBLOCK_TYPE'),
            'TYPE' => 'LIST',
            'VALUES' => $arIBlockType,
            'REFRESH' => 'Y'
        ],
        'IBLOCK_ID' => [
            'PARENT' => 'BASE',
            'NAME' => GetMessage('IBLOCK_IBLOCK'),
            'TYPE' => 'LIST',
            'VALUES' => $arIBlock,
            'MULTIPLE' => 'N',
            'REFRESH' => 'Y'
        ],
        'DEPTH_LEVEL' => [
            'PARENT' => 'BASE',
            'NAME' => 'Максимальный уровень вложенности',
            'TYPE' => 'STRING',
            'DEFAULT' => '2'
        ],
        'CACHE_TIME' => ['DEFAULT' => 36000],
        'CACHE_GROUPS' => [
            'PARENT' => 'CACHE_SETTINGS',
            'NAME' => GetMessage('CP_BPR_CACHE_GROUPS'),
            'TYPE' => 'CHECKBOX',
            'DEFAULT' => 'Y'
        ]
    ]
];
