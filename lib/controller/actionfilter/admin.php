<?php
namespace Welpodron\Core\Controller\Actionfilter;

use Bitrix\Main\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Engine\ActionFilter\Base;
use Bitrix\Main\Engine\CurrentUser;

final class Admin extends Base
{
    const ERROR_INVALID_AUTHENTICATION = 'invalid_rights';

    public function __construct()
    {
        parent::__construct();
    }

    public function onBeforeAction(Event $event)
    {
        if (!CurrentUser::get()->isAdmin()) {
            Context::getCurrent()->getResponse()->setStatus(401);
            $this->addError(new Error('Invalid rights', self::ERROR_INVALID_AUTHENTICATION)
            );

            return new EventResult(EventResult::ERROR, null, null, $this);
        }

        return null;
    }
}