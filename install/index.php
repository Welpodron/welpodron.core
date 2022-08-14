<?
use Bitrix\Main\ModuleManager;
use Bitrix\Main\EventManager;

class welpodron_core extends CModule
{
    public function DoInstall()
    {
        global $APPLICATION;

        ModuleManager::registerModule($this->MODULE_ID);

        $this->InstallEvents();

        $APPLICATION->IncludeAdminFile('Установка модуля ' . $this->MODULE_ID, __DIR__ . '/step.php');
    }

    public function DoUninstall()
    {
        global $APPLICATION;

        $this->UnInstallEvents();

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

        $arModuleVersion = [];

        $path = str_replace('\\', '/', __FILE__);
        $path = substr($path, 0, strlen($path) - strlen('/index.php'));
        include $path . '/version.php';

        if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion)) {
            $this->MODULE_VERSION = $arModuleVersion['VERSION'];
            $this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
        }
    }

    public function InstallEvents()
    {
        $eventManager = EventManager::getInstance();
        $eventManager->registerEventHandler('main', 'OnBuildGlobalMenu', $this->MODULE_ID, 'Welpodron\Core\Helper', 'onBuildGlobalMenu');
    }

    public function UnInstallEvents()
    {
        $eventManager = EventManager::getInstance();
        $eventManager->unRegisterEventHandler('main', 'onBuildGlobalMenu', $this->MODULE_ID);
    }
}
