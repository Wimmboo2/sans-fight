/*
 * dialog.js - RPGText (typewriter text objects) and SansText (speech bubble).
 * Port of RPGText.xml.
 *
 * A text object types FullText one character per 1/30 s, playing its voice blip per character.
 * Interactive texts: Z/Enter closes a finished text, X/Shift skips to the end.
 * Non-interactive finished texts disappear after Timeout seconds (0 = stay).
 * When a text is destroyed its EndFunc (a function name) is called.
 */
(function (BTS) {
  'use strict';

  function W() { return BTS.world; }

  var text = {
    create: function (font, layer, x, y, props) {
      var d = BTS.FONT_DEFAULTS[font];
      var t = {
        font: font, layer: layer, x: x, y: y, w: 208, h: 16,
        scale: d.scale, voice: d.voice, text: '', fullText: '', name: '', endFunc: '',
        interactive: false, currentChar: 0, t: 0, timeout: 0,
        tint: null, halign: 'left', visible: true, opacity: 1, dead: false
      };
      for (var k in props) t[k] = props[k];
      W().texts.push(t);
      return t;
    },

    destroy: function (t) {
      if (t.dead) return;
      t.dead = true;
      BTS.util.remove(W().texts, t);
      if (t.endFunc !== '' && t.endFunc !== undefined && t.endFunc !== null) BTS.fn.call(t.endFunc);
    },

    // Destroy all texts matching a filter (font name, or predicate).
    destroyWhere: function (pred) {
      W().texts.slice().forEach(function (t) { if (pred(t)) text.destroy(t); });
    },
    // (texts on the Touch layer, i.e. the mobile warning, are left alone)
    destroyFont: function (font) { text.destroyWhere(function (t) { return t.font === font && t.layer !== 'Touch'; }); },
    byName: function (name) { return W().texts.filter(function (t) { return t.name === name; }); },

    update: function (dt) {
      var C = BTS.C, P = BTS.input;
      var list = W().texts.slice();
      list.forEach(function (t) { t.t += dt; });
      list.forEach(function (t) {
        if (t.dead) return;
        if (t.currentChar < t.fullText.length && t.t >= C.TEXT_CHAR_TIME) {
          t.t -= C.TEXT_CHAR_TIME;
          t.currentChar++;
          t.text = t.fullText.slice(0, t.currentChar);
          if (t.voice !== '') BTS.audio.play(t.voice);
        }
      });
      list.forEach(function (t) {
        if (t.dead || !t.interactive) return;
        if (P.pressed('Confirm') && t.currentChar === t.fullText.length) text.destroy(t);
        else if (P.pressed('Cancel')) {
          t.currentChar = t.fullText.length;
          t.text = t.fullText;
          t.t = 0;
        }
      });
      list.forEach(function (t) {
        if (t.dead || t.interactive || t.currentChar !== t.fullText.length || !(t.timeout > 0)) return;
        t.timeout -= Math.min(dt, t.timeout);
        if (t.timeout === 0) text.destroy(t);
      });
    },

    // SansText(text, endFunc): speech bubble next to Sans; pauses the attack timeline until closed.
    sansText: function (msg, endFunc) {
      var w = W(), legs = w.sans.legs;
      msg = msg === undefined || msg === null ? '' : String(msg);
      if (BTS.C.FIXES.speechNewlines) msg = msg.replace(/\\n/g, '\n');
      var bubble = new BTS.Sprite('SpeechBubble', 'Default', legs.x + 64, legs.y - 128);
      bubble.layer = 'Enemies';
      w.speechBubbles.push(bubble);
      text.create('SansFont', 'Enemies', bubble.x + 32, bubble.y + 16, {
        w: 256, h: 64, tint: BTS.C.TINT.BLACK, voice: 'SansSpeak', fullText: msg, interactive: true,
        endFunc: (endFunc === undefined || endFunc === null || endFunc === '' || endFunc === 0) ? 'EndSansText' : String(endFunc)
      });
      BTS.fn.call('TLPause');
    },

    endSansText: function () {
      W().speechBubbles.length = 0;
      BTS.fn.call('TLResume');
    }
  };

  BTS.text = text;
})(window.BTS = window.BTS || {});
