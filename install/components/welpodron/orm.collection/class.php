<?

if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

use Bitrix\Main\Loader;

class WelpodronOrmCollection extends CBitrixComponent
{
    const DEFAULT_URL_TEMPLATES = [
        'collection_root' => '',
        'collection_section' => '#SECTION_ID#/',
        'collection_element' => '#SECTION_ID#/#ELEMENT_ID#/',
    ];

    public function executeComponent()
    {
        $arVariables = [];
        $arComponentVariables = [
            "SECTION_ID",
            "SECTION_CODE",
            "ELEMENT_ID",
            "ELEMENT_CODE",
        ];

        $arUrlTemplates = CComponentEngine::makeComponentUrlTemplates(
            static::DEFAULT_URL_TEMPLATES,
            $this->arParams['SEF_URL_TEMPLATES']
        );


        $arVariableAliases = CComponentEngine::MakeComponentVariableAliases(
            [],
            $this->arParams['VARIABLE_ALIASES']
        );


        $componentPage = CComponentEngine::ParseComponentPath(
            $this->arParams['SEF_FOLDER'],
            $arUrlTemplates,
            $arVariables
        );

        if (!$componentPage) {
            $componentPage = 'collection_root';
        }

        CComponentEngine::InitComponentVariables(
            $componentPage,
            $arComponentVariables,
            $arVariableAliases,
            $arVariables
        );

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

        $arParams['IBLOCK_ID'] = intval($arParams['IBLOCK_ID']);

        return $arParams;
    }
}
