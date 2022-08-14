<?
namespace Welpodron\Core\Templates\Ui;

use Welpodron\Core\View\Renderer;

class Element
{
    private $html;
    private $element;

    public function __construct(string $tag, array $attributes = [], $content = null)
    {
        $this->html = new \DOMDocument('1.0', 'UTF-8');
        $this->element = $this->html->createElement($tag);

        $this->setAttributes($attributes);
        $this->setContent($content);
    }

    final public function setAttributes(array $attributes)
    {
        foreach ($attributes as $key => $value) {
            $this->addAttribute($key, $value);
        }
    }

    public function addAttribute($key = '', $value = '')
    {
        if (is_int($key)) {
            $this->element->setAttribute($value, '');
        } else {
            $this->element->setAttribute($key, $value);
        }
    }

    public function setContent($content)
    {
        $this->removeContent($this->element);

        $this->addContent($content);
    }

    public function addContent($content)
    {
        if (is_array($content) && !empty($content)) {
            foreach ($content as $child) {
                $this->addChild($child);
            }
        } else {
            if (!is_array($content)) {
                // TODO: Rework! Empty array fix
                $this->addChild($content);
            }
        }
    }

    protected function addChild($child)
    {
        switch (true) {
            case $child instanceof \DOMNode:
                $imported = $this->html->importNode($child, true);
                return $this->element->appendChild($imported);
            case $child instanceof \Welpodron\Core\Templates\General\Element:
                return $this->element->appendChild($this->html->createTextNode(strval($child->render())));
            case $child instanceof Element:
                $imported = $this->html->importNode($child->build(), true);
                return $this->element->appendChild($imported);
            default:
                return $this->element->appendChild($this->html->createTextNode(strval($child)));
        }
    }

    final private function removeContent(\DOMNode $node)
    {
        while (isset($node->firstChild)) {
            $this->removeContent($node->firstChild);
            $node->removeChild($node->firstChild);
        }
    }

    final public function build()
    {
        return $this->element->cloneNode(true);
    }

    final public function render()
    {
        return Renderer::render($this->element->cloneNode(true));
    }
}

class Input extends Element
{
    public function __construct(string $type, string $name, array $attributes = [])
    {
        parent::__construct('input', [], null);

        $this->element->setAttribute('type', $type);
        $this->element->setAttribute('name', $name);
        $this->setAttributes($attributes);
    }

    public function addAttribute($key = '', $value = '')
    {
        if (strtolower(trim(strval($key))) === 'type' || strtolower(trim(strval($key))) === 'name') {
            return;
        }

        if (strtolower(trim(strval($value))) === 'type' || strtolower(trim(strval($value))) === 'name') {
            return;
        }

        parent::addAttribute($key, $value);
    }

    public function setContent($content)
    {
        return;
    }

    public function addContent($content)
    {
        return;
    }
}
