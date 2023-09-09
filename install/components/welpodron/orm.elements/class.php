<?

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Iblock\ElementPropertyTable;
use Bitrix\Iblock\ElementTable;
use Bitrix\Iblock\IblockTable;
use Bitrix\Iblock\PropertyTable;
use Bitrix\Main\FileTable;
use Bitrix\Main\ORM\Query\QueryHelper;
use Bitrix\Main\ORM\Query\Join;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Iblock\Url\AdminPage\IblockBuilder;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Context;
use Bitrix\Main\Config\Option;
// SEO
use Bitrix\Iblock\InheritedProperty\ElementValues;

if (!Loader::includeModule('iblock')) {
    throw new \Exception('Не удалось подключить модуль iblock');
}

class WelpodronIblockElementsActionsBuilder extends IblockBuilder
{
    public function setIblockId(int $iblockId): void
    {
        if ($this->iblockId !== $iblockId) {
            $this->resetIblock();
            if ($iblockId > 0) {
                $iblock = IblockTable::getList([
                    'select' => ['*'],
                    'filter' => ['=ID' => $iblockId],
                ])->fetch();
                if (!empty($iblock) && is_array($iblock)) {
                    $this->iblockId = $iblockId;
                    $this->iblock = $iblock;
                }
                unset($iblock);
            }
            $this->initIblockListMode();
            $this->initUrlTemplates();
            $this->setTemplateVariable('#IBLOCK_ID#', (string)$this->iblockId);
            $this->setTemplateVariable('#BASE_PARAMS#', $this->getBaseParams());
        }
    }
}

class WelpodronIblockElements extends CBitrixComponent
{
    public function executeComponent()
    {
        CPageOption::SetOptionString("main", "nav_page_in_session", "N");

        //! $this->getNavigation() - возвращает объект навигации для постранички и кэш при этом берется разный для разных страниц?????

        if ($this->startResultCache($this->arParams['CACHE_TIME'], [
            $this->arParams['CACHE_GROUPS'],
            $this->getNavigationObject(),
        ])) {
            $this->arResult = $this->getItems();

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

        $arParams['USE_SEO'] = $arParams['USE_SEO'] === 'Y' ? true : false;

        return $arParams;
    }

    protected function getNavigationObject()
    {
        $nav = new \Bitrix\Main\UI\PageNavigation('nav-iblock-' .  $this->arParams['IBLOCK_ID']);

        $nav->allowAllRecords($this->arParams['PAGER_NAV_PARAMS']['bShowAll']);
        $nav->setPageSize($this->arParams['PAGER_NAV_PARAMS']['nPageSize']);
        $nav->initFromUri();

        return $nav;
    }

    protected function setNavigation($query, $nav = null)
    {
        $nav = $nav ? $nav : $this->getNavigationObject();

        $query->setLimit($nav->getLimit());
        $query->setOffset($nav->getOffset());
        $query->countTotal(true);

        return $query;
    }

    protected function setOrder($query)
    {
        $arOrder = [];

        if ($this->arParams['FIRST_SORT_FIELD'] && $this->arParams['FIRST_SORT_ORDER']) {
            $arOrder[$this->arParams['FIRST_SORT_FIELD']] = $this->arParams['FIRST_SORT_ORDER'];
        }

        if ($this->arParams['SECOND_SORT_FIELD'] && $this->arParams['SECOND_SORT_ORDER']) {
            $arOrder[$this->arParams['SECOND_SORT_FIELD']] = $this->arParams['SECOND_SORT_ORDER'];
        }

        if (!$arOrder) {
            $arOrder = ['SORT' => 'ASC'];
        }

        return $query->setOrder($arOrder);
    }

    protected function setSelect($query)
    {
        $arSelect = [];

        if ($this->arParams['SELECTED_FIELDS'] && is_array($this->arParams['SELECTED_FIELDS'])) {
            $arSelect = $this->arParams['SELECTED_FIELDS'];
            // Гаратируем что ID, IBLOCK_ID  точно будет в выборке
            if (!in_array('ID', $arSelect)) {
                $arSelect[] = 'ID';
            }
            if (!in_array('IBLOCK_ID', $arSelect)) {
                $arSelect[] = 'IBLOCK_ID';
            }

            if (in_array('DETAIL_PAGE_URL', $arSelect) || in_array('SECTION_CODE_PATH', $arSelect)) {
                $query->registerRuntimeField(
                    new ExpressionField(
                        'SECTION_CODE_PATH',
                        '
                          CONCAT(
                          COALESCE(%s,""), "/",
                          COALESCE(%s,""), "/",
                          COALESCE(%s,""), "/",
                          COALESCE(%s,""), "/",
                          COALESCE(%s,""), "/"
                        )',
                        [
                            'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
                            'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
                            'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
                            'IBLOCK_SECTION.PARENT_SECTION.CODE',
                            'IBLOCK_SECTION.CODE',
                        ]
                    )
                );
                $query->registerRuntimeField(
                    new ExpressionField(
                        'DETAIL_PAGE_URL',
                        '
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        %s, "#ID#", %s
                                                    ), "#ELEMENT_CODE#", %s
                                                ), "#SECTION_CODE_PATH#", %s
                                            ), "#SITE_DIR#", ""
                                        ), "//", "/"
                                    ), "//", "/"
                                ), "//", "/"
                            ), "//", "/"
                        )',
                        ['IBLOCK.DETAIL_PAGE_URL', 'ID', 'CODE', 'SECTION_CODE_PATH']
                    )
                );
            }
        }

        if (!$arSelect) {
            $arSelect = ['ID', 'IBLOCK_ID'];
        }

        return $query->setSelect($arSelect);
    }

    protected function getProps($elementId, $arPropsCodes = [])
    {
        $elementId = intval($elementId);

        if ($elementId <= 0) {
            return [];
        }

        if (!is_array($arPropsCodes) || empty($arPropsCodes)) {
            return [];
        }
        //! TODO:  Multiple возвращают сериализованные данные, нужно их десериализовать 
        $query = ElementPropertyTable::query();
        $query->setSelect([
            'NAME' => 'pt.NAME',
            'CODE' => 'pt.CODE',
            'VALUE',
            'PROPERTY_TYPE' => 'pt.PROPERTY_TYPE',
            'MULTIPLE' => 'pt.MULTIPLE',
            'IS_REQUIRED' => 'pt.IS_REQUIRED',
            'USER_TYPE' => 'pt.USER_TYPE',
        ]);
        $query->registerRuntimeField(
            new Reference(
                'pt',
                PropertyTable::class,
                Join::on('this.IBLOCK_PROPERTY_ID', 'ref.ID')
            )
        );
        $query->where("IBLOCK_ELEMENT_ID", $elementId);
        $query->whereIn("pt.CODE", $arPropsCodes);

        return $query->exec()->fetchAll();
    }

    protected function setFilter($query)
    {
        //! TODO: Добавить поддержку ORM фильтрации 
        // if (is_array($this->arParams['FILTER']) && !empty($this->arParams['FILTER'])) {
        //     $arFilter = array_merge($this->arParams['FILTER'], $arFilter);
        // }

        $query->where('IBLOCK_ID', $this->arParams['IBLOCK_ID']);
        $query->where('ACTIVE', 'Y');

        if ($this->arParams['SECTION_ID']) {
            $query->where('IBLOCK_SECTION_ID', $this->arParams['SECTION_ID']);
        } elseif ($this->arParams['SECTION_CODE']) {
            $query->where('IBLOCK_SECTION.CODE', $this->arParams['SECTION_CODE']);
        }

        return $query;
    }

    protected function getFile($fileId, $uploadDir)
    {
        $arFile = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'SUBDIR', 'FILE_NAME', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
            '=ID' => $fileId
        ], 'limit' => 1])->fetch();

        $fileSrc = "/" . $uploadDir . "/" . $arFile["SUBDIR"] . "/" . $arFile["FILE_NAME"];

        $fileSrc = str_replace("//", "/", $fileSrc);

        if (defined("BX_IMG_SERVER")) {
            $fileSrc = BX_IMG_SERVER . $fileSrc;
        }

        $arFile['SRC'] = $fileSrc;

        return $arFile;
    }

    protected function getItems()
    {
        global $USER;

        $isUserAdmin = $USER->IsAdmin();

        if ($this->arParams['IBLOCK_ID'] > 0) {
            $query = ElementTable::query();

            $nav = $this->getNavigationObject();

            $this->setSelect($query);
            $this->setOrder($query);
            $this->setFilter($query);
            $this->setNavigation($query, $nav);

            $dbItems = $query->exec();

            $nav->setRecordCount($dbItems->getCount());

            $uploadDir = Option::get("main", "upload_dir", "upload");

            $iblockBuilder = null;

            if ($isUserAdmin) {
                $iblockBuilder = new WelpodronIblockElementsActionsBuilder();
                $iblockBuilder->setIblockId($this->arParams['IBLOCK_ID']);
            }

            $arItems = [];

            while ($dbItem = $dbItems->fetch()) {
                $arFields = $dbItem;

                if ($arFields['PREVIEW_PICTURE']) {
                    $arFields['PREVIEW_PICTURE'] = $this->getFile($arFields['PREVIEW_PICTURE'], $uploadDir);
                }

                if ($arFields['DETAIL_PICTURE']) {
                    $arFields['DETAIL_PICTURE'] = $this->getFile($arFields['DETAIL_PICTURE'], $uploadDir);
                }

                $arProps = [];

                if ($this->arParams['SELECTED_PROPS'] && is_array($this->arParams['SELECTED_PROPS'])) {
                    $arProps = $this->getProps($arFields['ID'], $this->arParams['SELECTED_PROPS']);

                    //! TODO: Проверить как работает с множественными файлами 
                    foreach ($arProps as &$arProp) {
                        if ($arProp['PROPERTY_TYPE'] === 'F') {
                            $arProp['VALUE'] = $this->getFile($arProp['VALUE'], $uploadDir);
                        }
                    }

                    unset($arProp);
                }

                $arActions = [];

                if ($iblockBuilder) {
                    $arActions['EDIT_LINK'] = $iblockBuilder->getElementDetailUrl($arFields['ID']);
                    $arActions['DELETE_LINK'] = $iblockBuilder->getElementDetailUrl($arFields['ID'], [], '&action=delete');
                }

                if ($this->arParams['USE_SEO']) {
                    $arFields = array_merge($arFields, (new ElementValues($arFields['IBLOCK_ID'], $arFields['ID']))->getValues());
                }

                $arItem = [
                    'FIELDS' => $arFields,
                    'PROPS' => $arProps,
                    'ACTIONS' => $arActions,
                ];

                $arItems[] = $arItem;
            }

            // $arButtons = CIBlock::GetPanelButtons(
            //     $this->arParams['IBLOCK_ID'],
            //     0,
            //     0,
            //     ['SECTION_BUTTONS' => false]
            // );

            // // TODO: Rework to D7!

            // global $APPLICATION;

            // if ($APPLICATION->GetShowIncludeAreas()) {
            //     $this->addIncludeAreaIcons(CIBlock::GetComponentMenu($APPLICATION->GetPublicShowMode(), $arButtons));
            // }

            return [
                'ITEMS' => $arItems,
                'NAV_OBJECT' => $nav,
            ];
        }
    }
}
