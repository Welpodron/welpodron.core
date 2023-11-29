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
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) {
	die();
}

class WelpodronAdminUiGridImportComponent extends CBitrixComponent implements Controllerable, Bitrix\Main\Errorable
{
	// const MODULE_ID = 'welpodron.seocities';
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

	public function saveAction()
	{
		try {
			$arDataRaw = $this->request->getPostList()->toArray();

			$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
			//! TODO: Пока поддерживается только один первичный ключ
			/** @var string $primaryField */
			$primaryField = $tableEntity->getPrimary();

			$importedData = Json::decode($arDataRaw['IMPORTED_JSON']);

			if (!$importedData || !is_array($importedData) || !count($importedData)) {
				$this->addError(new Error('Не удалось распарсить JSON', self::DEFAULT_FORM_GENERAL_ERROR_CODE));
				return;
			}

			$foundElementsAction = $arDataRaw['FOUND_ELEMENTS_ACTION'] ?? self::DEFAULT_FOUND_ELEMENTS_ACTION;

			if ($foundElementsAction === 'DELETE') {
				try {
					// clear table before any other actions
					$elements = $this->arParams['TABLE_CLASS']::getList([
						'select' => [$primaryField],
					])->fetchAll();

					foreach ($elements as $element) {
						$result = $this->arParams['TABLE_CLASS']::delete($element[$primaryField]);

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
					}
				} catch (\Throwable $th) {
					$this->addError(new Error($th->getMessage(), self::DEFAULT_FORM_GENERAL_ERROR_CODE, $th->getTrace()));
					return;
				}
			}

			$externalIds = array_column($importedData, 'EXTERNAL_ID');

			$elementsFound = $this->arParams['TABLE_CLASS']::getList([
				'select' => [$primaryField, 'EXTERNAL_ID'],
				'filter' => ['=EXTERNAL_ID' => $externalIds],
			])->fetchAll();

			$elementsToAdd = array_filter($importedData, function ($item) use ($elementsFound) {
				return !in_array($item['EXTERNAL_ID'], array_column($elementsFound, 'EXTERNAL_ID'));
			});

			foreach ($elementsToAdd as $element) {
				// remove PK from element
				unset($element[$primaryField]);

				try {
					$result = $this->arParams['TABLE_CLASS']::add($element);

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
			}

			foreach ($elementsFound as $element) {
				// found element in $importedData
				$foundElementKey = array_search($element['EXTERNAL_ID'], array_column($importedData, 'EXTERNAL_ID'));
				$foundElement = $importedData[$foundElementKey];

				// remove PK from element
				unset($foundElement[$primaryField]);

				try {
					$result = $this->arParams['TABLE_CLASS']::update($element[$primaryField], $foundElement);

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
			}

			// $pathTo = self::DEFAULT_REDIRECT_PATH;

			// if ($this->arParams['PATH_TO_EDIT']) {
			// 	// $pathTo = str_replace('#id#', '32', $this->arParams['PATH_TO_EDIT']);
			// 	$pathTo = str_replace('#id#', $result->getId(), $this->arParams['PATH_TO_EDIT']);
			// 	if ($this->arParams['IFRAME']) {
			// 		$pathTo .= strpos($pathTo, '?') === false ? '?' : '&';
			// 		$pathTo .= 'IFRAME=Y';
			// 	}
			// }

			// LocalRedirect($pathTo);
			// exit;

			return '<p>Данные успешно обновлены</p>';
		} catch (\Throwable $th) {
			$this->addError(new Error($th->getMessage(), $th->getCode(), $th->getTrace()));
			return;
		}
	}

	protected function getResult()
	{
		$GLOBALS['APPLICATION']->SetTitle('Импорт данных из JSON для таблицы ' . $this->arParams['TABLE_CLASS']::getTableName());

		return [];
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
