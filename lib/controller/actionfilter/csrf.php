<?php

namespace Welpodron\Core\Controller\Actionfilter;

use Bitrix\Main\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Engine\ActionFilter\Base;

final class Csrf extends Base
{
    const ERROR_INVALID_CSRF = 'invalid_csrf';


    public function __construct()
    {
        parent::__construct();
    }

    public function onBeforeAction(Event $event)
    {
        $request = Context::getCurrent()->getRequest();

        if ($request->get('sessid') !== bitrix_sessid() || $request->getHeader('X-Bitrix-Csrf-Token') === bitrix_sessid()) {
            Context::getCurrent()->getResponse()->setStatus(401);
            $this->addError(
                new Error('Invalid csrf', self::ERROR_INVALID_CSRF)
            );

            return new EventResult(EventResult::ERROR, null, null, $this);
        }

        return null;
    }
}
