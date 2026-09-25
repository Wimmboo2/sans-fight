/*
 * battlemenu.js - FIGHT / ACT / ITEM / MERCY (the "BattleMenu" group of Battle.xml).
 * Only Normal mode shows the menu; the other modes go straight to the next attack.
 */
(function (BTS) {
  'use strict';

  var fn = BTS.fn;
  function W() { return BTS.world; }
  function S() { return BTS.state; }
  function C() { return BTS.C; }

  var STATE_OFF = 0, STATE_WAIT = 1, STATE_BUTTONS = 2, STATE_SUB = 3;

  function clearMenu() {
    BTS.menu.destroyItems();
    BTS.text.destroyFont('DefaultFont');
  }

  function infoText(fullText, props) {
    var p = { w: 544, h: 96, scale: 2, text: '', fullText: fullText, name: 'InfoText' };
    for (var k in props) p[k] = props[k];
    return BTS.text.create('DefaultFont', 'CombatZone', 48, 272, p);
  }

  function miss(y, timeout) {
    BTS.text.create('DamageFont', 'Enemies', 272, y, { w: 176, h: 32, text: 'MISS', timeout: timeout, tint: C().TINT.GREY_TEXT });
  }

  var battlemenu = {
    update: function (dt) {
      var w = W(), P = BTS.input, U = BTS.util;

      // FIGHT: the target bar.
      var tg = w.target, tc = w.targetChoice;
      if (tg && tg.state === 0 && tc) {
        tc.x += U.cos(tc.direction * 90) * dt * 360;
        var z = BTS.zone.rect();
        if ((tc.direction === 0 && tc.x > z.r) || (tc.direction === 2 && tc.x < z.l)) {
          w.targetChoice = null;
          tg.state = 2;
          miss(76, 1);
          fn.call('StartAttack');
        } else if (P.pressed('Confirm')) {
          tg.state = 1;
          tc.startAnim(false);
          var st = new BTS.Sprite('Strike', 'Default', w.sans.legs.x, w.sans.legs.y - 96);
          st.scaleX = st.scaleY = 1.5;
          st.onFinished = function (sp) { BTS.util.remove(W().strikes, sp); };
          w.strikes.push(st);
          BTS.audio.play('PlayerFight');
          w.sans.legs.dodgeState = 1;
        }
      }
      if (tg && tg.state === 2) {
        tg.scaleX = (tg.width() - dt * 960) / tg.imageWidth();
        tg.opacity -= dt * 2.4;
        if (tg.opacity <= 0) w.target = null;
      }

      if (w.menuState >= STATE_BUTTONS) BTS.menu.run();

      // ITEM menu paging.
      if (w.menuState === STATE_SUB && w.menuStack[0].id === 2) {
        var sel = BTS.menu.selectedItem();
        if (sel && sel.x > 640) w.menuItems.forEach(function (m) { m.x -= 640; });
        else if (sel && sel.x < 0) w.menuItems.forEach(function (m) { m.x += 640; });
        BTS.text.byName('Page').forEach(function (t) { t.text = 'PAGE ' + (Math.floor(BTS.menu.selectedId() / 4) + 1); });
      }

      var btnSel = w.buttons.filter(function (b) { return b.id === BTS.menu.selectedId(); })[0];
      if (w.menuState === STATE_OFF) w.buttons.forEach(function (b) { b.setAnim('Default', true); });
      if (w.menuState === STATE_WAIT && btnSel) placeHeart(btnSel.imagePoint('Heart'));
      if (w.menuState === STATE_BUTTONS) {
        w.buttons.forEach(function (b) { b.setAnim('Default', true); });
        if (btnSel) { placeHeart(btnSel.imagePoint('Heart')); btnSel.setAnim('Highlight', true); }
      }
      if (w.menuState === STATE_SUB) {
        var it = BTS.menu.selectedItem();
        if (it) { w.heart.x = it.x + 8; w.heart.y = it.y + 12; }
      }
    }
  };

  function placeHeart(p) { W().heart.x = p.x; W().heart.y = p.y; }

  // ----- functions -----
  fn.on('BattleMenuEnable', function (v) {
    var w = W();
    if (BTS.util.toFloat(v) !== 0) {
      w.menuStack = [w.menuStack[0] || { id: 0, back: '' }];
      w.menuState = STATE_WAIT;
      var m = C().MENU_ZONE;
      fn.call('CombatZoneResize', m[0], m[1], m[2], m[3], 'MenuBattle');
    } else {
      w.menuState = STATE_OFF;
    }
  });

  fn.on('MenuBattle', function () {
    var w = W();
    if (S().simulatorMode === BTS.MODE.NORMAL) {
      clearMenu();
      BTS.menu.setBackAction('');
      w.menuState = STATE_BUTTONS;
      infoText(w.zone.infoText, {});
      w.buttons.forEach(function (b) {
        w.menuItems.push({ layer: 'Buttons', x: b.x, y: b.y, id: b.id, text: '', action: b.action, created: true });
      });
    } else {
      BTS.scheduler.wait(0, function () {
        W().menuState = STATE_OFF;
        fn.call('StartAttack');
      });
    }
  });

  fn.on('MenuEnemyList', function () {
    var action = '';
    var top = W().menuStack[0].id;
    if (top === 0) action = 'MenuFightEnemy';
    if (top === 1) action = 'MenuActEnemy';
    BTS.menu.createItem('CombatZone', 64, 272, 0, '* Sans', action);
  });

  fn.on('MenuFight', function () {
    clearMenu();
    BTS.menu.setBackAction('MenuBattle');
    W().menuState = STATE_SUB;
    fn.call('MenuEnemyList');
  });

  fn.on('MenuFightEnemy', function () {
    var w = W(), z = BTS.zone.rect();
    clearMenu();
    w.menuState = STATE_OFF;
    w.heart.visible = false;
    w.target = new BTS.Sprite('Target', 'Default', 320, 320);
    w.target.state = 0;
    var left = Math.floor(BTS.rng.range(2)) === 0;
    w.targetChoice = new BTS.Sprite('TargetChoice', 'Default', left ? z.l : z.r, 320);
    w.targetChoice.direction = left ? 0 : 2;
    w.targetChoice.stopAnim();
  });

  fn.on('MenuAct', function () {
    clearMenu();
    BTS.menu.setBackAction('MenuBattle');
    W().menuState = STATE_SUB;
    fn.call('MenuEnemyList');
  });

  fn.on('MenuActEnemy', function () {
    clearMenu();
    BTS.menu.setBackAction('MenuAct');
    W().menuState = STATE_SUB;
    BTS.menu.createItem('CombatZone', 64, 272, 0, '* Check', 'MenuCheckSans');
  });

  fn.on('MenuCheckSans', function () {
    var w = W(), I = BTS.ITEMS.infoText;
    clearMenu();
    w.menuState = STATE_OFF;
    w.heart.visible = false;
    infoText(I.check, { endFunc: w.sans.legs.hitAttempts > 0 ? 'MenuCheckSans2' : 'StartAttack', interactive: true });
  });

  fn.on('MenuCheckSans2', function () {
    infoText(BTS.ITEMS.infoText.check2, { endFunc: 'StartAttack', interactive: true });
  });

  fn.on('MenuItem', function () {
    var w = W(), items = w.playerItems, db = BTS.ITEMS.db;
    if (items.length === 0) { w.menuStack.pop(); return; }
    clearMenu();
    BTS.menu.setBackAction('MenuBattle');
    w.menuState = STATE_SUB;
    BTS.text.create('DefaultFont', 'CombatZone', 384, 336, { w: 256, h: 32, scale: 2, text: 'PAGE 1', name: 'Page' });
    var i;
    for (i = 0; i <= Math.min(3, items.length - 1); i++) {
      BTS.menu.createItem('CombatZone', 64 + (i % 2) * 256, 272 + Math.floor(i / 2) * 32, i, '* ' + db[items[i]].short, 'MenuUseItem');
    }
    for (i = 0; i <= items.length - 4 - 1; i++) {
      BTS.menu.createItem('CombatZone', 640 + 64 + (i % 2) * 256, 272 + Math.floor(i / 2) * 32, i + 4, '* ' + db[items[i + 4]].short, 'MenuUseItem');
    }
  });

  fn.on('MenuUseItem', function () {
    var w = W(), s = S(), db = BTS.ITEMS.db;
    clearMenu();
    w.heart.visible = false;
    w.menuState = STATE_OFF;
    var slot = BTS.menu.parentId(), item = db[w.playerItems[slot]];
    if (item && item.type === 0) {
      s.hp += item.heal;
      BTS.audio.play('PlayerHeal');
      infoText('* You eat the ' + item.name + '.\n* You recovered ' + item.heal + ' HP!', { endFunc: 'StartAttack', interactive: true });
      w.playerItems.splice(slot, 1);
    }
  });

  fn.on('MenuMercy', function () {
    clearMenu();
    BTS.menu.setBackAction('MenuBattle');
    W().menuState = STATE_SUB;
    BTS.menu.createItem('CombatZone', 64, 272, 0, '* Spare', 'MenuSpare');
  });

  fn.on('MenuSpare', function () {
    var w = W();
    clearMenu();
    w.menuState = STATE_OFF;
    w.heart.visible = false;
    fn.call('StartAttack');
  });

  fn.on('MenuBackAction', function (name) { BTS.menu.setBackAction(name); });

  BTS.battlemenu = battlemenu;
})(window.BTS = window.BTS || {});
