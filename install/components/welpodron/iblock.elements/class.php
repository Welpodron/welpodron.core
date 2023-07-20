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

class WelpodronIblockElements extends CBitrixComponent
{
    public function executeComponent()
    {
        CPageOption::SetOptionString("main", "nav_page_in_session", "N");

        //! $this->getNavigation() - возвращает объект навигации для постранички и кэш при этом берется разный для разных страниц?????

        if ($this->startResultCache($this->arParams['CACHE_TIME'], [
            $this->arParams['CACHE_GROUPS'],
            $this->getNavigation(),
        ])) {
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

        $arParams['FIRST_SORT_FIELD'] = trim($arParams['FIRST_SORT_FIELD']);
        $arParams['FIRST_SORT_ORDER'] = trim($arParams['FIRST_SORT_ORDER']);
        $arParams['SECOND_SORT_FIELD'] = trim($arParams['SECOND_SORT_FIELD']);
        $arParams['SECOND_SORT_ORDER'] = trim($arParams['SECOND_SORT_ORDER']);

        if (strtoupper($arParams['FIRST_SORT_FIELD']) == 'RAND') {
            $arParams['FIRST_SORT_ORDER'] = 'RAND';
        }

        if (strtoupper($arParams['SECOND_SORT_FIELD']) == 'RAND') {
            $arParams['SECOND_SORT_ORDER'] = 'RAND';
        }

        $arParams["PAGER_COUNT"] = intval($arParams["PAGER_COUNT"]);
        if ($arParams["PAGER_COUNT"] <= 0) {
            $arParams["PAGER_COUNT"] = 20;
        }

        $arParams['PAGER_TEMPLATE'] = trim($arParams['PAGER_TEMPLATE']);

        $arParams['PAGER_NAV_PARAMS'] = [
            'nPageSize' => $arParams['PAGER_COUNT'],
            'bShowAll' => true,
        ];

        return $arParams;
    }

    protected function getNavigation()
    {
        // !TODO Переделать навигацию на D7 также как и саму выборку
        $arNavigation = CDBResult::GetNavParams($this->arParams['PAGER_NAV_PARAMS']);

        return $arNavigation;
    }

    protected function getElements()
    {
        if ($this->arParams['IBLOCK_ID'] > 0) {
            $arFilter = ['IBLOCK_ID' => $this->arParams['IBLOCK_ID'], 'SITE_ID' => Context::getCurrent()->getSite(), 'CHECK_PERMISSIONS' => 'N', 'ACTIVE' => 'Y'];
            $arOrder = [];
            $arGroup = false;

            $arSelect = [];

            if ($this->arParams['SECTION_ID']) {
                $arFilter['SECTION_ID'] = $this->arParams['SECTION_ID'];
            } elseif ($this->arParams['SECTION_CODE']) {
                $arFilter['SECTION_CODE'] = $this->arParams['SECTION_CODE'];
            }
            if (is_array($this->arParams['FILTER']) && !empty($this->arParams['FILTER'])) {
                $arFilter = array_merge($this->arParams['FILTER'], $arFilter);
            }

            if ($this->arParams['FIRST_SORT_FIELD'] && $this->arParams['FIRST_SORT_ORDER']) {
                $arOrder[$this->arParams['FIRST_SORT_FIELD']] = $this->arParams['FIRST_SORT_ORDER'];
            }

            if ($this->arParams['SECOND_SORT_FIELD'] && $this->arParams['SECOND_SORT_ORDER']) {
                $arOrder[$this->arParams['SECOND_SORT_FIELD']] = $this->arParams['SECOND_SORT_ORDER'];
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

            // !TODO Переделать навигацию на D7 также как и саму выборку
            $dbElements = CIBlockElement::GetList($arOrder, $arFilter, $arGroup, $this->arParams['PAGER_NAV_PARAMS'], $arSelect);

            while ($ob = $dbElements->GetNextElement(true, false)) {
                $arFields = $ob->GetFields();
                $arProps = $ob->GetProperties();

                if ($arFields['PREVIEW_PICTURE']) {
                    $id = $arFields['PREVIEW_PICTURE'];

                    $file = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
                        '=ID' => $id
                    ], 'limit' => 1])->fetch();
                    $arFields['PREVIEW_PICTURE'] = $file;
                    $arFields['PREVIEW_PICTURE']['SRC'] = CFile::GetPath($id);
                }

                if ($arFields['DETAIL_PICTURE']) {
                    $id = $arFields['DETAIL_PICTURE'];

                    $file = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
                        '=ID' => $id
                    ], 'limit' => 1])->fetch();
                    $arFields['DETAIL_PICTURE'] = $file;
                    $arFields['DETAIL_PICTURE']['SRC'] = CFile::GetPath($id);
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

            return [
                'ITEMS' => $arElements,
                'NAV_STRING' => $dbElements->GetPageNavString(
                    '',
                    $this->arParams['PAGER_TEMPLATE'],
                    true,
                    $this
                )
            ];
        }
    }
}
