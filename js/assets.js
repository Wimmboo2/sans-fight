/*
 * assets.js - image loading. Every PNG is the original file, unmodified.
 */
(function (BTS) {
  'use strict';

  var BASE = 'assets/images/';
  var TEXTURES = ['BattleFont', 'BoneH', 'BoneStabH', 'BoneStabV', 'BoneStabWarn', 'BoneV', 'CombatZone',
    'DamageFont', 'DefaultFont', 'GasterBlast1', 'GasterBlast2', 'GasterBlast3', 'GasterBlastHit',
    'HPBackground', 'HPBar', 'KRBar', 'Platform1', 'Platform2', 'SansFont'];
  var images = {};

  function pad3(n) { return ('00' + n).slice(-3); }

  var assets = {
    framePath: function (obj, anim, i) { return 'animations/' + obj + '/' + anim + '/' + pad3(i) + '.png'; },
    texPath: function (name) { return 'textures/' + name + '.png'; },

    allPaths: function () {
      var out = TEXTURES.map(assets.texPath);
      Object.keys(BTS.SPRITES).forEach(function (obj) {
        var anims = BTS.SPRITES[obj].anims;
        Object.keys(anims).forEach(function (a) {
          for (var i = 0; i < anims[a].frames.length; i++) out.push(assets.framePath(obj, a, i));
        });
      });
      return out;
    },

    load: function (onEach) {
      var list = assets.allPaths(), done = 0;
      return Promise.all(list.map(function (p) {
        return new Promise(function (res) {
          var img = new Image();
          img.onload = img.onerror = function () { done++; if (onEach) onEach(done, list.length); res(); };
          img.src = BASE + p;
          images[p] = img;
        });
      }));
    },

    img: function (path) { return images[path]; },
    frame: function (obj, anim, i) { return images[assets.framePath(obj, anim, i)]; },
    tex: function (name) { return images[assets.texPath(name)]; }
  };

  BTS.assets = assets;
})(window.BTS = window.BTS || {});
