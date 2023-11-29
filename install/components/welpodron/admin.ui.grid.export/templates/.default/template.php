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

$this->addExternalJS($templateFolder . '/json/script.js');

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

<form>
	<input type="hidden" name="signedParameters" value="<?= $this->getComponent()->getSignedParameters() ?>">
	<?= bitrix_sessid_post() ?>
	<div class="ui-slider-section">
		<div class="ui-slider-content-box">
			<div class="ui-form">
				<div class="ui-form-row">
					<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;" class="ui-form-label">
						<div class="ui-ctl-label-text">
							Содержимое экспортируемого JSON:
						</div>
						<div style="display: flex; align-items: center; gap: 10px;">
							<button data-w-json-download data-w-json-id="<?= $jsonId ?>" type="button" class="ui-btn ui-btn-icon-download">Скачать</button>
							<div><button data-w-json-copy data-w-json-id="<?= $jsonId ?>" type="button" class="ui-btn ui-btn-link ui-btn-icon-copy">Скопировать</button></div>
						</div>
					</div>
					<div class="ui-form-content">
						<div style="display: flex;">
							<div style="flex-grow: 1;">
								<div style="height: auto; position: relative;" class="ui-ctl ui-ctl-textarea ui-ctl-w100">
									<textarea data-w-json data-w-json-id="<?= $jsonId ?>" style="resize: vertical; height: auto; min-height: 450px; max-height: 600px;" placeholder="Содержимое экспортируемого JSON файла" class="ui-ctl-element"><?= $arResult['DATA'] ?></textarea>
								</div>
							</div>
						</div>
					</div>
				</div>
				<? if (!$arParams['CAN_EDIT']) : ?>
					<div class="main-user-consent-edit-alert">
						Недоступно для просмотра
					</div>
				<? endif; ?>
			</div>
		</div>
	</div>

	<div>
		<?php
		$buttons = [];
		$buttons[] = [
			'TYPE' => 'cancel',
			'LINK' => $arParams['PATH_TO_LIST'],
			'CAPTION' => 'Закрыть'
		];
		$APPLICATION->includeComponent('bitrix:ui.button.panel', '', [
			'BUTTONS' => $buttons
		]);
		?>
	</div>
</form>