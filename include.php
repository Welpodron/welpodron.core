<?

use Bitrix\Main\Loader;

//! IF NEED TO COMPILE ALL JS AND CSS TO ONE FILE 

CJSCore::RegisterExt('welpodron.core.utils', [
    'js' => '/local/packages/welpodron.core/iife/utils/index.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.templater', [
    'js' => '/local/packages/welpodron.core/iife/templater/index.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.animate', [
    'js' => '/local/packages/welpodron.core/iife/animate/index.js',
    'rel' => ['welpodron.core.utils'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.aos', [
    'js' => '/local/packages/welpodron.core/iife/aos/index.js',
    'css' => '/local/packages/welpodron.core/css/aos/style.css',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.modal', [
    'js' => '/local/packages/welpodron.core/iife/modal/index.js',
    'css' => '/local/packages/welpodron.core/css/modal/style.css',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.accordion', [
    'js' => '/local/packages/welpodron.core/iife/accordion/index.js',
    'css' => '/local/packages/welpodron.core/css/accordion/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.tabs', [
    'js' => '/local/packages/welpodron.core/iife/tabs/index.js',
    'css' => '/local/packages/welpodron.core/css/tabs/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.carousel', [
    'js' => '/local/packages/welpodron.core/iife/carousel/index.js',
    'css' => '/local/packages/welpodron.core/css/carousel/style.css',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.collapse', [
    'js' => '/local/packages/welpodron.core/iife/collapse/index.js',
    'css' => '/local/packages/welpodron.core/css/collapse/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);

//! FORMS API WILL BE CHANGED IN FUTURE
CJSCore::RegisterExt('welpodron.form.inputs.tel', [
    'js' => '/local/packages/welpodron.core/iife/_form/_tel/index.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.form.inputs.number', [
    'js' => '/local/packages/welpodron.core/iife/_form/_number/index.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.form.inputs.calendar', [
    'js' => '/local/packages/welpodron.core/iife/_form/_calendar/index.js',
    'skip_core' => true
]);

Loader::registerAutoLoadClasses(
    'welpodron.core',
    [
        'Welpodron\Core\Helper' => 'lib/helper/helper.php',
    ]
);
