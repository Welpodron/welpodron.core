<?

namespace Welpodron\Core\ORM\Fields;

use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;
use Bitrix\Main\ORM\Fields\TextField;
use Bitrix\Main\ORM\Fields\ArrayField;
use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Fields\ScalarField;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\Web\Json;

class HTMLTextField extends TextField
{
}

class TextFieldMultiple extends TextField
{
    /** @var string  json, serialize, custom */
    protected $serializationType;

    /** @var callable */
    protected $encodeFunction;

    /** @var callable */
    protected $decodeFunction;

    public function __construct($name, $parameters = [])
    {
        $this->configureSerializationJson();

        $this->addSaveDataModifier([$this, 'encode']);
        $this->addFetchDataModifier([$this, 'decode']);

        parent::__construct($name, $parameters);
    }

    /**
     * Sets json serialization format
     *
     * @return $this
     */
    public function configureSerializationJson()
    {
        $this->serializationType = 'json';
        $this->encodeFunction = [$this, 'encodeJson'];
        $this->decodeFunction = [$this, 'decodeJson'];

        return $this;
    }

    /**
     * @param array $value
     *
     * @return string
     */
    public function encode($value)
    {
        $callback = $this->encodeFunction;
        return $callback($value);
    }

    /**
     * @param string $value
     *
     * @return array
     */
    public function decode($value)
    {
        if ($value <> '') {
            $callback = $this->decodeFunction;
            return $callback($value);
        }

        return [];
    }

    /**
     * @param $value
     *
     * @return mixed
     * @throws \Bitrix\Main\ArgumentException
     */
    public function encodeJson($value)
    {
        $_value = $value;

        if (is_array($_value)) {
            foreach ($_value as &$item) {
                $item = htmlspecialchars(trim($item), ENT_NOQUOTES | ENT_HTML5, 'UTF-8');
            }
            unset($item);
        } else {
            $_value = htmlspecialchars(trim($_value), ENT_NOQUOTES | ENT_HTML5, 'UTF-8');
        }

        return Json::encode($_value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * @param $value
     *
     * @return mixed
     * @throws \Bitrix\Main\ArgumentException
     */
    public function decodeJson($value)
    {
        return Json::decode(htmlspecialchars_decode($value, ENT_NOQUOTES | ENT_HTML5));
        // return Json::decode($value);
    }

    /**
     * @param mixed $value
     *
     * @return array|SqlExpression
     */
    public function cast($value)
    {
        if ($this->is_nullable && $value === null) {
            return $value;
        }

        if ($value instanceof SqlExpression) {
            return $value;
        }

        return (array) $value;
    }

    /**
     * @param mixed $value
     *
     * @return mixed|string
     * @throws \Bitrix\Main\SystemException
     */
    public function convertValueFromDb($value)
    {
        return $this->getConnection()->getSqlHelper()->convertFromDbString($value);
    }

    /**
     * @param mixed $value
     *
     * @return string
     * @throws \Bitrix\Main\SystemException
     */
    public function convertValueToDb($value)
    {
        if ($value instanceof SqlExpression) {
            return $value;
        }

        return $value === null && $this->is_nullable
            ? $value
            : $this->getConnection()->getSqlHelper()->convertToDbString($value);
    }

    /**
     * @return string
     */
    public function getGetterTypeHint()
    {
        return 'array';
    }

    /**
     * @return string
     */
    public function getSetterTypeHint()
    {
        return 'array';
    }
}

class HTMLTextFieldMultiple extends TextFieldMultiple
{
}
