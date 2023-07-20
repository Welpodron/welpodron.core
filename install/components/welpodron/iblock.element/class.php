<?

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\FileTable;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Context;
// SEO
use Bitrix\Iblock\InheritedProperty\ElementValues;

class WelpodronIblockElement extends CBitrixComponent
{
    public function executeComponent()
    {
        if ($this->startResultCache($this->arParams['CACHE_TIME'], $this->arParams['CACHE_GROUPS'])) {
            $this->arResult = $this->getElements();

            if (!($this->arParams['IBLOCK_ID'] > 0)) {
                $this->AbortResultCache();
            }

            $this->includeComponentTemplate();
        }

        return $this->arResult;
    }

    public function onPrepareComponentParams($arParams)
    {
        if (!Loader::includeModule('iblock')) {
            return [];
        }

        if ($arParams['CACHE_GROUPS'] === 'N') {
            $arParams['CACHE_GROUPS'] = false;
        } else {
            $arParams['CACHE_GROUPS'] = CurrentUser::get()->getUserGroups();
        }

        $arParams['CACHE_TIME'] = isset($arParams['CACHE_TIME']) ? $arParams['CACHE_TIME'] : 36000;
        $arParams['IBLOCK_ID'] = intval($arParams['IBLOCK_ID']);

        return $arParams;
    }

    protected function getElements()
    {
        if ($this->arParams['IBLOCK_ID'] > 0) {
            $arFilter = ['IBLOCK_ID' => $this->arParams['IBLOCK_ID'], 'SITE_ID' => Context::getCurrent()->getSite(), 'CHECK_PERMISSIONS' => 'N', 'ACTIVE' => 'Y'];
            $arOrder = [];
            $arGroup = false;
            $arNav = false;
            $arSelect = [];

            if ($this->arParams['SECTION_ID']) {
                $arFilter['SECTION_ID'] = $this->arParams['SECTION_ID'];
            } elseif ($this->arParams['SECTION_CODE']) {
                $arFilter['SECTION_CODE'] = $this->arParams['SECTION_CODE'];
            }

            if ($this->arParams['ID']) {
                $arFilter['ID'] = $this->arParams['ID'];
            } elseif ($this->arParams['CODE']) {
                $arFilter['CODE'] = $this->arParams['CODE'];
            }

            if ($this->arParams['SELECTED_FIELDS'] && is_array($this->arParams['SELECTED_FIELDS'])) {
                $arSelect = $this->arParams['SELECTED_FIELDS'];
                // Гаратируем что ID и IBLOCK_ID точно будет в выборке
                if (!in_array('ID', $arSelect)) {
                    $arSelect[] = 'ID';
                }
                if (!in_array('IBLOCK_ID', $arSelect)) {
                    $arSelect[] = 'IBLOCK_ID';
                }
            }

            $dbElements = CIBlockElement::GetList($arOrder, $arFilter, $arGroup, $arNav, $arSelect);

            while ($ob = $dbElements->GetNextElement(true, false)) {
                $arFields = $ob->GetFields();
                $arProps = $ob->GetProperties();

                if ($arFields['DETAIL_PICTURE']) {
                    $id = $arFields['DETAIL_PICTURE'];

                    $file = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
                        '=ID' => $id
                    ], 'limit' => 1])->fetch();
                    $arFields['DETAIL_PICTURE'] = $file;
                    $arFields['DETAIL_PICTURE']['SRC'] = CFile::GetPath($id);
                }
                if ($arFields['PREVIEW_PICTURE']) {
                    $id = $arFields['PREVIEW_PICTURE'];

                    $file = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
                        '=ID' => $id
                    ], 'limit' => 1])->fetch();
                    $arFields['PREVIEW_PICTURE'] = $file;
                    $arFields['PREVIEW_PICTURE']['SRC'] = CFile::GetPath($id);
                }
                foreach ($arProps as &$arProp) {
                    if ($arProp['PROPERTY_TYPE'] === 'F') {
                        $id = $arProp['VALUE'];

                        $file = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
                            '=ID' => $id
                        ], 'limit' => 1])->fetch();

                        if ($file) {
                            $arProp['VALUE'] = $file;
                            $arProp['VALUE']['SRC'] = CFile::GetPath($id);
                        }
                    }
                }

                unset($arProp);
                $dbActions = CIBlock::GetPanelButtons($arFields['IBLOCK_ID'], $arFields['ID'], $arFields['SECTION_ID'], []);
                $arElement = ['FIELDS' => array_merge($arFields, (new ElementValues($arFields['IBLOCK_ID'], $arFields['ID']))->getValues()), 'PROPS' => $arProps];
                $arElement['ACTIONS']['EDIT_LINK'] = $dbActions['edit']['edit_element']['ACTION_URL'];
                $arElement['ACTIONS']['DELETE_LINK'] = $dbActions['edit']['delete_element']['ACTION_URL'];

                // if ($arParams["SET_TITLE"] || isset($arResult[$arParams["BROWSER_TITLE"]])) {
                //     $arTitleOptions = array(
                //         'ADMIN_EDIT_LINK' => $arButtons["submenu"]["edit_element"]["ACTION"],
                //         'PUBLIC_EDIT_LINK' => $arButtons["edit"]["edit_element"]["ACTION"],
                //         'COMPONENT_NAME' => $this->getName(),
                //     );
                // }

                $arElements[] = $arElement;
            }

            $arButtons = CIBlock::GetPanelButtons(
                $this->arParams['IBLOCK_ID'],
                0,
                0,
                ['SECTION_BUTTONS' => false]
            );

            // TODO: Rework to D7!

            global $APPLICATION;

            if ($APPLICATION->GetShowIncludeAreas()) {
                $this->addIncludeAreaIcons(CIBlock::GetComponentMenu($APPLICATION->GetPublicShowMode(), $arButtons));
            }

            return $arElements;
        }
    }
}
