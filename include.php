<?

use Bitrix\Main\Loader;

CJSCore::RegisterExt('welpodron.core.utils', [
    'js' => '/bitrix/js/welpodron.core/v2/utils/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.templater', [
    'js' => '/bitrix/js/welpodron.core/v2/templater/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.animate', [
    'js' => '/bitrix/js/welpodron.core/v2/animate/script.js',
    'rel' => ['welpodron.core.utils'],
    'skip_core' => true
]);

// aos

CJSCore::RegisterExt('welpodron.core.aos', [
    'js' => '/bitrix/js/welpodron.core/v2/aos/script.js',
    'css' => '/bitrix/css/welpodron.core/v2/aos/style.css',
    'skip_core' => true
]);

// components v2 

CJSCore::RegisterExt('welpodron.core.modal', [
    'js' => '/bitrix/js/welpodron.core/v2/modal/script.js',
    'css' => '/bitrix/css/welpodron.core/v2/modal/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.collapse', [
    'js' => '/bitrix/js/welpodron.core/v2/collapse/script.js',
    'css' => '/bitrix/css/welpodron.core/v2/collapse/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.accordion', [
    'js' => '/bitrix/js/welpodron.core/v2/accordion/script.js',
    'css' => '/bitrix/css/welpodron.core/v2/accordion/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.carousel', [
    'js' => '/bitrix/js/welpodron.core/v2/carousel/script.js',
    'css' => '/bitrix/css/welpodron.core/v2/carousel/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

Loader::registerAutoLoadClasses(
    'welpodron.core',
    [
        'Welpodron\Core\Helper' => 'lib/helper/helper.php',
    ]
);
