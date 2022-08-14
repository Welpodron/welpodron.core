<?php
CJSCore::RegisterExt('welpodron.debug', [
    'js' => '/local/modules/welpodron.core/js/debug/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.aos', [
    'css' => '/local/modules/welpodron.core/css/aos/mciastek/sal/style.css',
    'js' => '/local/modules/welpodron.core/js/aos/mciastek/sal/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.core', [
    'js' => '/local/modules/welpodron.core/js/core/script.js',
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.mutant', [
    'js' => '/local/modules/welpodron.core/js/mutant/script.js',
    'rel' => ['welpodron.core'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.networker', [
    'js' => '/local/modules/welpodron.core/js/networker/script.js',
    'rel' => ['welpodron.core'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.templater', [
    'js' => '/local/modules/welpodron.core/js/templater/script.js',
    'rel' => ['welpodron.core'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.animation', [
    'js' => '/local/modules/welpodron.core/js/animation/script.js',
    'rel' => ['welpodron.core'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.tabs', [
    'js' => '/local/modules/welpodron.core/js/tabs/script.js',
    'css' => '/local/modules/welpodron.core/css/tabs/style.css',
    'rel' => ['welpodron.animation'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.collapse', [
    'js' => '/local/modules/welpodron.core/js/collapse/script.js',
    'css' => '/local/modules/welpodron.core/css/collapse/style.css',
    'rel' => ['welpodron.animation'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.accordion', [
    'js' => '/local/modules/welpodron.core/js/accordion/script.js',
    'rel' => ['welpodron.collapse'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.carousel', [
    'js' => '/local/modules/welpodron.core/js/carousel/script.js',
    'css' => '/local/modules/welpodron.core/css/carousel/style.css',
    'rel' => ['welpodron.animation'],
    'skip_core' => true
]);

CJSCore::RegisterExt('welpodron.modal', [
    'js' => '/local/modules/welpodron.core/js/modal/script.js',
    'css' => '/local/modules/welpodron.core/css/modal/style.css',
    'rel' => ['welpodron.animation'],
    'skip_core' => true
]);

CJSCore::Init(['welpodron.core']);
