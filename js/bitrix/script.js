window.welpodron.bitrix_custom_field_popup_object = null;

window.welpodron.bitrix_custom_field_popup = function (config = {}) {
  if (BX && BX.CDialog) {
    this.input = config.oInput;
    this.data = config.data;

    if (this.input && this.data && this.data.url) {
      const dialogObj = {
        content_url: this.data.url
      };

      this.data.post
        ? (dialogObj['content_post'] = {
            ...this.data.post,
            CURRENT_VALUE: this.input.value
          })
        : (dialogObj['content_post'] = {
            CURRENT_VALUE: this.input.value
          });

      // TODO: REWORK!

      this.dialog = new BX.CDialog(dialogObj);
    }
  }
};

window.welpodron.bitrix_custom_field_popup.prototype.save = function (data) {
  this.input.value = data;
  this.close();
};

window.welpodron.bitrix_custom_field_popup.prototype.show = function () {
  if (!this.active && this.dialog) {
    this.active = true;

    BX.addCustomEvent(this.dialog, 'onWindowClose', ({ DIV }) => {
      window.welpodron.bitrix_custom_field_popup_object = null;
      DIV.parentNode.removeChild(DIV);
    });

    this.dialog.Show();
  }
};

window.welpodron.bitrix_custom_field_popup.prototype.close = function () {
  if (this.active && this.dialog) {
    this.dialog.Close();
  }
};
// window.welpodron.bitrix_custom_field_popup.prototype.close = function () {};

function welpodron_bitrix_render_string(string) {
  const template = document.createElement('template');
  template.innerHTML = string.trim();

  return template.content.firstChild;
}

function welpodron_bitrix_custom_field_uuid(params) {
  const btn = welpodron_bitrix_render_string(
    `<button type="button" class="adm-btn" style="padding: 5px; display: grid; place-content: center; margin-left: auto;" aria-label="Сгенерировать новый ID" title="Сгенерировать новый ID"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#3F4B54" d="M21,11a1,1,0,0,0-1,1,8.05,8.05,0,1,1-2.22-5.5h-2.4a1,1,0,0,0,0,2h4.53a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4.77A10,10,0,1,0,22,12,1,1,0,0,0,21,11Z"></path></svg></button>`
  );
  const input = welpodron_bitrix_render_string(
    `<input style="min-height: 29px; min-width: 80%;" type="text" readonly disabled size="20">`
  );

  input.value = params.oInput.value;

  btn.onclick = () => {
    params.oInput.value = params.data + Math.random().toString(36).slice(3);
    input.value = params.oInput.value;
  };

  const container = welpodron_bitrix_render_string(
    `<div style="display: flex; flex-wrap: wrap; align-items: center; width: 90%;"></div>`
  );

  container.appendChild(input);
  container.appendChild(btn);
  params.oCont.appendChild(container);
}

function welpodron_bitrix_custom_field_popup(params) {
  const btn = welpodron_bitrix_render_string(
    `<button type="button" class="adm-btn" style="padding: 5px;" aria-label="Выбрать файл" title="Выбрать файл">Выбрать файл</button>`
  );

  btn.onclick = () => {
    window.welpodron.bitrix_custom_field_popup_object =
      new window.welpodron.bitrix_custom_field_popup(params);

    window.welpodron.bitrix_custom_field_popup_object.show();
  };

  params.oCont.appendChild(btn);
}
