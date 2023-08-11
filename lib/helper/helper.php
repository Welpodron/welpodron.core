<?

namespace Welpodron\Core;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;

class Helper
{
    //     final public static function onBuildGlobalMenu(&$aGlobalMenu, &$aModuleMenu)
    //     {
    //         $aGlobalMenu['global_menu_welpodron'] = [
    //             'menu_id' => 'welpodron',
    //             'text' => 'Welpodron',
    //             'title' => 'Настройки параметров составных модулей',
    //             'sort' => PHP_INT_MAX,
    //             'items_id' => 'global_menu_welpodron_items',
    //             'icon'      => '',
    //             'page_icon' => '',
    //         ];
    //     }

    final public static function buildOptions($moduleId, $arTabs = [])
    {
        global $APPLICATION, $USER;

        if (!Loader::includeModule($moduleId)) {
            return;
        }

        if (!$USER->IsAdmin()) {
            return;
        }

        $request = Context::getCurrent()->getRequest();

        if ($request->isPost() && $request['save'] && check_bitrix_sessid() && $USER->IsAdmin()) {
            foreach ($arTabs as $arTab) {
                foreach ($arTab['GROUPS'] as $arGroup) {
                    foreach ($arGroup['OPTIONS'] as $arOption) {
                        if ($arOption['TYPE'] == 'note') continue;

                        $value = $request->getPost($arOption['NAME']);

                        if ($arOption['TYPE'] == "checkbox" && $value != "Y") {
                            $value = "N";
                        } elseif (is_array($value)) {
                            $value = implode(",", array_diff($value, [''], [-1], ["-1"]));
                        } elseif ($value === null) {
                            $value = '';
                        } elseif (!is_scalar($value)) {
                            $value = '';
                        }

                        if ($value) {
                            Option::set($moduleId, $arOption['NAME'], $value);
                        }
                    }
                }
            }

            LocalRedirect($APPLICATION->GetCurPage() . '?lang=' . LANGUAGE_ID . '&mid_menu=1&mid=' . urlencode($moduleId) .
                '&tabControl_active_tab=' . urlencode($request['tabControl_active_tab']));
        }

        $tabControl = new \CAdminTabControl("tabControl", $arTabs, true, true);

        $i = -1;
?>

        <form name=<?= str_replace('.', '_', $moduleId) ?> method='post'>
            <? $tabControl->Begin(); ?>
            <?= bitrix_sessid_post(); ?>
            <? foreach ($arTabs as $arTab) : ?>
                <? $tabControl->BeginNextTab(); ?>
                <? foreach ($arTab['GROUPS'] as $arGroup) : ?>
                    <tr class="heading">
                        <td colspan="2"><?= $arGroup['TITLE'] ?></td>
                    </tr>
                    <? foreach ($arGroup['OPTIONS'] as $arOption) : ?>
                        <tr style="vertical-align: top;">
                            <? if ($arOption['REQUIRED']) : ?>
                                <script>
                                    (() => {
                                        const init = () => {
                                            //! TODO: Тут можно вместо каждого инпута по отдельности просто слушать у формы  

                                            const element = document.getElementById('<?= $arOption['NAME'] ?>');

                                            if (!element) {
                                                return;
                                            }

                                            const form = element.form;

                                            if (!form) {
                                                return;
                                            }

                                            const submit = element.form.querySelector('input[type="submit"][name="save"]');

                                            if (!submit) {
                                                return;
                                            }

                                            if (form.getAttribute('data-validation-on')) {
                                                return;
                                            }

                                            form.setAttribute('data-validation-on', '');

                                            const validate = () => {
                                                if (form.checkValidity()) {
                                                    submit.removeAttribute('disabled');
                                                } else {
                                                    submit.setAttribute('disabled', '');
                                                }
                                            }

                                            form.addEventListener('input', validate);

                                            validate();
                                        }

                                        if (document.readyState === 'loading') {
                                            document.addEventListener('DOMContentLoaded', init, {
                                                once: true
                                            });
                                        } else {
                                            init();
                                        }
                                    })();
                                </script>
                            <? endif; ?>
                            <? if ($arOption['RELATION']) : ?>
                                <script>
                                    (() => {
                                        const init = () => {
                                            const relation = document.getElementById('<?= $arOption['RELATION'] ?>');

                                            if (!relation) {
                                                return;
                                            }

                                            let element = document.getElementById('<?= $arOption['NAME'] ?>');

                                            if (!element) {
                                                element = document.querySelector('[name="<?= $arOption['NAME'] ?>"]');
                                            }

                                            if (!element) {
                                                return;
                                            }

                                            const tr = element.closest('tr');

                                            const toggle = () => {
                                                if (relation.type === "checkbox" || relation.type === "radio") {
                                                    if (relation.checked) {
                                                        if (tr) {
                                                            tr.style.display = '';
                                                        }

                                                        element.removeAttribute('disabled');
                                                    } else {
                                                        if (tr) {
                                                            tr.style.display = 'none';
                                                        }

                                                        element.setAttribute('disabled', 'disabled');
                                                    }

                                                    return;
                                                }

                                                if (relation.value) {
                                                    if (tr) {
                                                        tr.style.display = '';
                                                    }

                                                    element.removeAttribute('disabled');
                                                } else {
                                                    if (tr) {
                                                        tr.style.display = 'none';
                                                    }

                                                    element.setAttribute('disabled', 'disabled');
                                                }
                                            }

                                            toggle();

                                            relation.addEventListener('input', toggle);
                                        }

                                        if (document.readyState === 'loading') {
                                            document.addEventListener('DOMContentLoaded', init, {
                                                once: true
                                            });
                                        } else {
                                            init();
                                        }
                                    })();
                                </script>
                            <? endif ?>
                            <td style="width: 40%;">
                                <? if ($arOption['TYPE'] != 'note') : ?>
                                    <label for="<?= $arOption['NAME'] ?>">
                                        <?= $arOption['LABEL'] ?>
                                        <? if ($arOption['REQUIRED'] == "Y") : ?>
                                            <b style="color: red;">*</b>
                                        <? endif; ?>
                                    </label>
                                <? endif ?>
                                <? if ($arOption['REQUIRED'] == "Y") : ?>
                                    <p style="color: red;font-size: 10px;">* - поле обязательно для заполнения</p>
                                <? endif; ?>
                            </td>
                            <td>
                                <? if ($arOption['TYPE'] == 'note') : ?>
                                    <div id="<?= $arOption['NAME'] ?>" class="adm-info-message">
                                        <?= $arOption['LABEL'] ?>
                                    </div>
                                <? elseif ($arOption['TYPE'] == 'checkbox') : ?>
                                    <input <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> <? if ($arOption['VALUE'] == "Y") echo "checked "; ?> type="checkbox" name="<?= $arOption['NAME'] ?>" id="<?= $arOption['NAME'] ?>" value="Y">
                                <? elseif ($arOption['TYPE'] == 'textarea') : ?>
                                    <textarea style="resize: vertical; width: 98%;" <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> id="<?= $arOption['NAME'] ?>" name="<?= $arOption['NAME'] ?>"><?= $arOption['VALUE'] ?></textarea>
                                <? elseif ($arOption['TYPE'] == 'selectbox') : ?>
                                    <select style="width: 100%;" <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> <? if ($arOption['MULTIPLE'] == "Y") echo 'multiple="multiple"'; ?> id="<?= $arOption['NAME'] ?>" name="<?= ($arOption['MULTIPLE'] == "Y" ? $arOption['NAME'] . '[]' : $arOption['NAME']) ?>">
                                        <? if ($arOption['MULTIPLE'] == "Y") {
                                            $_value = explode(",", $arOption['VALUE']);
                                        } else {
                                            $_value = $arOption['VALUE'];
                                        } ?>
                                        <? foreach ($arOption['OPTIONS'] as $key => $value) : ?>
                                            <? if ($arOption['MULTIPLE'] == "Y") : ?>
                                                <option <? if (in_array(strval($key), $_value)) echo "selected "; ?> value="<?= $key ?>"><?= $value ?></option>
                                            <? else : ?>
                                                <option <? if ($_value == $key) echo "selected "; ?> value="<?= $key ?>"><?= $value ?></option>
                                            <? endif; ?>
                                        <? endforeach; ?>
                                    </select>
                                <? elseif ($arOption['TYPE'] == 'file') : ?>
                                    <?
                                    \CAdminFileDialog::ShowScript(
                                        array(
                                            "event" => str_replace('_', '', 'browsePath' . $arOption['NAME']),
                                            "arResultDest" => array("FORM_NAME" => str_replace('.', '_', $moduleId), "FORM_ELEMENT_NAME" => $arOption['NAME']),
                                            "arPath" => array("PATH" => GetDirPath($arOption['VALUE'])),
                                            "select" => 'F', // F - file only, D - folder only
                                            "operation" => 'O', // O - open, S - save
                                            "showUploadTab" => false,
                                            "showAddToMenuTab" => false,
                                            "fileFilter" => 'php',
                                            "allowAllFiles" => true,
                                            "SaveConfig" => true,
                                        )
                                    );
                                    ?>
                                    <div style="display: flex;align-items: center;">
                                        <input style="min-height: 29px;flex-grow: 1;" <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> type="text" id="<?= $arOption['NAME'] ?>" name="<?= $arOption['NAME'] ?>" maxlength="255" value="<?= htmlspecialcharsbx($arOption['VALUE']); ?>">
                                        <input style="flex-shrink: 0;" type="button" name="<?= ('browse' . $arOption['NAME']) ?>" value="..." onClick="<?= (str_replace('_', '', 'browsePath' . $arOption['NAME'])) ?>()">
                                    </div>
                                <? elseif ($arOption['TYPE'] == 'editor') : ?>
                                    <?
                                    //! TODO: v3 Возможно стоит использовать либо AddHTMLEditorFrame либо CLightHTMLEditor либо \Bitrix\Fileman\Block\Editor 
                                    if (Loader::IncludeModule("fileman")) {

                                        $i++;

                                        $editor = new \CHTMLEditor;

                                        $fieldNameId = 'id_' . htmlspecialcharsbx($arOption["NAME"]) . '__n' . $i . '_';
                                        $fieldNameName = htmlspecialcharsbx($arOption["NAME"]) . ($arOption["MULTIPLE"] ? "[n" . $i . "]" : "");

                                        $res = array_merge(
                                            array(
                                                'useFileDialogs' => false,
                                                'height' => 200,
                                                'useFileDialogs' => false,
                                                'minBodyWidth' => 350,
                                                'normalBodyWidth' => 555,
                                                'bAllowPhp' => false,
                                                'limitPhpAccess' => true,
                                                'showTaskbars' => false,
                                                'showNodeNavi' => false,
                                                'askBeforeUnloadPage' => true,
                                                'bbCode' => false,
                                                'siteId' => SITE_ID,
                                                'autoResize' => true,
                                                'autoResizeOffset' => 40,
                                                'saveOnBlur' => true,
                                                'controlsMap' => array(
                                                    array('id' => 'Bold',  'compact' => true, 'sort' => 80),
                                                    array('id' => 'Italic',  'compact' => true, 'sort' => 90),
                                                    array('id' => 'Underline',  'compact' => true, 'sort' => 100),
                                                    array('id' => 'Strikeout',  'compact' => true, 'sort' => 110),
                                                    array('id' => 'RemoveFormat',  'compact' => true, 'sort' => 120),
                                                    array('id' => 'Color',  'compact' => true, 'sort' => 130),
                                                    array('id' => 'FontSelector',  'compact' => false, 'sort' => 135),
                                                    array('id' => 'FontSize',  'compact' => false, 'sort' => 140),
                                                    array('separator' => true, 'compact' => false, 'sort' => 145),
                                                    array('id' => 'OrderedList',  'compact' => true, 'sort' => 150),
                                                    array('id' => 'UnorderedList',  'compact' => true, 'sort' => 160),
                                                    array('id' => 'AlignList', 'compact' => false, 'sort' => 190),
                                                    array('separator' => true, 'compact' => false, 'sort' => 200),
                                                    array('id' => 'InsertLink',  'compact' => true, 'sort' => 210, 'wrap' => 'bx-b-link-' . $fieldNameId),
                                                    array('id' => 'InsertImage',  'compact' => false, 'sort' => 220),
                                                    array('id' => 'InsertVideo',  'compact' => true, 'sort' => 230, 'wrap' => 'bx-b-video-' . $fieldNameId),
                                                    array('id' => 'InsertTable',  'compact' => false, 'sort' => 250),
                                                    array('id' => 'Code',  'compact' => true, 'sort' => 260),
                                                    array('id' => 'Quote',  'compact' => true, 'sort' => 270, 'wrap' => 'bx-b-quote-' . $fieldNameId),
                                                    array('id' => 'Smile',  'compact' => false, 'sort' => 280),
                                                    array('separator' => true, 'compact' => false, 'sort' => 290),
                                                    array('id' => 'Fullscreen',  'compact' => false, 'sort' => 300),
                                                    array('id' => 'BbCode',  'compact' => true, 'sort' => 301),
                                                    array('id' => 'More',  'compact' => true, 'sort' => 303)
                                                )
                                            ),
                                            array(
                                                'placeholder' => 'Содержимое...',
                                                'name' => $fieldNameName,
                                                'inputName' => $fieldNameName,
                                                'id' => $fieldNameId,
                                                'width' => '100%',
                                                'content' => $arOption['VALUE'],
                                            )
                                        );
                                        $editor->show($res);
                                    } else {
                                    ?>
                                        <textarea style="resize: vertical; width: 98%;" <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> id="<?= $arOption['NAME'] ?>" name="<?= $arOption['NAME'] ?>"><?= $arOption['VALUE'] ?></textarea>
                                    <?
                                    }
                                    ?>

                                    <style>
                                        .bx-html-editor {
                                            border-color: #87919c #959ea9 #9ea7b1 #959ea9 !important;
                                            border-radius: 4px !important;
                                        }

                                        .bxhtmled-toolbar-cnt {
                                            box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 2px 2px -1px rgba(180, 188, 191, 0.7);
                                        }
                                    </style>
                                <? elseif ($arOption['TYPE'] == 'number') : ?>
                                    <input class="adm-input" style="width: 98%;" <? if (isset($arOption['MIN'])) echo 'min="' . $arOption['MIN'] . '"'; ?> <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> id="<?= $arOption['NAME'] ?>" name="<?= $arOption['NAME'] ?>" type="number" value="<?= $arOption['VALUE'] ?>">
                                <? else : ?>
                                    <input style="width: 98%;" <? if ($arOption['REQUIRED'] == "Y") echo "required "; ?> id="<?= $arOption['NAME'] ?>" name="<?= $arOption['NAME'] ?>" type="text" maxlength="255" value="<?= $arOption['VALUE'] ?>">
                                <? endif; ?>
                                <? if ($arOption['DESCRIPTION']) : ?>
                                    <div class="adm-info-message-wrap">
                                        <div style="margin-top: 0;" class="adm-info-message">
                                            <?= $arOption['DESCRIPTION'] ?>
                                        </div>
                                    </div>
                                <? endif; ?>
                            </td>
                        </tr>
                    <? endforeach; ?>
                <? endforeach; ?>
            <? endforeach; ?>
            <? $tabControl->Buttons(['btnApply' => false, 'btnCancel' => false, 'btnSaveAndAdd' => false]); ?>
            <? $tabControl->End(); ?>
        </form>
<?
    }
}
