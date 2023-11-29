<?

if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
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
use Bitrix\Main\ORM\Query\Filter\ConditionTree;
// SEO
use Bitrix\Iblock\InheritedProperty\ElementValues;
// Minified cache (experimental)
use Bitrix\Main\Data\Cache;
use Welpodron\Optimizer\Utils;

if (!Loader::includeModule('iblock')) {
    ShowError('Модуль инфоблоков не был найден');
    die();
}

class WelpodronOrmElementsActionsBuilder extends IblockBuilder
{
    public function setIblockId(int $iblockId): void
    {
        if ($this->iblockId !== $iblockId) {
            $this->resetIblock();
            if ($iblockId > 0) {
                $iblock = IblockTable::getList([
                    'select' => ['*'],
                    'filter' => ['=ID' => $iblockId],
                    'cache' => ['ttl' => 3600000],
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

class WelpodronOrmCollectionElements extends CBitrixComponent
{
    // Minified cache methods (experimental)
    public function __getCachePath()
    {
        global $CACHE_MANAGER;

        return $CACHE_MANAGER->getCompCachePath($this->getRelativePath());
    }

    public function executeComponent()
    {
        //! $this->getNavigation() - возвращает объект навигации для постранички и кэш при этом берется разный для разных страниц?????
        $additionalCacheID = [$this->arParams['CACHE_GROUPS']];

        if ($this->arParams['USE_PAGER']) {
            CPageOption::SetOptionString("main", "nav_page_in_session", "N");
            $additionalCacheID[] = $this->getNavigationObject();
        };

        if ($this->arParams['USE_MINIFY_CACHE'] && Loader::includeModule('welpodron.optimizer')) {
            $cache = Cache::createInstance();

            if ($cache->startDataCache($this->arParams['CACHE_TIME'], $this->getCacheID($additionalCacheID), $this->__getCachePath())) {
                $this->arResult = $this->getItems();

                //! ВНИМАНИЕ! Записывает component_epilog.php в кэш чего быть не должно! 
                if ($this->initComponentTemplate("", $this->getSiteTemplateId(), "")) {
                    $this->showComponentTemplate();
                } else {
                    $cache->abortDataCache();
                    $this->__showError(str_replace(
                        array("#PAGE#", "#NAME#"),
                        array("", $this->getTemplateName()),
                        "Cannot find '#NAME#' template with page '#PAGE#'"
                    ));
                    return;
                }

                $this->__template->__component = null;

                $templateHTML = ob_get_contents();

                ob_clean();

                echo Utils::minifyHTML($templateHTML);

                $templateCachedData = $this->GetTemplateCachedData();

                $cache->endDataCache([
                    'arResult'           => $this->arResult,
                    'templateCachedData' => $templateCachedData,
                ]);
            } else {
                $vars = $cache->getVars();

                $this->arResult = $vars['arResult'];

                $this->SetTemplateCachedData($vars['templateCachedData']);
            }
        } else {
            if ($this->startResultCache($this->arParams['CACHE_TIME'], $additionalCacheID)) {
                $this->arResult = $this->getItems();

                if (!($this->arParams['IBLOCK_ID'] > 0)) {
                    $this->AbortResultCache();
                }

                if ($this->initComponentTemplate("", $this->getSiteTemplateId(), "")) {
                    $this->showComponentTemplate();
                } else {
                    $this->abortResultCache();
                    $this->__showError(str_replace(
                        array("#PAGE#", "#NAME#"),
                        array("", $this->getTemplateName()),
                        "Cannot find '#NAME#' template with page '#PAGE#'"
                    ));
                }

                $this->__template->__component = null;
            }
        }

        if ($this->__template) {
            if (file_exists($_SERVER["DOCUMENT_ROOT"] . $this->__template->__folder . "/component_epilog.php")) {
                $this->includeComponentEpilog([
                    "epilogFile" => $this->__template->__folder . "/component_epilog.php",
                    "templateName" => $this->__template->__name,
                    "templateFile" => $this->__template->__file,
                    "templateFolder" => $this->__template->__folder,
                    "templateData" => false,
                ]);
            }
        }

        $this->setActions();

        return $this->arResult;
    }

    protected function setActions()
    {
        global $USER;
        global $APPLICATION;

        if ($APPLICATION->GetShowIncludeAreas() && $USER->IsAdmin()) {
            $urlBuilder = new WelpodronOrmElementsActionsBuilder();
            $urlBuilder->setIblockId($this->arParams['IBLOCK_ID']);

            $returnUrl = \Bitrix\Main\Context::getCurrent()->getServer()->getRequestUri();

            if (defined("BX_AJAX_PARAM_ID")) {
                $returnUrl = CHTTP::urlDeleteParams($returnUrl, array(constant('BX_AJAX_PARAM_ID')));
            }

            if ($this->arResult && $this->arResult['ITEMS']) {
                foreach ($this->arResult['ITEMS'] as $arItem) {
                    $editUrl = $urlBuilder->getElementDetailUrl($arItem['FIELDS']['ID'], [], '&bxpublic=Y&from_module=iblock&return_url=' . urlencode($returnUrl));

                    $this->addEditAction($arItem['FIELDS']['IBLOCK_ID'] . $arItem['FIELDS']['ID'], $editUrl, 'Изменить элемент', []);
                }
            }

            $addUrl = $urlBuilder->getElementDetailUrl(null, [], '&bxpublic=Y&from_module=iblock&return_url=' . urlencode($returnUrl));

            $this->addIncludeAreaIcons([
                [
                    'TITLE' => 'Добавить элемент (верхний уровень)',
                    'URL' => "javascript:(new BX.CAdminDialog({'content_url':'" . $addUrl . "','width':'700','height':'400'})).Show()",
                    "ICON" => "bx-context-toolbar-create-icon",
                ]
            ]);
        }
    }

    public function onPrepareComponentParams($arParams)
    {
        if (!Loader::includeModule('iblock')) {
            return [];
        }

        $arParams['IBLOCK_ID'] = intval($arParams['IBLOCK_ID']);

        if ($arParams['IBLOCK_ID'] <= 0) {
            return [];
        }

        //! На данный момент в целом достаточно редко используются группы пользователей для кэша
        //! Хотя с другой стороны там в кэше есть ACTIONS которой зависит от групп пользователей  
        //! Тут стоит подумать отключить или нет так как если заботит размер кэша
        //! То лучше отключать  
        if ($arParams['CACHE_GROUPS'] === 'N') {
            $arParams['CACHE_GROUPS'] = false;
        } else {
            $arParams['CACHE_GROUPS'] = CurrentUser::get()->getUserGroups();
        }

        $arParams['CACHE_TIME'] = isset($arParams['CACHE_TIME']) ? $arParams['CACHE_TIME'] : 36000;

        $arParams['USE_MINIFY_CACHE'] = $arParams['USE_MINIFY_CACHE'] == 'Y' ? true : false;

        if (!Loader::includeModule('welpodron.optimizer')) {
            $arParams['USE_MINIFY_CACHE'] = false;
        }

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

        //! Влияет на размер кэша 
        $arParams['USE_PAGER'] = $arParams['USE_PAGER'] == 'Y' ? true : false;

        $arParams["PAGER_COUNT"] = intval($arParams["PAGER_COUNT"]);
        if ($arParams["PAGER_COUNT"] <= 0) {
            $arParams["PAGER_COUNT"] = 20;
        }

        $arParams['PAGER_TEMPLATE'] = trim($arParams['PAGER_TEMPLATE']);

        $arParams['PAGER_NAV_PARAMS'] = [
            'nPageSize' => $arParams['PAGER_COUNT'],
            'bShowAll' => true,
        ];

        $arParams['USE_SEO'] = $arParams['USE_SEO'] == 'Y' ? true : false;

        return $arParams;
    }

    protected function getNavigationObject()
    {
        $nav = new \Bitrix\Main\UI\PageNavigation('nav-iblock-elements-' .  $this->arParams['IBLOCK_ID']);

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
            $arSelect = [];

            foreach ($this->arParams['SELECTED_FIELDS'] as $field) {
                if (!empty($field)) {
                    $arSelect[] = $field;
                }
            };

            // Гарантируем что ID, IBLOCK_ID  точно будет в выборке
            if (!in_array('ID', $arSelect)) {
                $arSelect[] = 'ID';
            }
            if (!in_array('IBLOCK_ID', $arSelect)) {
                $arSelect[] = 'IBLOCK_ID';
            }

            // if (in_array('DETAIL_PAGE_URL', $arSelect) || in_array('SECTION_CODE_PATH', $arSelect)) {
            //     $query->registerRuntimeField(
            //         new ExpressionField(
            //             'SECTION_CODE_PATH',
            //             '
            //               CONCAT(
            //               COALESCE(%s,""), "/",
            //               COALESCE(%s,""), "/",
            //               COALESCE(%s,""), "/",
            //               COALESCE(%s,""), "/",
            //               COALESCE(%s,""), "/"
            //             )',
            //             [
            //                 'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'IBLOCK_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'IBLOCK_SECTION.PARENT_SECTION.CODE',
            //                 'IBLOCK_SECTION.CODE',
            //             ]
            //         )
            //     );
            //     $query->registerRuntimeField(
            //         new ExpressionField(
            //             'DETAIL_PAGE_URL',
            //             '
            //             REPLACE(
            //                 REPLACE(
            //                     REPLACE(
            //                         REPLACE(
            //                             REPLACE(
            //                                 REPLACE(
            //                                     REPLACE(
            //                                         REPLACE(
            //                                             %s, "#ID#", %s
            //                                         ), "#ELEMENT_CODE#", %s
            //                                     ), "#SECTION_CODE_PATH#", %s
            //                                 ), "#SITE_DIR#", ""
            //                             ), "//", "/"
            //                         ), "//", "/"
            //                     ), "//", "/"
            //                 ), "//", "/"
            //             )',
            //             ['IBLOCK.DETAIL_PAGE_URL', 'ID', 'CODE', 'SECTION_CODE_PATH']
            //         )
            //     );
            // }

            //! TODO: Пока что не поддерживается  SECTION_CODE_PATH

            if (in_array('DETAIL_PAGE_URL', $arSelect)) {
                //! Тут что менять берется из настроек инфоблока ну те url детальной страницы
                //! Текущая настройка урл для инфоблока для такого свойства: #SITE_DIR#/все_что_угодно/#SECTION_CODE#/#ELEMENT_CODE#/ 
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
                                                ), "#SECTION_CODE#", %s
                                            ), "#SITE_DIR#", ""
                                        ), "//", "/"
                                    ), "//", "/"
                                ), "//", "/"
                            ), "//", "/"
                        )',
                        ['IBLOCK.DETAIL_PAGE_URL', 'ID', 'CODE', 'IBLOCK_SECTION.CODE']
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
        $query->where('IBLOCK_ID', $this->arParams['IBLOCK_ID']);
        $query->where('ACTIVE', 'Y');

        if ($this->arParams['FILTER'] instanceof ConditionTree) {
            $query->where($this->arParams['FILTER']);
        };

        return $query;
    }

    protected function getFile($fileId, $uploadDir = '/upload')
    {
        $arFile = FileTable::getList(['select' => ['ID', 'WIDTH', 'HEIGHT', 'SUBDIR', 'FILE_NAME', 'CONTENT_TYPE', 'FILE_SIZE', 'DESCRIPTION'], 'filter' => [
            '=ID' => $fileId
        ], 'limit' => 1])->fetch();

        $fileSrc = "/" . $uploadDir . "/" . $arFile["SUBDIR"] . "/" . $arFile["FILE_NAME"];

        $fileSrc = str_replace("//", "/", $fileSrc);

        if (defined("BX_IMG_SERVER")) {
            $fileSrc = constant('BX_IMG_SERVER') . $fileSrc;
        }

        $arFile['SRC'] = $fileSrc;

        return $arFile;
    }

    protected function getItems()
    {
        try {

            if ($this->arParams['IBLOCK_ID'] > 0) {
                $query = ElementTable::query();

                $nav = null;

                if ($this->arParams['USE_PAGER']) {
                    $nav = $this->getNavigationObject();
                    $this->setNavigation($query, $nav);
                }

                $this->setSelect($query);
                $this->setOrder($query);
                $this->setFilter($query);

                $dbItems = $query->exec();

                if ($this->arParams['USE_PAGER']) {
                    $nav->setRecordCount($dbItems->getCount());
                }

                $uploadDir = Option::get("main", "upload_dir", "upload");

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
                        $dbProps = $this->getProps($arFields['ID'], $this->arParams['SELECTED_PROPS']);

                        //! TODO: Проверить как работает с множественными файлами 
                        foreach ($dbProps as &$arProp) {
                            if ($arProp['PROPERTY_TYPE'] === 'F') {
                                $arProp['VALUE'] = $this->getFile($arProp['VALUE'], $uploadDir);
                            } else {
                                $value = @unserialize($arProp['VALUE']);

                                if ($value !== false) {
                                    $arProp['VALUE'] = $value;
                                }
                            }

                            $arProps[$arProp['CODE']] = $arProp;
                        }

                        unset($arProp);
                    }

                    if ($this->arParams['USE_SEO']) {
                        $arFields = array_merge($arFields, (new ElementValues($arFields['IBLOCK_ID'], $arFields['ID']))->getValues());
                    }

                    $arItem = [
                        'FIELDS' => $arFields,
                    ];

                    if ($arProps) {
                        $arItem['PROPS'] = $arProps;
                    }

                    $arItems[] = $arItem;
                }

                $arResult = [
                    'ITEMS' => $arItems,
                ];

                if ($nav) {
                    $arResult['NAV_OBJECT'] = $nav;
                }

                return $arResult;
            }
        } catch (\Throwable $th) {
            $this->__showError($th->getMessage(), $th->getCode());
            echo '<br><br>';
            $this->__showError($th->getTraceAsString());
        }

        return [];
    }
}
