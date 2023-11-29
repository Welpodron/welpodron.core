<?
if (!defined('B_PROLOG_INCLUDED') || constant('B_PROLOG_INCLUDED') !== true) die();

use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var CMain $APPLICATION */
/** @var array $arParams */
/** @var array $arResult */

if ($arResult && $arParams) {
	Extension::load(['sidepanel']);

	if ($arParams['ADMIN_MODE']) {
		$APPLICATION->IncludeComponent('bitrix:ui.toolbar', 'admin', []);
	}

	Toolbar::addFilter([
		'GRID_ID' => $arParams['GRID_ID'],
		'FILTER_ID' => $arParams['FILTER_ID'],
		'FILTER' => $arResult['FILTER']['COLUMNS'],
		'DISABLE_SEARCH' => true,
		'ENABLE_LABEL' => true,
	]);

	$dataButton = new Buttons\Button([
		'color' => Buttons\Color::LIGHT_BORDER,
		'icon' => Buttons\Icon::SETTINGS,
		'menu' => [
			'items' => [
				[
					"text" => "Экспорт: JSON",
					"title" => "Экспорт данных в JSON",
					"onclick" => new Buttons\JsCode(
						'BX.SidePanel.Instance.open(\'' . str_replace('#id#', 0, $arParams['PATH_TO_EXPORT']) . '\', {cacheable: false})'
					),
				],
				[
					"text" => "Импорт: JSON",
					"title" => "Импорт данных из JSON",
					"onclick" => new Buttons\JsCode(
						'BX.SidePanel.Instance.open(\'' . $arParams['PATH_TO_IMPORT'] . '\', {cacheable: false})'
					),
				]
			]
		]
	]);

	Toolbar::addButton($dataButton);

	$addButton = new Buttons\Button([
		'color' => Buttons\Color::PRIMARY,
		'icon' => Buttons\Icon::ADD,
		'click' => new Buttons\JsCode(
			'BX.SidePanel.Instance.open(\'' . str_replace('#id#', 0, $arParams['PATH_TO_EDIT']) . '\', {cacheable: false})'
		),
		'text' => 'Добавить',
	]);
	Toolbar::addButton($addButton);

	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		[
			'GRID_ID' => $arParams['GRID_ID'],
			'COLUMNS' => $arResult['GRID']['COLUMNS'],
			'ROWS' => $arResult['GRID']['ROWS'],
			'NAV_OBJECT' => $arResult['NAV']['OBJECT'],
			'TOTAL_ROWS_COUNT' => $arResult['GRID']['TOTAL_ROWS_COUNT'],
			'SHOW_PAGESIZE' => true,
			'PAGE_SIZES' => [
				['NAME' => '1', 'VALUE' => '1'],
				['NAME' => '5', 'VALUE' => '5'],
				['NAME' => '10', 'VALUE' => '10'],
				['NAME' => '20', 'VALUE' => '20'],
				['NAME' => '50', 'VALUE' => '50'],
				['NAME' => '100', 'VALUE' => '100']
			],
			'AJAX_MODE' => 'Y',
			'AJAX_OPTION_JUMP' => 'N',
			'AJAX_OPTION_STYLE' => 'N',
			'AJAX_OPTION_HISTORY' => 'N',
			'ACTION_PANEL' => [
				'GROUPS' => [
					[
						'ITEMS' => $arResult['GRID']['GROUP_ACTIONS']
					],
				],
			],
			'SHOW_ACTION_PANEL' => true,
		]
	);
}
