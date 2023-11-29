<?
if (!defined("B_PROLOG_INCLUDED") || constant('B_PROLOG_INCLUDED') !== true) die();

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;
use Bitrix\Main\Engine\UrlManager;

use Bitrix\Main\Loader;

/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */

// CUtil::InitJSCore(["popup"]);
// Extension::load(['ui.sidepanel.layout', 'ui.sidepanel-content', 'ui.forms', 'ui.layout-form', 'ui.design-tokens']);
Extension::load(['ui.forms', 'ui.layout-form', 'ui.alerts']);

$this->addExternalJS($templateFolder . DIRECTORY_SEPARATOR . 'form' . DIRECTORY_SEPARATOR . 'script.js');
$this->addExternalJS($templateFolder . '/json/script.js');

$formId = 'form_' . md5(uniqid());
$jsonId = 'json_' . md5(uniqid());
?>

<div class="main-user-consent-errors">
	<?php foreach ($arResult['ERRORS'] as $error) : ?>
		<? ShowError($error); ?>
	<?php endforeach; ?>
</div>

<script>
	(() => {
		const init = () => {
			if (window.welpodron) {
				if (window.welpodron.admin) {
					if (window.welpodron.admin.json) {
						const json = document.querySelector('[data-w-json][data-w-json-id="<?= $jsonId ?>"]');
						if (json) {
							new window.welpodron.admin.json({
								element: json,
							});
						}
					}

					if (window.welpodron.admin.form) {
						const form = document.querySelector('#<?= $formId ?>');
						if (form) {
							new window.welpodron.admin.form({
								element: form,
							});
						}
					}
				}
			};
		};

		if (document.readyState === "loading") {
			document.addEventListener('DOMContentLoaded', init, {
				once: true
			});
		} else {
			init();
		}
	})();
</script>

<form id="<?= $formId ?>" method="POST" action="<?= UrlManager::getInstance()->createByBitrixComponent($this->getComponent(), 'save') ?>">
	<input type="hidden" name="signedParameters" value="<?= $this->getComponent()->getSignedParameters() ?>">
	<?= bitrix_sessid_post() ?>
	<div class="ui-slider-section">
		<div class="ui-slider-content-box">
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							Действие с записями которые уже присутствуют в таблице и отсутствуют в импортированном JSON <span style="color:red; font-weight: bold;">*</span>:
						</div>
					</div>
					<div class="ui-form-content">
						<div style="display: flex;">
							<div style="flex-grow: 1;">
								<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
									<div class="ui-ctl-after ui-ctl-icon-angle"></div>
									<select name="FOUND_ELEMENTS_ACTION" class="ui-ctl-element">
										<option selected value="SKIP">Ничего не делать</option>
										<option value="DELETE">Удалить</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="ui-alert ui-alert-icon-danger ui-alert-warning">
					<span class="ui-alert-message"><strong>Внимание!</strong> Если запись присутствует и в JSON и в таблице - значения записи в таблице будут перезаписаны значениями из JSON</span>
				</div>
				<div class="ui-form-row">
					<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;" class="ui-form-label">
						<div class="ui-ctl-label-text">
							Содержимое импортируемого JSON <span style="color:red; font-weight: bold;">*</span>:
						</div>
						<div style="display: flex; align-items: center; gap: 10px;">
							<input data-w-json-upload data-w-json-id="<?= $jsonId ?>" style="display: none;" type="file" accept="application/JSON">
							<button onclick='document.querySelector(`[data-w-json-upload][data-w-json-id="<?= $jsonId ?>"]`)?.click()' type="button" class="ui-btn ui-btn-icon-download">Из файла</button>
							<div><button data-w-json-fetch data-w-json-id="<?= $jsonId ?>" type="button" class="ui-btn ui-btn-link ui-btn-icon-share">По ссылке</button></div>
							<div><button data-w-json-iblock data-w-json-id="<?= $jsonId ?>" type="button" class="ui-btn ui-btn-link ui-btn-icon-download">Из Webfly инфоблока</button></div>
						</div>
					</div>
					<div class="ui-form-content">
						<div style="display: flex;">
							<div style="flex-grow: 1;">
								<div data-w-json-dropzone data-w-json-id="<?= $jsonId ?>" style="height: auto; position: relative;" class="ui-ctl ui-ctl-textarea ui-ctl-w100">
									<textarea name="IMPORTED_JSON" required data-w-json data-w-json-id="<?= $jsonId ?>" style="resize: vertical; height: auto; min-height: 450px; max-height: 600px;" placeholder="Введите содержимое импортируемого JSON файла или перетащите JSON файл в данную область или нажмите на кнопку Загрузить из файла для автоматической вставки текста из файла или загрузите файл по ссылке используя специальную кнопку или же выбрав контекстное действие копировать в файловой системе у файла и используя контекстное действие в браузере вставить, вставьте содержимое скопированного JSON файла" class="ui-ctl-element"></textarea>
									<div data-w-json-dropzone-placeholder style="width: 100%; visibility: hidden; pointer-events: none; text-align: center; height: 100%; background: rgba(255, 255, 255, 0.8); position: absolute; left: 0; top: 0;display: flex; justify-content: center;align-items: center;">
										<svg style="margin-right: 5px;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
											<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
											<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
											<path d="M7 9l5 -5l5 5"></path>
											<path d="M12 4l0 12"></path>
										</svg>
										<p>Отпустите для загрузки файла</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<? if (!$arParams['CAN_EDIT']) : ?>
					<div class="main-user-consent-edit-alert">
						Недоступно для редактирования
					</div>
				<? endif; ?>
			</div>
		</div>
	</div>

	<div>
		<?php
		$buttons = [];
		if ($arParams['CAN_EDIT']) {
			$buttons[] = [
				'TYPE' => 'save',
			];
		}
		$buttons[] = [
			'TYPE' => 'cancel',
			'LINK' => $arParams['PATH_TO_LIST'],
			'CAPTION' => 'Отмена'
		];
		$APPLICATION->includeComponent('bitrix:ui.button.panel', '', [
			'BUTTONS' => $buttons
		]);
		?>
	</div>
</form>