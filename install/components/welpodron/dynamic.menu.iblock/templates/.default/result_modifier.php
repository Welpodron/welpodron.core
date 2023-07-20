<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

foreach ($arResult['SECTIONS'] as $key => $arSection) {
    if ($arSection['DEPTH_LEVEL'] == 1 && $arSection['PICTURE']) {
        $arFileTmp = CFile::ResizeImageGet(
            $arSection['PICTURE'],
            ['width' => 50, 'height' => 50],
            BX_RESIZE_IMAGE_PROPORTIONAL,
            true
        );

        $arResult['SECTIONS'][$key]['PICTURE'] = [
            'SRC' => $arFileTmp['src'],
            'WIDTH' => $arFileTmp['width'],
            'HEIGHT' => $arFileTmp['height']
        ];
    }
}
