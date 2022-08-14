<?php
namespace Welpodron\Core\Controller;

use Bitrix\Main\Engine\ActionFilter;

abstract class Poster extends Receiver
{
    protected function getDefaultPreFilters()
    {
        $filters = parent::getDefaultPreFilters();
        $filters[] = new ActionFilter\HttpMethod([ActionFilter\HttpMethod::METHOD_POST]);
        return $filters;
    }

    protected function prepareParams()
    {
        parent::prepareParams();
        $this->postList = $this->getRequest()->getPostList()->toArray();
        return true;
    }
}

