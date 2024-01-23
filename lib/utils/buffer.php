<?

namespace Welpodron\Core\Utils;

class Buffer
{
    protected static $cnt = 0;

    public static function increase(): void
    {
        self::$cnt++;
    }

    public static function decrease(): void
    {
        self::$cnt--;
        self::$cnt = self::$cnt < 0 ? 0 : self::$cnt;
    }

    public static function startBuffer()
    {
        self::increase();
        ob_start();
    }

    public static function endBuffer()
    {
        self::decrease();
        return ob_get_clean();
    }

    public static function flushBuffers()
    {
        while (self::$cnt > 0) {
            ob_end_clean();
            self::decrease();
        }
    }
}
