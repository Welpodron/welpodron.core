<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Loader;

use Welpodron\Core\Utils\Buffer;

if (!Loader::includeModule('welpodron.core')) {
    throw new Exception('Модуль welpodron.core не найден');
}

if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) {
    die();
}

class WelpodronAdminUiFieldTextboxComponent extends CBitrixComponent implements Controllerable, Bitrix\Main\Errorable
{
    protected $errorCollection;

    public function getErrors()
    {
        return $this->errorCollection->toArray();
    }

    public function getErrorByCode($code)
    {
        return $this->errorCollection->getErrorByCode($code);
    }

    public function addError(\Bitrix\Main\Error $error)
    {
        $this->errorCollection[] = $error;
    }

    public function configureActions()
    {
        return [];
    }

    public function onPrepareComponentParams($arParams)
    {
        $this->errorCollection = new ErrorCollection();

        $arParams['FIELD_TITLE'] = $arParams['FIELD_TITLE'] ?? '';
        $arParams['FIELD_VALUE'] = $arParams['FIELD_VALUE'] ?? '';
        $arParams['FIELD_ID'] = $arParams['FIELD_ID'] ?? '';
        $arParams['FIELD_REQUIRED'] = $arParams['FIELD_REQUIRED'] == true || $arParams['FIELD_REQUIRED'] == 'Y' ? true : false;
        $arParams['ELEMENT_MULTIPLE'] = $arParams['ELEMENT_MULTIPLE'] == true || $arParams['ELEMENT_MULTIPLE'] == 'Y' ? true : false;

        return $arParams;
    }

    public function executeComponent()
    {
        $this->includeComponentTemplate();
    }

    public function getAction()
    {
        try {
            $arDataRaw = $this->request->getPostList()->toArray();

            if ($arDataRaw['args']) {
                $arParams = JSON::decode(base64_decode($arDataRaw['args']));
            } else {
                $arParams = [];
            }

            $this->arParams = $this->onPrepareComponentParams(array_merge($arParams, ['IS_AJAX' => true]));

            Buffer::startBuffer();

            $this->includeComponentTemplate();

            $result = Buffer::endBuffer();

            return $result;
        } catch (\Throwable $th) {
            $this->addError(new Error($th->getMessage(), $th->getCode(), $th->getTrace()));
            return;
        }
    }
}
