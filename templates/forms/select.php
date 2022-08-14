<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}
?>
<div data-type="select" data-name="<?=$arResult['ATTRIBUTES']['name']?>" data-field="true">
  <label>
    <span><?=$arResult['LABEL']?></span>
  </label>
  <select <?foreach ($arResult['ATTRIBUTES'] as $attribute=> $value): echo (is_int($attribute) ? $value : $attribute . '=' . '"' . $value . '"'); endforeach;?>>
    <?foreach ($arResult['OPTIONS'] as $option):?>
    <?=$option->render()?>
    <?endforeach;?>
  </select>
  <?=$arResult['CONTENT']?>
</div>
