<?

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\FileTable;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Context;

class WelpodronIblockSections extends CBitrixComponent
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

        $arParams['FIRST_SORT_FIELD'] = trim($arParams['FIRST_SORT_FIELD']);
        $arParams['FIRST_SORT_ORDER'] = trim($arParams['FIRST_SORT_ORDER']);
        $arParams['SECOND_SORT_FIELD'] = trim($arParams['SECOND_SORT_FIELD']);
        $arParams['SECOND_SORT_ORDER'] = trim($arParams['SECOND_SORT_ORDER']);

        return $arParams;
    }

    protected function getElements()
    {
        if ($this->arParams['IBLOCK_ID'] > 0) {
            // PERMS FIX 
            $arFilter = ['IBLOCK_ID' => $this->arParams['IBLOCK_ID'], 'SITE_ID' => Context::getCurrent()->getSite(), 'CHECK_PERMISSIONS' => 'N', 'ACTIVE' => 'Y'];
            $arOrder = [];
            $bIncCnt = false;
            $arNav = false;
            $arSelect = [];

            if ($this->arParams['FIRST_SORT_FIELD'] && $this->arParams['FIRST_SORT_ORDER']) {
                $arOrder[$this->arParams['FIRST_SORT_FIELD']] = $this->arParams['FIRST_SORT_ORDER'];
            }

            if ($this->arParams['SECOND_SORT_FIELD'] && $this->arParams['SECOND_SORT_ORDER']) {
                $arOrder[$this->arParams['SECOND_SORT_FIELD']] = $this->arParams['SECOND_SORT_ORDER'];
            }

            if ($this->arParams['SELECTED_FIELDS'] && is_array($this->arParams['SELECTED_FIELDS'])) {
                $arSelect = $this->arParams['SELECTED_FIELDS'];
            }

            $dbSections = CIBlockSection::GetList($arOrder, $arFilter, $bIncCnt, $arSelect, $arNav);

            while ($ob = $dbSections->GetNextElement(true, false)) {
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

                $arSection = ['FIELDS' => $arFields, 'PROPS' => $arProps];
                $arSections[] = $arSection;
            }

            return $arSections;
        }
    }
}
