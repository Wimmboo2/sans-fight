/*
 * menubones.js - the bones that attack you in the FIGHT/ACT/ITEM/MERCY menu during phase 2
 * ("MenuBones" group of Battle.xml). They hurt but can never bring HP below 1.
 */
(function (BTS) {
  'use strict';

  var U;
  function W() { return BTS.world; }

  var menubones = {
    init: function () { U = BTS.util; },

    off: function () {
      W().menuBonesLeft.forEach(function (b) { b.destroy = true; });
      W().bottomBones.on = false;
    },
    left: function () {
      var b = new BTS.Sprite('MenuBoneLeft', 'Default', -10, 270);
      b.seq = W().seq++; b.damage = BTS.C.MENU_BONE_DAMAGE; b.karma = 0; b.timer = 0; b.destroy = false;
      W().menuBonesLeft.push(b);
    },
    bottom: function () {
      var bb = W().bottomBones;
      bb.on = true; bb.timer = 0; bb.alternate = 0;
    },

    update: function (dt) {
      var w = W();
      w.menuBonesLeft.forEach(function (b) {
        b.timer += dt;
        b.x = -30 + Math.abs(U.sin(600 * b.timer / Math.PI)) * 105;
      });
      w.menuBonesLeft.forEach(function (b) { if (b.x > 64) b.timer -= dt * 0.72; });
      w.menuBonesLeft = w.menuBonesLeft.filter(function (b) { return !(b.destroy && b.x <= -8); });

      var bb = w.bottomBones;
      if (bb.on) {
        bb.timer += dt;
        if (bb.timer >= 0.6) {
          bb.timer -= 0.6;
          [0, 2].forEach(function (base) {
            var m = new BTS.Sprite('MenuBoneBottom', 'Default', 0, BTS.C.HEIGHT);
            m.seq = w.seq++; m.damage = BTS.C.MENU_BONE_DAMAGE; m.karma = 0; m.state = 0;
            m.button = base + bb.alternate;
            var btn = w.buttons[m.button];
            if (btn) m.x = btn.bbox().r;
            w.menuBonesBottom.push(m);
          });
          bb.alternate = bb.alternate === 0 ? 1 : 0;
        }
      }
      w.menuBonesBottom.forEach(function (m) {
        if (m.state === 0) {
          m.y -= 300 * dt;
          if (m.y <= 440) { m.y = 440; m.state = 1; }
        }
      });
      w.menuBonesBottom.forEach(function (m) {
        if (m.state === 1) {
          m.x -= 150 * dt;
          var btn = w.buttons[m.button];
          if (btn && m.x <= btn.bbox().l - 14) { m.x = btn.bbox().l - 14; m.state = 2; }
        }
      });
      w.menuBonesBottom.forEach(function (m) { if (m.state === 2) m.y += 300 * dt; });
      w.menuBonesBottom = w.menuBonesBottom.filter(function (m) { return !(m.y > BTS.C.HEIGHT); });
    },

    // Collision box from the original collision polygon (inner 10x40 of the 14x44 sprite).
    rect: function (m) {
      return { l: m.x + 14 * 0.142857, r: m.x + 14 * 0.857143, t: m.y + 44 * 0.0454545, b: m.y + 44 * 0.954545 };
    }
  };

  BTS.menubones = menubones;
})(window.BTS = window.BTS || {});
