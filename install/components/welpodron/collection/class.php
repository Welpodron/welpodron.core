<?

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\FileTable;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Context;

class WelpodronCollection extends CBitrixComponent
{
    const DEFAULT_URL_TEMPLATES = [
        'collection_root' => '',
        'collection_element' => '#ELEMENT_CODE#/',
    ];

    public function executeComponent()
    {
        $arUrlTemplates = CComponentEngine::makeComponentUrlTemplates(static::DEFAULT_URL_TEMPLATES, $this->arParams['SEF_URL_TEMPLATES']);
        $arVariableAliases = CComponentEngine::MakeComponentVariableAliases([],$this->arParams['VARIABLE_ALIASES']);
        $arVariables = [];
        
        $componentPage = CComponentEngine::ParseComponentPath($this->arParams['SEF_FOLDER'],$arUrlTemplates,$arVariables);

        CComponentEngine::InitComponentVariables($componentPage,[],$arVariableAliases,$arVariables);

        $this->arResult = [
            'FOLDER'        => $this->arParams['SEF_FOLDER'],
            'URL_TEMPLATES' => $arUrlTemplates,
            'VARIABLES'     => $arVariables,
            'ALIASES'       => $arVariableAliases,
        ];
        
        $this->includeComponentTemplate($componentPage);

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
}
