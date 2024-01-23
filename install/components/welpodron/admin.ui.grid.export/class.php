<?

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\ORM\Query\Result;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\ScalarField;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\ORM\Objectify\EntityObject;

use Bitrix\Main\ORM\EntityError;
use Bitrix\Main\ORM\Fields\FieldError;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) {
	die();
}

class WelpodronAdminUiGridImportComponent extends CBitrixComponent implements Controllerable, Bitrix\Main\Errorable
{
	const DEFAULT_FIELD_VALIDATION_ERROR_CODE = "FIELD_VALIDATION_ERROR";
	const DEFAULT_FORM_GENERAL_ERROR_CODE = "FORM_GENERAL_ERROR";
	const DEFAULT_REDIRECT_PATH = DIRECTORY_SEPARATOR;
	const DEFAULT_FOUND_ELEMENTS_ACTION = 'SKIP';

	/** @var EntityObject $item */
	protected $item;

	/** @var ErrorCollection $errorCollection */
	protected $errorCollection;

	public function getErrors()
	{
		return $this->errorCollection->toArray();
	}

	public function getErrorByCode($code)
	{
		return $this->errorCollection->getErrorByCode($code);
	}

	public function addError(Error $error)
	{
		$this->errorCollection[] = $error;
	}

	public function configureActions()
	{
		return [];
	}

	protected function listKeysSignedParameters()
	{
		return [
			'PATH_TO_EDIT',
			'IFRAME',
			'MODULE_ID',
			'TABLE_CLASS',
		];
	}

	public function onPrepareComponentParams($arParams)
	{
		$this->errorCollection = new ErrorCollection();

		if (!$arParams['MODULE_ID']) {
			$this->addError(new Error('Не указан ID модуля'));
			return [];
		}

		if (!Loader::includeModule($arParams['MODULE_ID'])) {
			$this->addError(new Error('Не удалось подключить модуль "' . $arParams['MODULE_ID'] . '"'));
			return [];
		}

		if (!$arParams['TABLE_CLASS']) {
			$this->addError(new Error('Не указан PHP класс таблицы'));
			return [];
		}

		if (!class_exists($arParams['TABLE_CLASS'])) {
			$this->addError(new Error('Не удалось найти PHP класс таблицы'));
			return [];
		}

		if (!Loader::includeModule('ui')) {
			$this->addError(new Error('Не удалось подключить модуль "ui"'));
			return [];
		}

		$arParams['ID'] = isset($arParams['ID']) ? intval($arParams['ID']) : null;

		$arParams['PATH_TO_ADD'] = $arParams['PATH_TO_ADD'] ?? '';
		$arParams['PATH_TO_EDIT'] = $arParams['PATH_TO_EDIT'] ?? '';
		$arParams['PATH_TO_LIST'] = $arParams['PATH_TO_LIST'] ?? '';

		$arParams['IFRAME'] = isset($arParams['IFRAME']) ? $arParams['IFRAME'] == 'Y' : $this->request->get('IFRAME') == 'Y';
		$arParams['SET_TITLE'] = isset($arParams['SET_TITLE']) ? $arParams['SET_TITLE'] == 'Y' : true;
		$arParams['CAN_EDIT'] = $arParams['CAN_EDIT'] ?? false;

		return $arParams;
	}

	protected function getResult()
	{
		$GLOBALS['APPLICATION']->SetTitle('Экспорт данных в JSON из таблицы ' . $this->arParams['TABLE_CLASS']::getTableName());

		$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
		$tablePK = $tableEntity->getPrimary();

		$_row = $this->arParams['TABLE_CLASS']::getById($this->arParams['ID'])->fetch();

		if ($_row) {
			$id = null;

			foreach ($_row as $column => &$value) {
				if ($column === 'EXTERNAL_ID') {
					if (empty($value)) {
						$id = $_row[$tablePK];
						$value = $_row[$tablePK];
					}
				}

				if (is_array($value)) {
					$value = array_map(function ($_value) {
						return htmlspecialchars_decode($_value);
					}, $value);
				} else {
					$value = htmlspecialchars_decode($value);
				}
			}

			unset($value);

			if ($id) {
				$this->arParams['TABLE_CLASS']::update($id, ['EXTERNAL_ID' => $id]);
			}

			return ['DATA' => Json::encode([$_row], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)];
		} else {
			$rows = $this->arParams['TABLE_CLASS']::getList([
				'select' => ['*']
			])->fetchAll();

			$ids = [];

			foreach ($rows as &$row) {
				foreach ($row as $column => &$value) {
					if ($column === 'EXTERNAL_ID') {
						if (empty($value)) {
							$ids[] = $row[$tablePK];
							$value = $row[$tablePK];
						}
					}

					if (is_array($value)) {
						$value = array_map(function ($_value) {
							return htmlspecialchars_decode($_value);
						}, $value);
					} else {
						$value = htmlspecialchars_decode($value);
					}
				}

				unset($value);
			}

			unset($row);

			foreach ($ids as $id) {
				$this->arParams['TABLE_CLASS']::update($id, ['EXTERNAL_ID' => $id]);
			}

			return ['DATA' => Json::encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)];
		}

		return ['DATA' => ''];
	}

	public function executeComponent()
	{
		if (!empty($this->errorCollection)) {
			foreach ($this->errorCollection as $error) {
				ShowError($error);
				return;
			};
		}

		$this->arResult = $this->getResult();

		$this->includeComponentTemplate();

		return $this->arResult;
	}
}
