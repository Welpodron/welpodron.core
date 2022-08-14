<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}
?>
<div data-type="<?=$arResult['ATTRIBUTES']['type']?>" data-name="<?=$arResult['ATTRIBUTES']['name']?>" data-field="true">
  <label>
    <span><?=$arResult['LABEL']?></span>
  </label>
  <input <?foreach ($arResult['ATTRIBUTES'] as $attribute=> $value): echo (is_int($attribute) ? $value : $attribute . '=' . '"' . $value . '"'); endforeach;?>>
</div>
