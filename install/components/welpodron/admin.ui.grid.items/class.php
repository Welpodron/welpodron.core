<?

use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\UI\PageNavigation;
use Bitrix\Main\Grid\Options as GridOptions;
use Bitrix\Main\UI\Filter\Options as FilterOptions;
use Bitrix\Main\ORM\Fields\ArrayField;
use Bitrix\Main\ORM\Fields\StringField;
use Welpodron\SeoCities\Types\HTMLTextFieldMultiple;
use Welpodron\SeoCities\Types\TextFieldMultiple;

// use Welpodron\SeoCities\CityTable as GridTable;

if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) {
	die();
}

class WelpodronAdminUiGridItemsComponent extends CBitrixComponent implements \Bitrix\Main\Engine\Contract\Controllerable, Bitrix\Main\Errorable
{

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

		$arParams['PATH_TO_ADD'] = $arParams['PATH_TO_ADD'] ?? '';
		$arParams['PATH_TO_EDIT'] = $arParams['PATH_TO_EDIT'] ?? '';
		$arParams['PATH_TO_EXPORT'] = $arParams['PATH_TO_EXPORT'] ?? '';

		$arParams['GRID_ID'] = $arParams['TABLE_CLASS']::getTableName();
		$arParams['FILTER_ID'] = $arParams['GRID_ID'] . '_filter';
		$arParams['NAV_ID'] = $arParams['GRID_ID'] . '_nav';

		$arParams['CAN_EDIT'] = $arParams['CAN_EDIT'] ?? false;

		$arParams['ADMIN_MODE'] = $arParams['ADMIN_MODE'] ?? false;

		return $arParams;
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

	protected function processAction()
	{
		if ($this->request->get('grid_id') != $this->arParams['GRID_ID']) {
			return true;
		}

		if ($this->arParams['CAN_EDIT']) {
			$groupAction = $this->request->get('action_button_' . $this->arParams['GRID_ID']);

			if ($groupAction) {
				switch ($groupAction) {
					case 'delete':
						$itemsIds = $this->request->get('ID');

						if (!$itemsIds) {
							return;
						}

						foreach ($itemsIds as $itemId) {
							$deleteResult = $this->arParams['TABLE_CLASS']::delete($itemId);
							if (!$deleteResult->isSuccess()) {
								$this->addError(new Error('Не удалось удалить элемент с ID ' . $itemId));
								return;
							}
						}

						break;
				}
			}

			$action = $this->request->get('action');

			if ($action) {
				switch ($action) {
					case 'deleteRow':
						$itemId = $this->request->get('id');
						if (!$itemId) {
							return;
						}

						$deleteResult = $this->arParams['TABLE_CLASS']::delete($itemId);
						if (!$deleteResult->isSuccess()) {
							$this->addError(new Error('Не удалось удалить элемент с ID ' . $itemId));
							return;
						}

						break;
				}
			}
		}

		return true;
	}

	protected function getResult()
	{
		if ($this->request->isPost() && check_bitrix_sessid()) {
			if (!$this->processAction()) {
				return;
			}
		}

		$arFilter = $this->getFilter();
		$arColumns = $this->getGridColumns();
		$arOrder = $this->getGridOrder();

		$nav = $this->getNav();

		$items = $this->arParams['TABLE_CLASS']::getList([
			'select' => ['*'],
			'filter' => $arFilter['CURRENT'],
			'offset' => $nav->getOffset(),
			'limit' => $nav->getLimit(),
			'count_total' => true,
			'cache' => ['ttl' => 3600],
			'order' => $arOrder
		]);

		$nav->setRecordCount($items->getCount());

		$arItems = [];

		$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
		$tableFields = $tableEntity->getFields();
		$tablePK = $tableEntity->getPrimary();

		foreach ($items as $item) {
			$pathToEdit = str_replace('#id#', $item[$tablePK], $this->arParams['PATH_TO_EDIT']);
			$pathToExport = str_replace('#id#', $item[$tablePK], $this->arParams['PATH_TO_EXPORT']);

			$actions = [];

			$actions[] = [
				'text' => 'Изменить',
				'onclick' => 'BX.SidePanel.Instance.open("' . \CUtil::JSEscape($pathToEdit) . '", {cacheable: false})',
				'default' => true
			];
			$actions[] = [
				'text' => 'Экспортировать',
				'onclick' => 'BX.SidePanel.Instance.open("' . \CUtil::JSEscape($pathToExport) . '", {cacheable: false})',
			];
			$actions[] = [
				'text' => 'Удалить',
				'onclick' => 'BX.Main.gridManager.getInstanceById("' . \CUtil::JSEscape($this->arParams['GRID_ID']) . '")?.removeRow(' . \CUtil::JSEscape($item[$tablePK]) . ')',
			];

			//! Сначало надо вытянуть все колонки таблицы и в зависимости от типа данных будет разное отображение в таблице
			//! Наприммер дефолтное поведение ячейки строки в параметре `columns` ниже выглядит НАЗВАНИЕ_СТОЛБЦА_ИЗ_ТАБЛИЦЫ_БД => ЕГО_ЗНАЧЕНИЕ   
			//! ТОЛЬКО ЕСЛИ В БД НАЗВАНИЕ СТОЛБЦА TAGS ИЛИ LABELS!!!!: Чтобы переопределить к TAGS или LABELS нужно привести к виду  НАЗВАНИЕ_СТОЛБЦА_ИЗ_ТАБЛИЦЫ_БД => [ТУТ ПАРАМЕТРЫ ИЗ TAGS ИЛИ LABELS]

			$rowColumns = [];
			$rowCounters = [];

			$rowItem = [
				'id' => $item[$tablePK],
				'actions' => $actions,
			];

			foreach ($tableFields as $field) {
				if ($field instanceof TextFieldMultiple) {

					$cellValue = '';
					$counter = 0;

					foreach ($item[$field->getName()] as $rowCellValue) {
						if (!trim($rowCellValue)) {
							continue;
						}

						$_rowCellValue = 'Предпросмотр недоступен';

						$counter++;

						$cellValue .= '<div style="margin-bottom: 5px;" class="ui-label"><span class="ui-label-inner">' . $_rowCellValue . '</span></div>';
					}

					if ($counter > 0) {
						$rowCounters[$field->getName()] = [
							'type' => \Bitrix\Main\Grid\Counter\Type::LEFT,
							'value' => $counter,
						];
					}
				} else {
					$cellValue = $item[$field->getName()];
				}

				$rowColumns[$field->getName()] = $cellValue;
			}

			$rowItem['columns'] = $rowColumns;

			if (!empty($rowCounters)) {
				$rowItem['counters'] = $rowCounters;
			}

			$arItems[] = $rowItem;
		}

		$arGroupActions = $this->getGroupActions();

		/**@var CMain*/
		$GLOBALS['APPLICATION']->SetTitle('Просмотр таблицы ' . $this->arParams['GRID_ID']);

		return [
			'FILTER' => $arFilter,
			'NAV' => [
				'OBJECT' => $nav,
			],
			'GRID' => [
				'ROWS' => $arItems,
				'TOTAL_ROWS_COUNT' => $items->getCount(),
				'COLUMNS' => $arColumns,
				'GROUP_ACTIONS' => $arGroupActions,
			]
		];
	}

	protected function getGridColumns()
	{
		$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
		$tableFields = $tableEntity->getFields();

		$gridColumns = [];

		foreach ($tableFields as $field) {
			$gridColumns[] = [
				'id' => $field->getName(),
				'name' => $field->getTitle(),
				'sort' => $field->getName(),
				'default' => true
			];
		}

		return $gridColumns;
	}

	protected function getNav()
	{
		$gridOptions = new GridOptions($this->arParams['GRID_ID']);
		$gridNavParams = $gridOptions->GetNavParams();

		$nav = new PageNavigation($this->arParams['NAV_ID']);
		$nav->allowAllRecords(true);
		$nav->setPageSize($gridNavParams['nPageSize']);
		$nav->initFromUri();

		return $nav;
	}

	protected function getFilter()
	{
		$tableEntity = $this->arParams['TABLE_CLASS']::getEntity();
		$tableFields = $tableEntity->getFields();
		$tablePK = $tableEntity->getPrimary();

		$filterColumns = [];

		foreach ($tableFields as $field) {
			// TODO: Добавить поддержку фильтрации по массивам 
			if ($field instanceof TextFieldMultiple) {
				continue;
			}

			$filterColumns[] = [
				'id' => $field->getName(),
				'name' => $field->getTitle(),
				'default' => true
			];
		}

		$filterOptions = new FilterOptions($this->arParams['FILTER_ID']);

		$filterRequest = $filterOptions->getFilter($filterColumns);

		$filterCurrent = [];

		/** @var ScalarField $field */
		foreach ($tableFields as $field) {
			// TODO: Добавить поддержку фильтрации по массивам 
			if ($field->isPrimary()) {
				continue;
			}

			//! $fieldName - это название столбца в таблице в бд 
			$fieldName = $field->getName();

			if ($field instanceof StringField) {
				if (isset($filterRequest[$fieldName]) && $filterRequest[$fieldName]) {
					$filterCurrent[$fieldName] = '%' . $filterRequest[$fieldName] . '%';
				}
			}
		}

		if (isset($filterRequest[$tablePK]) && $filterRequest[$tablePK]) {
			$filterCurrent['=' . $tablePK] = $filterRequest[$tablePK];
		}

		return [
			'COLUMNS' => $filterColumns,
			'CURRENT' => $filterCurrent
		];
	}

	private function getGridOrder()
	{
		$defaultSort = ['ID' => 'DESC'];

		$gridOptions = new Bitrix\Main\Grid\Options($this->arParams['GRID_ID']);
		$sorting = $gridOptions->getSorting(['sort' => $defaultSort]);

		$by = key($sorting['sort']);
		$order = strtoupper(current($sorting['sort'])) === 'ASC' ? 'ASC' : 'DESC';

		$list = [];
		foreach ($this->getGridColumns() as $column) {
			if (!empty($column['sort'])) {
				$list[] = $column['sort'];
			}
		}

		if (!in_array($by, $list)) {
			return $defaultSort;
		}

		return [$by => $order];
	}

	private function getGroupActions()
	{
		$snippet = new \Bitrix\Main\Grid\Panel\Snippet();

		return [
			$snippet->getRemoveButton(),
			$snippet->getForAllCheckbox(),
		];
	}
}
