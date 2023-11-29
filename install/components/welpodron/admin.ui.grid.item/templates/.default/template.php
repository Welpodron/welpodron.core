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

$formId = 'form_' . md5(uniqid());
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
					if (window.welpodron.admin.form) {
						const form = document.querySelector('#<?= $formId ?>');
						if (form) {
							new window.welpodron.admin.form({
								element: form,
							});
						}
					}

					if (window.welpodron.admin.zone) {
						document.querySelectorAll('[data-w-zone]').forEach((element) => {
							const id = element.getAttribute('data-w-zone-id');
							if (id) {
								new window.welpodron.admin.zone({
									element,
									sessid: '<?= bitrix_sessid() ?>',
								});
							}
						});
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
				<? $i = 0; ?>
				<? foreach ($arResult['FIELDS'] as $arField) : ?>
					<? if ($arField['FIELD_PRIMARY']) : ?>
						<input type="hidden" name="<?= $arField['FIELD_ID'] ?>" value="<?= $arField['FIELD_VALUE'] ?>">
					<? elseif ($arField['ELEMENT'] === "textarea") : ?>
						<?
						$APPLICATION->IncludeComponent(
							'welpodron:admin.ui.field.textarea',
							'',
							$arField
						);
						?>
					<? elseif ($arField['ELEMENT'] === 'editor') : ?>
						<?
						$APPLICATION->IncludeComponent(
							'welpodron:admin.ui.field.editor',
							'',
							$arField
						);
						?>
					<? else : ?>
						<?
						$APPLICATION->IncludeComponent(
							'welpodron:admin.ui.field.textbox',
							'',
							$arField
						);
						?>
					<? endif; ?>
				<? endforeach ?>
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