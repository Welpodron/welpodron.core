<?php
namespace Welpodron\Core\Templates\General;

use Welpodron\Core\View\Renderer;
use Welpodron\Core\View\Renderable;

class Element implements Renderable
{
    protected $attributes = [];
    protected $content = '';   

    public function __construct($args)
    {
        $config = array_change_key_case($args);

        $this->attributes = (isset($config['attributes']) && is_array($config['attributes']) && !empty($config['attributes'])) ? $config['attributes'] : [];
        $this->content = (isset($config['content']) && is_string($config['content']) &&  strlen(trim($config['content'])) > 0)  ? $config['content'] : '';
        $this->template = (isset($config['template']) && is_string($config['template']) && strlen(trim($config['template'])) > 0) ? $config['template'] : '';
    }

    final public function addAttribute($key, $value)
    {
        $this->attributes[$key] = $value;
    }

    final public function setAttributes(array $attributes)
    {
        $this->attributes = $attributes;
    }

    final public function getAttributes():array
    {
        return $this->attributes;
    }

    final public function setContent(string $value)
    {
        $this->content = $value;
    }

    final public function getContent()
    {
        return $this->content;
    }

    public function render(string $path = '', array $args = []):string
    {
        $template = $this->template ? $this->template : $path;

        if ($template) {
            return Renderer::include($template, $this->getResult());
        }

        if ($this->content) {
            return Renderer::render($this->content);
        }
    }

    public function getResult():array
    {
        $arResult = [];

        if ($this->content) {
            $arResult['CONTENT'] = $this->content;
        }

        if (!empty($this->attributes)) {
            $arResult['ATTRIBUTES'] = $this->attributes;
        }

        return $arResult;
    }
}
