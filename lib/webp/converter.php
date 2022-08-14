<?
namespace Welpodron\Core\Webp;

use Bitrix\Main\Application;
use Bitrix\Main\IO\File;

// TODO: Try catch this whole thing 
abstract class Converter
{
    const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

    public static function getBackground($path, int $quality = 85): string
    {
        if ( strpos( $_SERVER['HTTP_ACCEPT'], 'image/webp' ) !== false || strpos( $_SERVER['HTTP_USER_AGENT'], ' Chrome/' ) !== false ) {
            $srcset = static::getWebp($path, $quality);

            if (!$srcset) {
                return '';
            }

            return $srcset;
        }

        return '';
    }

    public static function getWebp($path, int $quality = 85)
    {
        try {
            if (!is_string($path)) {
                return '';
            }
    
            $subdirectory = str_replace(Application::getDocumentRoot(), '', $path);
            $absolute = Application::getDocumentRoot() . $subdirectory;
    
            $file = new File($absolute);
    
            if (!$file->isExists()) {
                return null;
            }
    
            $contentType = $file->getContentType();
    
            if (!in_array($contentType, self::SUPPORTED_TYPES)) {
                return null;
            }
    
            if ($contentType === 'image/png') {
                $webpPath = str_replace('.png', '.webp', $absolute);
            } else {
                $webpPath = str_replace('.jpg', '.webp', $absolute);
                $webpPath = str_replace('.jpeg', '.webp', $webpPath);
            }
    
            $webpFile = new File($webpPath);
    
            if (!$webpFile->isExists()) {
                if ($contentType === 'image/png') {
                    $im = imagecreatefrompng($absolute);
                    imagepalettetotruecolor($im);
                    imagealphablending($im, true);
                    imagesavealpha($im, true);
                } else {
                    $im = imagecreatefromjpeg($absolute);
                }
    
                if ($im) {
                    imagewebp($im, $webpPath, $quality);
                    imagedestroy($im);
                }
            }
    
            $webpFile = new File($webpPath);
    
            if (!$webpFile->isExists()) {
                return null;
            }
    
            if ($contentType === 'image/png') {
                $webpLink = str_replace('.png', '.webp', $path);
            } else {
                $webpLink = str_replace('.jpg', '.webp', $path);
                $webpLink = str_replace('.jpeg', '.webp', $webpLink);
            }
    
            return $webpLink;
        } catch (\Throwable $th) {
            return '';
        }
    }

    public static function getSource($path, int $quality = 85, bool $lazy = true): string
    {
        $srcset = static::getWebp($path, $quality);

        if (!$srcset) {
            return '';
        }

        $sourceElement = '<source srcset="data:image/gif;base64,R0lGODlhAQABAID/AP///wAAACwAAAAAAQABAAACAkQBADs=" data-srcset="'.$srcset.'" type="image/webp">';
        
        if (!$lazy) {
            $sourceElement = '<source srcset="'.$srcset.'" type="image/webp">';
        }

        return $sourceElement;
    }
}