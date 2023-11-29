<?
if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) die();

/** @var array $arMutation */

$arParams = [];

if (is_array($arMutation) && is_array($arMutation['PARAMS'])) {
    $arParams = $arMutation['PARAMS'];
}

global $APPLICATION;

use Bitrix\Main\Loader;
?>

<? $id = 'field_' . md5(uniqid()); ?>
<?
if (Loader::IncludeModule("fileman")) {

    $editor = new \CHTMLEditor;

    $res = array_merge(
        array(
            'useFileDialogs' => false,
            'height' => 200,
            'useFileDialogs' => false,
            'minBodyWidth' => 350,
            'normalBodyWidth' => 555,
            'bAllowPhp' => false,
            'limitPhpAccess' => true,
            'showTaskbars' => false,
            'showNodeNavi' => false,
            'askBeforeUnloadPage' => true,
            'bbCode' => false,
            'siteId' => SITE_ID,
            'autoResize' => true,
            'autoResizeOffset' => 40,
            'saveOnBlur' => true,
            'controlsMap' => array(
                array('id' => 'Bold',  'compact' => true, 'sort' => 80),
                array('id' => 'Italic',  'compact' => true, 'sort' => 90),
                array('id' => 'Underline',  'compact' => true, 'sort' => 100),
                array('id' => 'Strikeout',  'compact' => true, 'sort' => 110),
                array('id' => 'RemoveFormat',  'compact' => true, 'sort' => 120),
                array('id' => 'Color',  'compact' => true, 'sort' => 130),
                array('id' => 'FontSelector',  'compact' => false, 'sort' => 135),
                array('id' => 'FontSize',  'compact' => false, 'sort' => 140),
                array('separator' => true, 'compact' => false, 'sort' => 145),
                array('id' => 'OrderedList',  'compact' => true, 'sort' => 150),
                array('id' => 'UnorderedList',  'compact' => true, 'sort' => 160),
                array('id' => 'AlignList', 'compact' => false, 'sort' => 190),
                array('separator' => true, 'compact' => false, 'sort' => 200),
                array('id' => 'InsertLink',  'compact' => true, 'sort' => 210, 'wrap' => 'bx-b-link-' . $id),
                array('id' => 'InsertImage',  'compact' => false, 'sort' => 220),
                array('id' => 'InsertVideo',  'compact' => true, 'sort' => 230, 'wrap' => 'bx-b-video-' . $id),
                array('id' => 'InsertTable',  'compact' => false, 'sort' => 250),
                array('id' => 'Code',  'compact' => true, 'sort' => 260),
                array('id' => 'Quote',  'compact' => true, 'sort' => 270, 'wrap' => 'bx-b-quote-' . $id),
                array('id' => 'Smile',  'compact' => false, 'sort' => 280),
                array('separator' => true, 'compact' => false, 'sort' => 290),
                array('id' => 'Fullscreen',  'compact' => false, 'sort' => 300),
                array('id' => 'BbCode',  'compact' => true, 'sort' => 301),
                array('id' => 'More',  'compact' => true, 'sort' => 303)
            )
        ),
        array(
            'placeholder' => 'Содержимое...',
            'name' => $arParams['FIELD_ID'],
            'inputName' => $arParams['FIELD_ID'],
            'id' => $id,
            'width' => '99.7%',
            'content' => trim(strval($arParams['FIELD_VALUE'])),
        )
    );
    $editor->show($res);
} else {
    $APPLICATION->IncludeComponent(
        'welpodron:admin.ui.field.textarea',
        '',
        $arParams
    );
}
?>