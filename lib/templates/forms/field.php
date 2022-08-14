<?
namespace Welpodron\Core\Templates\Forms;

use Welpodron\Core\Templates\General\Container;

class Field extends Container
{
    protected $label = '';

    public function __construct($args)
    {
        $config = array_change_key_case($args);

        parent::__construct($config);

        $this->label = isset($config['label']) ? strval($config['label']) : '';
    }

    final public function setLabel(string $value)
    {
        $this->label = $value;
    }

    final public function getLabel():string
    {
        return $this->label;
    }

    public function getResult():array
    {
        $arResult = parent::getResult();

        if ($this->label) {
            $arResult['LABEL'] = $this->label;
        }

        return $arResult;
    }
}
