<?

if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Iblock\SectionPropertyTable;
use Bitrix\Iblock\SectionTable;
use Bitrix\Iblock\IblockTable;
use Bitrix\Iblock\PropertyTable;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;
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
use Bitrix\Main\Application;
// SEO
use Bitrix\Iblock\InheritedProperty\SectionValues;
// Minified cache (experimental)
use Bitrix\Main\Data\Cache;

use Welpodron\Optimizer\Utils;

if (!Loader::includeModule('iblock')) {
    throw new \Exception('Не удалось подключить модуль iblock');
}

class WelpodronOrmSectionsActionsBuilder extends IblockBuilder
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

class WelpodronOrmCollectionSections extends CBitrixComponent
{
    public function __getCachePath()
    {
        global $CACHE_MANAGER;

        return $CACHE_MANAGER->getCompCachePath($this->getRelativePath());
    }

    public function executeComponent()
    {
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

    public function onPrepareComponentParams($arParams)
    {
        if (!Loader::includeModule('iblock')) {
            return [];
        }

        $arParams['IBLOCK_ID'] = intval($arParams['IBLOCK_ID']);

        if ($arParams['IBLOCK_ID'] <= 0) {
            return [];
        }

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

        $arParams['USE_SEO'] = $arParams['USE_SEO'] === 'Y' ? true : false;

        if ($arParams['SELECTED_PROPS'] && is_array($arParams['SELECTED_PROPS'])) {
            $arParams['SELECTED_PROPS'] = array_filter($arParams['SELECTED_PROPS']);
        }

        return $arParams;
    }

    protected function setActions()
    {
        global $USER;
        global $APPLICATION;

        if ($APPLICATION->GetShowIncludeAreas() && $USER->IsAdmin()) {
            $urlBuilder = new WelpodronOrmSectionsActionsBuilder();
            $urlBuilder->setIblockId($this->arParams['IBLOCK_ID']);

            $returnUrl = \Bitrix\Main\Context::getCurrent()->getServer()->getRequestUri();

            if (defined("BX_AJAX_PARAM_ID")) {
                $returnUrl = CHTTP::urlDeleteParams($returnUrl, array(constant('BX_AJAX_PARAM_ID')));
            }

            if ($this->arResult && $this->arResult['ITEMS']) {
                foreach ($this->arResult['ITEMS'] as $arItem) {
                    $editUrl = $urlBuilder->getSectionDetailUrl($arItem['FIELDS']['ID'], [], '&bxpublic=Y&from_module=iblock&return_url=' . urlencode($returnUrl));

                    $this->addEditAction($arItem['FIELDS']['IBLOCK_ID'] . $arItem['FIELDS']['ID'], $editUrl, 'Изменить раздел', []);
                }
            }

            $addUrl = $urlBuilder->getSectionDetailUrl(null, [], '&bxpublic=Y&from_module=iblock&return_url=' . urlencode($returnUrl));

            $this->addIncludeAreaIcons([
                [
                    'TITLE' => 'Добавить раздел (верхний уровень)',
                    'URL' => "javascript:(new BX.CAdminDialog({'content_url':'" . $addUrl . "','width':'700','height':'400'})).Show()",
                    "ICON" => "bx-context-toolbar-create-icon",
                ]
            ]);
        }
    }

    protected function getNavigationObject()
    {
        $nav = new \Bitrix\Main\UI\PageNavigation('nav-iblock-sections-' .  $this->arParams['IBLOCK_ID']);

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

            // Гаратируем что ID, IBLOCK_ID  точно будет в выборке
            if (!in_array('ID', $arSelect)) {
                $arSelect[] = 'ID';
            }
            if (!in_array('IBLOCK_ID', $arSelect)) {
                $arSelect[] = 'IBLOCK_ID';
            }

            //! TODO: Пока что не поддерживается  SECTION_CODE_PATH
            // if (in_array('SECTION_PAGE_URL', $arSelect) || in_array('SECTION_CODE_PATH', $arSelect)) {
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
            //                 'PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'PARENT_SECTION.PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'PARENT_SECTION.PARENT_SECTION.CODE',
            //                 'PARENT_SECTION.CODE',
            //             ]
            //         )
            //     );
            //     $query->registerRuntimeField(
            //         new ExpressionField(
            //             'SECTION_PAGE_URL',
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
            //                                         ), "#SECTION_CODE_PATH#", %s
            //                                     ), "#SECTION_CODE_PATH#", %s
            //                                 ), "#SITE_DIR#", ""
            //                             ), "//", "/"
            //                         ), "//", "/"
            //                     ), "//", "/"
            //                 ), "//", "/"
            //             )',
            //             ['IBLOCK.SECTION_PAGE_URL', 'ID', 'CODE', 'SECTION_CODE_PATH']
            //         )
            //     );
            // }
            if (in_array('SECTION_PAGE_URL', $arSelect)) {
                //! Текущая настройка урл для инфоблока для такого свойства: #SITE_DIR#/все_что_угодно/#SECTION_CODE#/
                $query->registerRuntimeField(
                    new ExpressionField(
                        'SECTION_PAGE_URL',
                        '
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(REPLACE(%s, "#ID#", %s), "#SECTION_CODE#", %s), "#SITE_DIR#", ""),
                                            "//", "/"
                                    ), "//", "/"
                                ), "//", "/"
                            ), "//", "/"
                        )',
                        ['IBLOCK.SECTION_PAGE_URL', 'ID', 'CODE']
                    )
                );
            }
        }

        if (!$arSelect) {
            $arSelect = ['ID', 'IBLOCK_ID'];
        }

        return $query->setSelect($arSelect);
    }

    protected function getPropsEntity($arPropsCodes = [])
    {
        if (!$arPropsCodes) {
            return;
        }

        try {
            // $connection = Application::getConnection();

            $entityName = 'uts_props';
            $entityUtsTableName = sprintf('b_uts_iblock_%s_section', $this->arParams['IBLOCK_ID']);

            // if (!$connection->isTableExists($entityUtsTableName)) {
            //     return;
            // }

            $fields = [new IntegerField('VALUE_ID')];

            foreach ($arPropsCodes as $propCode) {
                if (!empty($propCode)) {
                    $fields[] = new StringField($propCode);
                }
            }

            $entity = Bitrix\Main\ORM\Entity::compileEntity($entityName, $fields, [
                'table_name'  => $entityUtsTableName,
            ]);

            return $entity;
        } catch (\Throwable $th) {
        }

        return;
    }

    protected function getProps($entity, $sectionId)
    {
        $sectionId = intval($sectionId);

        if ($sectionId <= 0) {
            return [];
        }

        $tableClass = $entity->getDataClass();

        $arData = $tableClass::getList([
            'select' => ['*'],
            'filter' => ['=VALUE_ID' => $sectionId],
        ])->fetch();

        unset($arData['VALUE_ID']);

        foreach ($arData as &$data) {
            $value = @unserialize($data);

            if ($value !== false) {
                $data = $value;
            }
        }

        return $arData;
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

    protected function getFile($fileId, $uploadDir)
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
                $query = SectionTable::query();

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

                if ($this->arParams['SELECTED_PROPS'] && is_array($this->arParams['SELECTED_PROPS'])) {
                    $propsEntity = $this->getPropsEntity($this->arParams['SELECTED_PROPS']);
                }

                while ($dbItem = $dbItems->fetch()) {
                    $arFields = $dbItem;

                    if ($arFields['PICTURE']) {
                        $arFields['PICTURE'] = $this->getFile($arFields['PICTURE'], $uploadDir);
                    }

                    $arProps = [];
                    //! TODO: Добавить поддержку свойств типа "Файл" 
                    if ($propsEntity) {
                        $arProps = $this->getProps($propsEntity, $arFields['ID']);
                    }

                    //! TODO: Вполне вероятно что мб это можно объединить с запросом выше ? 
                    if ($this->arParams['USE_SEO']) {
                        $arFields = array_merge($arFields, (new SectionValues($arFields['IBLOCK_ID'], $arFields['ID']))->getValues());
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
