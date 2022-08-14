<?
namespace Welpodron\Core\Templates\General;

use Welpodron\Core\View\Renderable;

class Container extends Element
{
    protected $elements = [];   

    public function __construct($args)
    {
        $config = array_change_key_case($args);

        parent::__construct($config);
        
        if (isset($config['elements']) && is_array($config['elements'])) {
            $temp = [];

            foreach ($config['elements'] as $element) {
                if ($element instanceof \Welpodron\Core\Templates\Ui\Element) {
                    $temp[] = new Element(['CONTENT' => $element->render()]);
                }

                if ($element instanceof Renderable) {
                    $temp[] = $element;
                }

                if (is_string($element)) {
                    $temp[] = new Element(['CONTENT' => $element]);
                }
            }

            $this->elements = $temp;
        }
    }

    final public function addElement(Renderable $element)
    {
        $this->elements[] = $element;
    }

    final public function setElements(array $elements)
    {
        $temp = [];

        foreach ($elements as $element) {
            if ($element instanceof Renderable) {
                $temp[] = $element;
            }
        }

        $this->elements = $temp;
    }

    final public function getElements():array
    {
        return $this->elements;
    }

    public function getResult():array
    {
        $arResult = parent::getResult();

        if (!empty($this->elements)) {
            $arResult['ELEMENTS'] = $this->elements;
        }

        return $arResult;
    }
}
