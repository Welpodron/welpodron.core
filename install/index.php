<?

use Bitrix\Main\ModuleManager;
use Bitrix\Main\Application;
use Bitrix\Main\IO\Directory;

use Bitrix\Main\EventManager;

class welpodron_core extends CModule
{
    var $MODULE_ID = 'welpodron.core';

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

        if (!$this->InstallEvents()) {
            return false;
        }

        ModuleManager::registerModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Установка модуля ' . $this->MODULE_ID, __DIR__ . '/step.php');
    }

    public function DoUninstall()
    {
        global $APPLICATION;

        $this->UnInstallFiles();
        $this->UnInstallEvents();

        ModuleManager::unRegisterModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Деинсталляция модуля ' . $this->MODULE_ID, __DIR__ . '/unstep.php');
    }

    public function __construct()
    {
        $this->MODULE_ID = 'welpodron.core';
        $this->MODULE_NAME = 'Модуль welpodron.core';
        $this->MODULE_DESCRIPTION = 'Модуль welpodron.core';
        $this->PARTNER_NAME = 'Welpodron';
        $this->PARTNER_URI = 'https://github.com/Welpodron';

        $arModuleVersion = [];
        include(__DIR__ . "/version.php");

        $this->MODULE_VERSION = $arModuleVersion["VERSION"];
        $this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
    }

    public function InstallFiles()
    {
        global $APPLICATION;

        try {
            if (!CopyDirFiles(__DIR__ . '/packages/', Application::getDocumentRoot() . '/local/packages', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать используемый модулем пакет');
                return false;
            };
            // Тут конечно не оч что компоненты не удаляются ну велл, можно руками удалить
            if (!CopyDirFiles(__DIR__ . '/components/', Application::getDocumentRoot() . '/local/components', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать компоненты модуля');
                return false;
            };
            if (!CopyDirFiles(__DIR__ . '/panel/', Application::getDocumentRoot() . '/bitrix/panel', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать используемый модулем CSS');
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
        Directory::deleteDirectory(Application::getDocumentRoot() . '/bitrix/panel/welpodron');

        // Можно было бы проверять пустая ли папка и если да то сносить ее, но лучше оставить так
        Directory::deleteDirectory(Application::getDocumentRoot() . '/local/packages/' . $this->MODULE_ID);

        $arComponents = scandir(__DIR__ . '/components/welpodron');

        if ($arComponents) {
            $arComponents = array_diff($arComponents, ['..', '.']);

            foreach ($arComponents as $component) {
                Directory::deleteDirectory(Application::getDocumentRoot() . '/local/components/welpodron/' . $component);
            }
        }
    }

    public function InstallEvents()
    {
        $eventManager = EventManager::getInstance();
        $eventManager->registerEventHandler('main', 'OnBuildGlobalMenu', $this->MODULE_ID, 'Welpodron\Core\Helper', 'onBuildGlobalMenu');
        return true;
    }

    public function UnInstallEvents()
    {
        $eventManager = EventManager::getInstance();
        $eventManager->unRegisterEventHandler('main', 'onBuildGlobalMenu', $this->MODULE_ID);
    }
}
