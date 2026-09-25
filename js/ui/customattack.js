/*
 * customattack.js - load a custom attack script in the browser: a file picker or a paste box.
 * Both work when the game is opened from file:// (FileReader, not fetch).
 */
(function (BTS) {
  'use strict';

  var fileInput = null, overlay = null, textarea = null, onPaste = null;

  function el(id) { return document.getElementById(id); }

  var customattack = {
    attach: function () {
      fileInput = el('custom-file');
      overlay = el('paste-overlay');
      textarea = el('paste-text');
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () { if (customattack._onFile) customattack._onFile(String(r.result)); };
        r.readAsText(f);
        fileInput.value = '';
      });
      el('paste-ok').addEventListener('click', function () { customattack.closePaste(true); });
      el('paste-cancel').addEventListener('click', function () { customattack.closePaste(false); });
      textarea.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') customattack.closePaste(false);
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) customattack.closePaste(true);
      });
    },

    openFile: function (cb) {
      customattack._onFile = cb;
      if (fileInput) fileInput.click();
    },

    openPaste: function (cb) {
      onPaste = cb;
      if (!overlay) return;
      overlay.hidden = false;
      BTS.input.captureKeys = false;
      textarea.focus();
    },

    closePaste: function (ok) {
      overlay.hidden = true;
      BTS.input.captureKeys = true;
      BTS.input.resetHeld();
      var t = textarea.value;
      if (ok && t.trim() !== '' && onPaste) onPaste(t);
      onPaste = null;
    }
  };

  BTS.customattack = customattack;
})(window.BTS = window.BTS || {});
