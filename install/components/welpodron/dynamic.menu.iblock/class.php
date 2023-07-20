<?

use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

if (!Loader::includeModule('iblock')) {
    return false;
}

class WelpodronDynamicIblockMenu extends CBitrixComponent
{
    /**
     * @param $arChildren
     */
    public function buildTree($arChildren, $depthLevel = 1)
    {
        // echo '<pre>';
        // print_r($arChildren);
        // echo '</pre>';

        // LIST START
		echo '<ul' . ' ' . ($depthLevel > 1 ? 'class="t:grid-col-2 d:grid-col-3"' : '') . '>';

        foreach ($arChildren as $arChild) {

            if ($arChild['UF_SKRIT'] === '1') {
                continue;
            }

            // LIST ITEM START
            echo '<li' . ' ' . ($arChild['SECTIONS'] ? 'class="hover-relative"' : '') . '>';
            // CONTROLS CONTAINER START
            echo '<div class="sidebar-link-parent"' . ' ' . ($arChild['SECTIONS'] ? 'data-hover-initiator="true"' : '') . '>';
            // HREF START
            echo '<a href="' . $arChild['SECTION_PAGE_URL'] . '">';
            // IMG CONTAINER
            if ($depthLevel == 1) {
                echo '<span class="sidebar-img-wrapper"><img class="sidebar-img" src="' . $arChild['PICTURE']['SRC'] . '" loading="lazy"></span>';
            }
            // ITEM NAME
            echo '<span>' . $arChild['NAME'] . '</span>';
            // HREF END
            echo '</a>';
            // BTN START
            if ($arChild['SECTIONS']) {
                echo '<button type="button" data-collapse-initiator="true" class="t:d-none sidebar-collapse-btn" data-collapse-id="collapse_' . $arChild['ID'] . '">';
                // BTN ICON
                echo '<svg width="24" height="24" fill="none" viewBox="0 0 24 24"  stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
                // BTN END
                echo '</button>';
            }
            // CONTROLS CONTAINER END
            echo '</div>';
            // CHILDREN CONTAINER START
            if ($arChild['SECTIONS']) {
                echo '<div class="w-collapse w-collapse-max hover hover-min hover-min-absolute-left" id="collapse_' . $arChild['ID'] . '" data-collapse="true" data-collapse-max="768" data-hover="true">';
                $this->buildTree($arChild['SECTIONS'], $depthLevel + 1);
                echo '</div>';
            }
            // CHILDREN CONTAINER END
            // LIST ITEM END
            echo '</li>';
        }

        // LIST END
        echo '</ul>';
    }

    /**
     * @return mixed
     */
    public function executeComponent()
    {
        if ($this->startResultCache($this->arParams['CACHE_TIME'], [$this->arParams['CACHE_GROUPS']])) {
            $this->arResult = $this->getTree($this->arParams['IBLOCK_ID'], $this->arParams['DEPTH_LEVEL']);
            $this->includeComponentTemplate();
        }
        return $this->arResult;
    }

    /**
     * @param $arParams
     */
    public function onPrepareComponentParams($arParams)
    {
        if ($arParams['CACHE_GROUPS'] === 'N') {
            $arParams['CACHE_GROUPS'] = false;
        } else {
            global $USER;

            if (!is_object($USER)) {
                $USER = new CUser();
            }

            $arParams['CACHE_GROUPS'] = $USER->GetGroups();
        }

        $arParams['CACHE_TIME'] = $arParams['CACHE_TIME'] ? $arParams['CACHE_TIME'] : 36000000;
        $arParams['IBLOCK_ID'] = intval($arParams['IBLOCK_ID']);
        $arParams['DEPTH_LEVEL'] = intval($arParams['DEPTH_LEVEL']);
        return $arParams;
    }

    /**
     * @param $iblockId
     * @param $depthLevel
     * @return mixed
     */
    protected function getTree($iblockId = 0, $depthLevel = 0)
    {
        if ($iblockId > 0) {
            $arFilter = ['IBLOCK_ID' => $iblockId, 'ACTIVE' => 'Y', 'GLOBAL_ACTIVE' => 'Y'];
            $arSelect = ['ID', 'NAME', 'IBLOCK_SECTION_ID', 'SECTION_PAGE_URL', 'PICTURE', 'DEPTH_LEVEL', 'UF_SKRIT', 'UF_MENU_TOP'];

            if ($depthLevel > 0) {
                $arFilter['<=DEPTH_LEVEL'] = $depthLevel;
            }

            $db = CIBlockSection::GetTreeList($arFilter, $arSelect);

            while ($arData = $db->GetNext(true, false)) {
                $sectionId = $arData['ID'];
                $sectionParentId = (int) $arData['IBLOCK_SECTION_ID'];

                $arSections[$sectionParentId]['SECTIONS'][$sectionId] = $arData;

                $arSections[$sectionId] = &$arSections[$sectionParentId]['SECTIONS'][$sectionId];
            }

            return array_shift($arSections);
        }

        return;
    }
}
