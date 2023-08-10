<?

CJSCore::RegisterExt('welpodron.core.utils', [
    'js' => '/bitrix/js/welpodron.core/utils/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.templater', [
    'js' => '/bitrix/js/welpodron.core/templater/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.animate', [
    'js' => '/bitrix/js/welpodron.core/animate/script.js',
    'rel' => ['welpodron.core.utils'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core.modal', [
    'js' => '/bitrix/js/welpodron.core/_modal/script.js',
    'css' => '/bitrix/css/welpodron.core/_modal/style.css',
    'rel' => ['welpodron.core.animate'],
    'skip_core' => true
]);
