<?

use Bitrix\Main\ModuleManager;
use Bitrix\Main\EventManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Application;
use Bitrix\Main\IO\Directory;
use Bitrix\Main\Config\Option;

class welpodron_core extends CModule
{
    public function DoInstall()
    {
        global $APPLICATION;

        if (!CheckVersion(ModuleManager::getVersion('main'), '14.00.00')) {
            $APPLICATION->ThrowException('Версия главного модуля ниже 14.00.00');
            return false;
        }

        if (!$this->InstallFiles()) {
            return false;
        }

        ModuleManager::registerModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Установка модуля ' . $this->MODULE_ID, __DIR__ . '/step.php');
    }

    public function DoUninstall()
    {
        global $APPLICATION;

        $this->UnInstallFiles();

        ModuleManager::unRegisterModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Деинсталляция модуля ' . $this->MODULE_ID, __DIR__ . '/unstep.php');
    }

    public function __construct()
    {
        $this->MODULE_ID = 'welpodron.core';
        $this->MODULE_NAME = 'Модуль welpodron.core';
        $this->MODULE_DESCRIPTION = 'Модуль welpodron.core';
        $this->PARTNER_NAME = 'welpodron';
        $this->PARTNER_URI = 'https://github.com/Welpodron';
        $this->MODULE_VERSION = '2.0.0';
    }

    public function InstallFiles()
    {
        global $APPLICATION;

        try {
            if (!CopyDirFiles(__DIR__ . '/js/', Application::getDocumentRoot() . '/bitrix/js', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать js');
                return false;
            };
            if (!CopyDirFiles(__DIR__ . '/css/', Application::getDocumentRoot() . '/bitrix/css', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать css');
                return false;
            };
        } catch (\Throwable $th) {
            $APPLICATION->ThrowException($th->getMessage() . '\n' . $th->getTraceAsString());
            return false;
        }

        return true;
    }

    public function UnInstallFiles()
    {
        Directory::deleteDirectory(Application::getDocumentRoot() . '/bitrix/js/' . $this->MODULE_ID);
        Directory::deleteDirectory(Application::getDocumentRoot() . '/bitrix/css/' . $this->MODULE_ID);
    }

    // public function InstallEvents()
    // {
    //     $eventManager = EventManager::getInstance();
    //     $eventManager->registerEventHandler('main', 'OnBuildGlobalMenu', $this->MODULE_ID, 'Welpodron\Core\Helper', 'onBuildGlobalMenu');
    // }

    // public function UnInstallEvents()
    // {
    //     $eventManager = EventManager::getInstance();
    //     $eventManager->unRegisterEventHandler('main', 'onBuildGlobalMenu', $this->MODULE_ID);
    // }
}
