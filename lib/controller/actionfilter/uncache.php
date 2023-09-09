<?php

namespace Welpodron\Core\Controller\Actionfilter;

use Bitrix\Main\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Engine\ActionFilter\Base;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Data\Cache;

class UnCache extends Base
{
    public function __construct()
    {
        parent::__construct();
    }

    public function onBeforeAction(Event $event)
    {
        if (!CurrentUser::get()->isAdmin()) {
            return null;
        }

        $referer = Context::getCurrent()->getServer()->get('HTTP_REFERER');

        if ($referer && mb_strpos($referer, 'clear_cache')) {
            Cache::setClearCache(true);
        }

        return null;
    }
}
