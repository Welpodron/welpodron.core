<?
namespace Welpodron\Core\View;

use Bitrix\Main\Application;

abstract class Renderer
{
    final public static function include(string $path = '', array $args = [], bool $isRelative = true): string
    {
        if (!is_string($path) || strlen(trim($path)) === 0) {
            return '';
        }

        $relative = $isRelative === false ? $path : Application::getDocumentRoot() . $path;

        if (!file_exists($relative) || !is_readable($relative)) {
            return '';
        }

        if (is_array($args) && !empty($args)) {
            extract(['arResult' => $args]);
        }

        ob_start();

        include $relative;

        return ob_get_clean();
    }

    final public static function render($obj): string
    {
        $html = new \DOMDocument('1.0', 'UTF-8');

        if (is_array($obj) && !empty($obj)) {
            foreach ($obj as $element) {
                if ($element instanceof \DOMNode) {
                    $imported = $html->importNode($element, true);
                    $html->appendChild($imported);
                }
            }

            $html->normalize();
            return html_entity_decode($html->saveHTML());
        }
        
        if ($obj instanceof \DOMNode) {
            $imported = $html->importNode($obj, true);
            $html->appendChild($imported);
            $html->normalize();
            return html_entity_decode($html->saveHTML());
        }

        $html->appendChild($html->createTextNode(strval($obj)));
        $html->normalize();
        
        return html_entity_decode($html->saveHTML());
    }
}
