<?

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\ORM\Query\Result;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\ScalarField;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\ORM\Objectify\EntityObject;
// use Welpodron\Seocities\CityTable as GridTable;

use Bitrix\Main\ORM\EntityError;
use Bitrix\Main\ORM\Fields\FieldError;

if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) {
	die();
}

class WelpodronAdminUiGridItemComponent extends CBitrixComponent implements Controllerable, Bitrix\Main\Errorable
{
	// const MODULE_ID = 'welpodron.seocities';
	const DEFAULT_FIELD_VALIDATION_ERROR_CODE = "FIELD_VALIDATION_ERROR";
	const DEFAULT_FORM_GENERAL_ERROR_CODE = "FORM_GENERAL_ERROR";
	const DEFAULT_REDIRECT_PATH = DIRECTORY_SEPARATOR;

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
			'MODULE_ID',
			'TABLE_CLASS',
			'IFRAME',
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

	public function saveAction()
	{
		try {
			$arDataRaw = $this->request->getPostList()->toArray();

			$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
			$tableFields = $tableEntity->getFields();

			//! TODO: Пока поддерживается только один первичный ключ
			/** @var string $primaryField */
			$primaryField = $tableEntity->getPrimary();

			$updateFlag = false;

			if (intval($arDataRaw[$primaryField]) > 0) {
				$updateFlag = true;
			}

			$arDataValid = [];

			/** @var ScalarField $field */
			foreach ($tableFields as $field) {
				if ($field->isPrimary() && $field->isAutocomplete()) {
					continue;
				}

				if ($field->getName() === "EXTERNAL_ID") {
					continue;
				}

				$arDataValid[$field->getName()] = $arDataRaw[$field->getName()];
			}

			try {
				if ($updateFlag) {
					$result = $this->arParams['TABLE_CLASS']::update($arDataRaw[$primaryField], $arDataValid);
				} else {
					$result = $this->arParams['TABLE_CLASS']::add($arDataValid);
				}

				if (!$result->isSuccess()) {
					$errors = $result->getErrors();

					foreach ($errors as $error) {
						$code = $error->getCode();

						if ($error instanceof FieldError) {
							if ($code === FieldError::INVALID_VALUE || $code === FieldError::EMPTY_REQUIRED) {
								$this->addError(new Error($error->getMessage(), self::DEFAULT_FIELD_VALIDATION_ERROR_CODE, $error->getField()->getName()));
								return;
							}

							$this->addError(new Error($error->getMessage(), self::DEFAULT_FORM_GENERAL_ERROR_CODE));
							return;
						}


						$this->addError(new Error($error->getMessage(), self::DEFAULT_FORM_GENERAL_ERROR_CODE));
						return;
					}
				}
			} catch (\Throwable $th) {
				$this->addError(new Error($th->getMessage(), self::DEFAULT_FORM_GENERAL_ERROR_CODE, $th->getTrace()));
				return;
			}

			$pathTo = self::DEFAULT_REDIRECT_PATH;

			if ($this->arParams['PATH_TO_EDIT']) {
				// $pathTo = str_replace('#id#', '32', $this->arParams['PATH_TO_EDIT']);
				$pathTo = str_replace('#id#', $result->getId(), $this->arParams['PATH_TO_EDIT']);
				if ($this->arParams['IFRAME']) {
					$pathTo .= strpos($pathTo, '?') === false ? '?' : '&';
					$pathTo .= 'IFRAME=Y';
				}
			}

			LocalRedirect($pathTo);
			exit;

			return '<p>Данные успешно обновлены</p>';
		} catch (\Throwable $th) {
			$this->addError(new Error($th->getMessage(), $th->getCode(), $th->getTrace()));
			return;
		}
	}

	protected function getResult()
	{
		/** @var EntityObject $item */
		$this->item = $this->arParams['TABLE_CLASS']::getById($this->arParams['ID'])->fetchObject();

		$currentValues = [];

		if ($this->item) {
			$currentValues = $this->item->collectValues();
		}

		$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
		$tableFields = $tableEntity->getFields();

		$arFields = [];

		/** @var ScalarField $field */
		foreach ($tableFields as $field) {
			if ($field->getName() === "EXTERNAL_ID") {
				continue;
			}

			$fieldType = end(explode('\\', get_class($field)));

			$fieldValue = $currentValues[$field->getName()] ?? '';

			if (is_array($fieldValue)) {
				$fieldValue = array_map(function ($value) {
					return htmlspecialchars_decode($value);
				}, $fieldValue);
			} else {
				$fieldValue = htmlspecialchars_decode($fieldValue);
			}

			$isMultiple = false;

			if ($fieldType == 'HTMLTextField') {
				$element = 'editor';
			} elseif ($fieldType == 'HTMLTextFieldMultiple') {
				$element = 'editor';
				$isMultiple = true;
			} elseif ($fieldType === 'TextFieldMultiple') {
				$element = 'textarea';
				$isMultiple = true;
			} elseif ($fieldType == 'TextField') {
				$element = 'textarea';
			} else {
				$element = 'textbox';
			}

			$arFields[] = [
				//! Группа FIELD_ - Больше близко к бд и самой сущности
				'FIELD_ID' => $field->getName(),
				'FIELD_TITLE' => $field->getTitle(),
				'FIELD_VALUE' => $fieldValue,
				'FIELD_REQUIRED' =>  $field->isAutocomplete() ? false : $field->isRequired(),
				'FIELD_PRIMARY' => $field->isPrimary(),
				//! Внимание! PHP объект сущности FIELD_OBJECT недоступен в ajax режиме 
				'FIELD_OBJECT' => $field,
				'FIELD_TYPE' => end(explode('\\', get_class($field))),
				//! Группа ELEMENT_ - Больше близко к html и тому что будет на странице
				'ELEMENT_MULTIPLE' => $isMultiple,
				'ELEMENT' => $element,  // textbox, select, textarea, editor
			];
		};

		$GLOBALS['APPLICATION']->SetTitle('Редактирование элемента таблицы ' . $this->arParams['TABLE_CLASS']::getTableName());

		return [
			'FIELDS' => $arFields,
			'ITEM' => $this->item,
		];
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
