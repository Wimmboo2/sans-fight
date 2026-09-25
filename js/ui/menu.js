/*
 * menu.js - the menu system shared by the main menu and the battle menu (port of Menus.xml).
 *
 * Menu items are invisible anchors; the heart cursor sits at (x+8, y+12) and each item's label is a
 * DefaultFont text at (x+32, y). Arrow keys move to the nearest item exactly in that direction, wrapping
 * to the farthest item on the other side. The menu stack remembers the selection and the "back"
 * function of every level.
 */
(function (BTS) {
  'use strict';

  function W() { return BTS.world; }
  function top() { var s = W().menuStack; return s[s.length - 1]; }

  var menu = {
    resetStack: function () { W().menuStack = [{ id: 0, back: '' }]; },
    top: top,
    selectedId: function () { return top().id; },
    // MenuStack.At(Width - 2): the selection one level down.
    parentId: function () { var s = W().menuStack; return s.length >= 2 ? s[s.length - 2].id : 0; },
    setBackAction: function (name) { top().back = name; },
    selectedItem: function () {
      var id = top().id, items = W().menuItems;
      for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
      return null;
    },

    destroyItems: function () { W().menuItems.length = 0; },

    createItem: function (layer, x, y, id, label, action) {
      var it = { layer: layer, x: BTS.util.toFloat(x), y: BTS.util.toFloat(y), id: BTS.util.toInt(id), text: label, action: action || '' };
      W().menuItems.push(it);
      BTS.text.create('DefaultFont', W().layer0 || layer, it.x + 32, it.y, {
        w: 512, h: 96, scale: 2, text: String(label), name: 'Menu' + it.id,
        tint: it.action === '' ? BTS.C.TINT.DISABLED_TEXT : null
      });
      return it;
    },

    select: function (dir) {
      var U = BTS.util, cur = menu.selectedItem();
      if (!cur) return;
      var best = null, bestDist = Infinity;
      W().menuItems.forEach(function (it) {
        if (it.id === cur.id) return;
        if (!U.angleWithin(U.angle(cur.x, cur.y, it.x, it.y), dir * 90, 0.5)) return;
        var d = Math.hypot(it.x - cur.x, it.y - cur.y);
        if (d < bestDist) { bestDist = d; best = it; }
      });
      if (!best) {
        bestDist = -Infinity;
        W().menuItems.forEach(function (it) {
          if (it.id === cur.id) return;
          if (!U.angleWithin(U.angle(cur.x, cur.y, it.x, it.y), dir * 90 - 180, 0.5)) return;
          var d = Math.hypot(it.x - cur.x, it.y - cur.y);
          if (d > bestDist) { bestDist = d; best = it; }
        });
      }
      if (best) {
        top().id = best.id;
        BTS.audio.play('MenuCursor');
      }
    },

    run: function () {
      var P = BTS.input, it = menu.selectedItem(), stack = W().menuStack;
      if (P.pressed('Confirm') && it && it.action !== '') {
        stack.push({ id: 0, back: 0 });
        BTS.fn.call(it.action);
        BTS.audio.play('MenuSelect');
      } else if (P.pressed('Cancel') && top().back !== '') {
        var name = top().back;
        stack.pop();
        if (!stack.length) stack.push({ id: 0, back: '' });
        BTS.fn.call(name);
        if (!BTS.C.FIXES.silentMenuBack) BTS.audio.play('MenuSelect');
      } else if (P.pressed('Right')) menu.select(0);
      else if (P.pressed('Down')) menu.select(1);
      else if (P.pressed('Left')) menu.select(2);
      else if (P.pressed('Up')) menu.select(3);

      W().menuItems.forEach(function (m) {
        BTS.text.byName('Menu' + m.id).forEach(function (t) { t.x = m.x + 32; t.y = m.y; });
      });
    }
  };

  BTS.menu = menu;
})(window.BTS = window.BTS || {});
