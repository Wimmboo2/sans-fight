/*
 * mainmenu.js - the title menu (port of MainMenu.xml) plus this port's Credits and paste-a-custom-attack entries.
 * Supports the original URL parameters: ?mode=normal | endless1 | endless2 | single&attack=<name>
 */
(function (BTS) {
  'use strict';

  var fn = BTS.fn, MODE = BTS.MODE;
  function W() { return BTS.world; }
  function S() { return BTS.state; }

  function clear() { BTS.menu.destroyItems(); BTS.text.destroyFont('DefaultFont'); }
  function header(text) {
    BTS.text.create('DefaultFont', 'Menu', 0, 32, { w: 640, h: 32, scale: 2, text: text, halign: 'center' });
  }
  function item(i, label, action, y) {
    return BTS.menu.createItem('Menu', 192, y === undefined ? 96 + i * 32 : y, i, label, action);
  }
  function notice(text) {
    BTS.text.create('BattleFont', 'Menu', 8, 8, { w: 640, h: 32, text: text, timeout: 1 });
  }

  var mainmenu = {
    firstStart: true,

    enter: function () {
      var s = S();
      BTS.world = {
        name: 'mainmenu', layer0: 'Menu', seq: 0, texts: [], menuItems: [], menuStack: [{ id: 0, back: '' }],
        cam: { x: 0, y: 0 }
      };
      BTS.input.resetHeld();
      BTS.scheduler.clear();
      BTS.timeline.reset();
      s.timeScale = 1;
      BTS.menu.resetStack();
      s.hp = s.maxHp;
      var h = new BTS.Sprite('PlayerHeart', 'Default', 0, 0);
      h.angle = 90; h.tint = BTS.C.TINT.RED_HEART; h.visible = true;
      W().heart = h;
      BTS.touch.onMenuStart();
      fn.call('MenuMain');

      if (mainmenu.firstStart) {
        mainmenu.firstStart = false;
        var q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
        var mode = q.get('mode'), attack = q.get('attack');
        if (mode === 'normal') { s.simulatorMode = MODE.NORMAL; BTS.goScene('battle'); }
        if (mode === 'endless1') { s.simulatorMode = MODE.ENDLESS; s.endlessStage = 0; BTS.goScene('battle'); }
        if (mode === 'endless2') { s.simulatorMode = MODE.ENDLESS; s.endlessStage = 1; BTS.goScene('battle'); }
        if (mode === 'single' && attack && BTS.ATTACKS[attack] !== undefined) {
          s.simulatorMode = MODE.SINGLE; s.singleAttack = attack; BTS.goScene('battle');
        }
      }
    },

    tick: function (dt) {
      var w = W();
      w.heart.update(dt);
      BTS.input.update();
      BTS.text.update(dt);
      BTS.menu.run();
      var it = BTS.menu.selectedItem();
      if (it) {
        w.heart.x = it.x + 8;
        w.heart.y = it.y + 12;
        var C = BTS.C, cy = BTS.util.clamp(it.y - 16, C.HEIGHT / 2, C.MENU_LAYOUT_HEIGHT - C.HEIGHT / 2);
        w.cam.y = Math.round(cy - C.HEIGHT / 2);
      }
    },

    draw: function () {
      var w = W(), g = BTS.screen.bctx, cam = w.cam;
      g.fillStyle = '#000';
      g.fillRect(0, 0, BTS.C.WIDTH, BTS.C.HEIGHT);
      w.texts.forEach(function (t) { if (t.layer === 'Menu') BTS.draw.text(t, cam); });
      if (w.menuItems.length) BTS.draw.sprite(w.heart, cam);
      BTS.touch.draw();
    }
  };

  // ----- menu functions -----
  fn.on('MenuMain', function () {
    clear();
    fn.call('MenuBackAction', '');
    header('Select your bad time');
    item(0, 'Normal', 'MenuModeNormal');
    item(1, 'Practice', 'MenuModePractice');
    item(2, 'Endless', 'MenuModeEndless');
    item(3, 'Single attack', 'MenuModeSingle');
    item(4, 'Custom attack', 'MenuModeCustom');
    item(5, 'Credits', 'MenuCredits');
  });

  fn.on('MenuModeNormal', function () { S().simulatorMode = MODE.NORMAL; BTS.goScene('battle'); });
  fn.on('MenuModePractice', function () { S().simulatorMode = MODE.PRACTICE; BTS.goScene('battle'); });

  fn.on('MenuModeEndless', function () {
    clear();
    fn.call('MenuBackAction', 'MenuMain');
    S().simulatorMode = MODE.ENDLESS;
    for (var i = 0; i <= 1; i++) item(i, 'Phase ' + (i + 1), 'MenuEndless');
  });
  fn.on('MenuEndless', function () { S().endlessStage = BTS.menu.parentId(); BTS.goScene('battle'); });

  fn.on('MenuModeSingle', function () {
    clear();
    fn.call('MenuBackAction', 'MenuMain');
    S().simulatorMode = MODE.SINGLE;
    header('Choose an attack');
    BTS.ATTACK_NAMES.forEach(function (n, i) { item(i, n, 'MenuSingleAttack'); });
  });
  fn.on('MenuSingleAttack', function () {
    S().singleAttack = BTS.ATTACK_NAMES[BTS.menu.parentId()];
    BTS.goScene('battle');
  });

  fn.on('MenuModeCustom', function () {
    var keep = BTS.menu.selectedId();
    clear();
    fn.call('MenuBackAction', 'MenuMain');
    header('Custom attack');
    S().simulatorMode = MODE.SINGLE;
    item(0, 'Documentation', '');
    item(1, 'Load file', 'MenuCustomSelect');
    item(2, 'Paste text', 'MenuCustomPaste');
    item(3, 'Run attack', S().customAttack !== null ? 'MenuCustomRun' : '');
    BTS.menu.top().id = keep;
  });
  // Rebuilds the custom menu in place after the file picker / paste box (undoing the level RunMenu pushed).
  function backToCustom() {
    var st = W().menuStack;
    if (st.length > 1) st.pop();
    fn.call('MenuModeCustom');
  }
  function loaded(text) {
    if (BTS.state.scene !== 'mainmenu') return;
    S().customAttack = text;
    backToCustom();
    notice('CUSTOM ATTACK LOADED');
  }
  fn.on('MenuCustomSelect', function () {
    backToCustom();
    BTS.customattack.openFile(loaded);
  });
  fn.on('MenuCustomPaste', function () {
    backToCustom();
    BTS.customattack.openPaste(loaded);
  });
  fn.on('MenuCustomRun', function () { S().singleAttack = 'custom'; BTS.goScene('battle'); });

  // ----- credits (new in this port) -----
  fn.on('MenuCredits', function () {
    clear();
    fn.call('MenuBackAction', 'MenuMain');
    header('Credits');
    var y = 72;
    BTS.CREDITS.forEach(function (c) {
      var sc = c.big ? 2 : 1, lineH = 16 * sc;
      var lines = BTS.draw && BTS.FONTS ? BTS.draw.wrap(BTS.FONTS.DefaultFont, c.text, 576, sc).length : 1;
      BTS.text.create('DefaultFont', 'Menu', 32, y, { w: 576, h: lines * lineH, scale: sc, text: c.text });
      y += lines * lineH + (c.gap || 6);
    });
    item(0, 'Back', 'MenuCreditsBack', Math.max(y + 8, 248));
  });
  fn.on('MenuCreditsBack', function () {
    var st = W().menuStack;
    st.pop();                       // the level RunMenu just pushed
    if (st.length > 1) st.pop();    // the credits level
    fn.call('MenuMain');
  });

  BTS.mainmenu = mainmenu;
})(window.BTS = window.BTS || {});
