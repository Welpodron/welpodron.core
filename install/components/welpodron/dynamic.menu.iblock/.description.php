<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$arComponentDescription = [
    'NAME' => 'Динамическое меню от инфоблока',
    'DESCRIPTION' => GetMessage('T_IBLOCK_DESC_CI_DESC'),
    'ICON' => '/images/photo_view.gif',
    'CACHE_PATH' => 'Y',
    'SORT' => 40,
    'PATH' => [
        'ID' => 'welpodron',
        'NAME' => 'Собственные компоненты'
    ]
];
