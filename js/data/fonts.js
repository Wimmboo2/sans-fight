/*
 * fonts.js - sprite fonts from the original: cell size, character set and per-character widths
 * (from Fonts.xml; later entries override earlier ones, exactly like the original's action order).
 * Widths are in unscaled pixels; characters not listed advance by the cell width.
 */
(function (BTS) {
  'use strict';

  var ASCII = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

  BTS.FONTS = {
    BattleFont: {
      tex: 'textures/BattleFont.png', cw: 6, ch: 6, set: ASCII.slice(0, 64),
      widths: [['!"#%-/0123456789<=>?ABCDEFGHIJKLNOPQRSTUVXYZ[\\]_', 5], ['"()<>[]', 4], [' -', 3], ['\',.:;', 2]]
    },
    DamageFont: {
      tex: 'textures/DamageFont.png', cw: 33, ch: 32, set: ASCII,
      widths: [['~', 29], ['"/<>I^j{}', 25], ['(),1[]`', 21], ['!\'.:;il|', 17]]
    },
    DefaultFont: {
      tex: 'textures/DefaultFont.png', cw: 10, ch: 16, set: ASCII,
      widths: [['#%&MWmw~', 9], [' $*+-./0123456789=?@ABCDEFGHIJKLNOPQRSTUVXYZ\\^abcdefghijklnopqrstuvxyz', 8],
        ['"<>{}', 7], ['!()[]_', 6], ['`', 5], ['\',:;|', 4]]
    },
    SansFont: {
      tex: 'textures/SansFont.png', cw: 16, ch: 16, set: ASCII,
      widths: [['W', 15], ['@', 14], ['%Q', 13], ['MO', 12], ['#&GNVX_', 11], [' $ACHJSTUYZmw', 10],
        ['247?BDEKdxy~', 9], ['*+/0135689FILR\\^abcefghknopqrtuvz', 8], ['-=Pjs{}', 7], ['()<>[]', 6],
        ['";`', 5], ['!\',.:il|', 4]]
    }
  };

  // Build lookup tables.
  Object.keys(BTS.FONTS).forEach(function (k) {
    var f = BTS.FONTS[k];
    f.index = {}; f.width = {};
    for (var i = 0; i < f.set.length; i++) f.index[f.set[i]] = i;
    f.widths.forEach(function (row) {
      for (var j = 0; j < row[0].length; j++) f.width[row[0][j]] = row[1];
    });
    f.charWidth = function (c) { return f.width[c] !== undefined ? f.width[c] : f.cw; };
  });

  // Text object defaults, copied from each font's default instance in the original layouts.
  BTS.FONT_DEFAULTS = {
    BattleFont: { scale: 3, voice: '' },
    DamageFont: { scale: 1, voice: '' },
    DefaultFont: { scale: 1, voice: 'BattleText' },
    SansFont: { scale: 1, voice: 'SansSpeak' }
  };
})(window.BTS = window.BTS || {});
