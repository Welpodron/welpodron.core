<?php

namespace Welpodron\Core;

class Helper
{
    final public static function onBuildGlobalMenu(&$aGlobalMenu, &$aModuleMenu)
    {
        $aGlobalMenu['global_menu_welpodron'] = [
            'menu_id' => 'welpodron',
            'text' => 'Welpodron',
            'title' => 'Настройки параметров составных модулей',
            'sort' => PHP_INT_MAX,
            'items_id' => 'global_menu_welpodron_items',
            'icon'      => '',
            'page_icon' => '',
        ];
    }
}