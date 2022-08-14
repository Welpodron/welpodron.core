<?php
namespace Welpodron\Core\Controller;

use Bitrix\Main\Engine\ActionFilter;

abstract class Receiver extends \Bitrix\Main\Engine\Controller
{
    protected function init()
    {
        parent::init();
    }
    
    protected function prepareParams()
    {
        $this->isAdmin = $this->getCurrentUser()->isAdmin();
        return true;
    }

    protected function getDefaultPreFilters()
    {
        return [new ActionFilter\Csrf()];
    }
}
