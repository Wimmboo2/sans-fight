/*
 * battle.js - the battle scene: setup, per-tick order, turn flow and drawing.
 * Port of the top of Battle.xml (StartAttack / EndAttack / RunAttack, the attack order tables,
 * info text, winning, practice mode) plus the layer drawing of the BattleScreen layout.
 */
(function (BTS) {
  'use strict';

  var U, C;
  var MODE = BTS.MODE;
  function W() { return BTS.world; }
  function S() { return BTS.state; }

  // Attack order (NextAttack -> attack file) from StartAttack in Battle.xml.
  var PHASE1 = ['sans_intro', 'sans_bonegap1', 'sans_bluebone', 'sans_bonegap2', 'sans_platforms1',
    'sans_platforms2', 'sans_platforms3', 'sans_platforms4', 'sans_platformblaster', 'sans_platforms4hard',
    'sans_bonegap1fast', 'sans_boneslideh', 'sans_bonegap2', 'sans_platformblasterfast'];
  var PHASE1_RANDOM = ['sans_bonegap1fast', 'sans_bonegap2', 'sans_boneslideh', 'sans_platformblasterfast'];
  var PHASE2 = ['sans_multi1', 'sans_randomblaster1', 'sans_multi2', 'sans_bonestab1', 'sans_bonestab2',
    'sans_randomblaster2', 'sans_boneslidev', 'sans_multi3', 'sans_bonestab3'];
  var PHASE2_RANDOM = ['sans_bonestab3', 'sans_multi3', 'sans_randomblaster2'];

  function attackText(name) {
    if (name === 'custom') return S().customAttack === null ? 0 : S().customAttack;
    var t = BTS.ATTACKS[name];
    return t === undefined ? 0 : t;
  }

  var battle = {
    PHASE1: PHASE1,
    PHASE2: PHASE2,
    attackText: attackText,

    enter: function (opts) {
      U = BTS.util; C = BTS.C;
      opts = opts || {};
      var s = S();
      var w = BTS.world = {
        name: 'battle', layer0: 'Background',
        seq: 0, texts: [], menuItems: [], menuStack: [{ id: 0, back: '' }],
        bones: [], stabs: [], warns: [], platforms: [], blasters: [], shards: [], speechBubbles: [],
        menuBonesLeft: [], menuBonesBottom: [], bottomBones: { on: false, timer: 0, alternate: 0 },
        overlayOpaque: false, menuState: 0, target: null, targetChoice: null, strikes: [],
        playerItems: [], dialogSeen: {}, dialogActive: false,
        cam: { x: 0, y: 0 }
      };
      [BTS.bones, BTS.platforms, BTS.blasters, BTS.menubones].forEach(function (m) { m.init(); });
      w.zone = BTS.zone.create();
      w.heart = BTS.soul.create();
      w.sans = BTS.sans.create();
      w.buttons = [['UIFight', 32, 'MenuFight'], ['UIAct', 184, 'MenuAct'], ['UIItem', 344, 'MenuItem'],
        ['UIMercy', 496, 'MenuMercy']].map(function (b, i) {
        var sp = new BTS.Sprite(b[0], 'Default', b[1], 432);
        sp.id = i; sp.action = b[2];
        return sp;
      });
      w.hpLabel = new BTS.Sprite('HP', 'Default', 224, 416);
      w.krLabel = new BTS.Sprite('KR', 'Default', 400, 416);

      BTS.input.resetHeld();
      BTS.timeline.reset();
      BTS.damage.init();
      BTS.scheduler.clear();
      s.timeScale = 1;

      // ---- "On start of layout", in event-sheet order ----
      BTS.menu.resetStack();
      w.playerItems = BTS.ITEMS.inventory.slice();
      BTS.fn.call('TLPanic', 'BattlePanic');
      s.kr = 0; s.krT = 0;
      w.overlayOpaque = false;
      BTS.sans.setAnimation('');
      w.sans.head.setAnim('ClosedEyes', true);
      BTS.text.create('BattleFont', 'Background', 416, 400, { w: 128, h: 20, name: 'HP', text: '92 / 92' });
      BTS.text.create('BattleFont', 'Background', 32, 402, { w: 192, h: 20, name: 'PlayerName',
        text: s.name.toUpperCase() + '   LV 19' });
      if (s.simulatorMode !== MODE.NORMAL) BTS.audio.play('mus_zz_megalovania', { loop: true, tag: 'Music' });
      if (s.simulatorMode === MODE.ENDLESS && s.endlessStage === 1) {
        w.sans.legs.hitAttempts = 15;
        BTS.fn.call('SansHead', 'Default');
        BTS.fn.call('SansAnimation', 'Idle');
      }
      if (s.simulatorMode === MODE.SINGLE) {
        BTS.text.create('BattleFont', 'Background', 0, 32, { w: 640, h: 32, name: 'QuitMessage', text: "PRESS 'X' TO QUIT" });
      }
      battle.practice.attack = 0;           // (the original resets this when the layout ends)
      battle.practice.failed = 0;
      if (s.simulatorMode === MODE.PRACTICE) w.sans.legs.nextAttack = battle.practice.attack;
      BTS.touch.onBattleStart();
      if (!opts.sandbox) BTS.fn.call('StartAttack');
      w.menuState = 0;
      w.zone.speed = C.RESIZE_SPEED;
      w.zone.endResize = '';
    },

    tick: function (dt) {
      var w = W(), s = S();
      dt *= s.timeScale;

      // Behaviours (C2 ticks these before the event sheet).
      battle.eachSprite(function (sp) { sp.update(dt); });
      if (w.heart) w.heart.mover.tick(dt);
      BTS.platforms.move(dt);
      w.shards.forEach(function (sh) { sh.mover.tick(dt); });

      // Event sheet.
      BTS.input.update();
      BTS.timeline.tick(dt);
      BTS.text.update(dt);
      if (s.simulatorMode === MODE.SINGLE && BTS.input.pressed('Cancel')) {
        BTS.fn.call('TLStop');
        BTS.audio.stopAll();
        BTS.goScene('mainmenu');
      }
      BTS.battlemenu.update(dt);
      BTS.platforms.update();
      BTS.soul.update(dt);
      BTS.bones.update(dt);
      BTS.blasters.update(dt);
      BTS.menubones.update(dt);
      BTS.zone.tick(dt);
      BTS.sans.update(dt);
      BTS.damage.update(dt);
      BTS.sans.updateShake(dt);
      battle.practice.update();
      w.shards.forEach(function (sh) { sh.mover.accelerate(300, 90, dt); });
      var hp = BTS.text.byName('HP');
      hp.forEach(function (t) {
        t.text = U.zeropad(Math.round(s.hp), 2) + ' / ' + s.maxHp;
        t.tint = s.kr > 0 ? C.TINT.KARMA_TEXT : null;
      });
      w.cam.x = w.sans.shake.x;
      w.cam.y = w.sans.shake.y;
    },

    eachSprite: function (f) {
      var w = W(), sn = w.sans;
      [w.heart, sn.legs, sn.torso, sn.body, sn.head, sn.sweat, w.target, w.targetChoice].forEach(function (sp) { if (sp) f(sp); });
      w.strikes.slice().forEach(f);
      w.blasters.forEach(f);
      w.shards.forEach(f);
      w.speechBubbles.forEach(f);
    },

    // ---------------- drawing ----------------
    draw: function () {
      var w = W(), s = S(), D = BTS.draw, cam = w.cam, g = BTS.screen.bctx;
      g.fillStyle = '#000';
      g.fillRect(0, 0, C.WIDTH, C.HEIGHT);
      var texts = function (layer) { w.texts.forEach(function (t) { if (t.layer === layer) D.text(t, cam); }); };

      // Background layer: HP bar and labels.
      texts('Background');
      var bgW = Math.floor(s.maxHp * 1.2), bgX = 256, bgY = 400, bgH = 21;
      D.tiled({ tex: 'HPBackground', x: bgX, y: bgY, w: bgW, h: bgH }, cam);
      D.tiled({ tex: 'HPBar', x: bgX, y: bgY, w: Math.round(bgW * s.hp / s.maxHp), h: bgH }, cam);
      if (s.kr > 0) {
        D.tiled({ tex: 'KRBar', x: bgX + Math.round(bgW * (s.hp - s.kr) / s.maxHp), y: bgY,
          w: Math.ceil(bgW * s.kr / s.maxHp), h: bgH }, cam);
      }
      D.sprite(w.hpLabel, cam);
      D.sprite(w.krLabel, cam);

      // Enemies layer.
      var sn = w.sans;
      [sn.legs, sn.torso, sn.body, sn.head, sn.sweat].forEach(function (sp) { D.sprite(sp, cam); });
      w.strikes.forEach(function (sp) { D.sprite(sp, cam); });
      w.speechBubbles.forEach(function (sp) { D.sprite(sp, cam); });
      texts('Enemies');

      // Buttons layer.
      w.buttons.forEach(function (sp) { D.sprite(sp, cam); });

      // CombatZone layer.
      w.platforms.slice().reverse().forEach(function (p) {
        D.ninePatch({ tex: 'Platform2', x: p.x, y: p.y - 4, w: p.w, h: 7, m: [4, 4, 2, 2] }, cam);
        D.ninePatch({ tex: 'Platform1', x: p.x, y: p.y, w: p.w, h: 7, m: [4, 4, 2, 2] }, cam);
      });
      if (w.heart.layer === 'CombatZone') D.sprite(w.heart, cam);
      w.bones.forEach(function (b) { if (!b.clipped) battle.drawBone(b, cam); });
      w.warns.forEach(function (wn) {
        D.ninePatch({ tex: 'BoneStabWarn', x: wn.x, y: wn.y, w: wn.w, h: wn.h, m: [4, 4, 4, 4] }, cam);
      });
      w.blasters.forEach(function (b) {
        if (b.beam.visible) {
          if (b.hit.visible) D.tiled({ tex: 'GasterBlastHit', x: b.hit.x, y: b.hit.y, w: b.hit.w, h: b.hit.h, angle: b.hit.angle, hx: 0, hy: 0.5 }, cam);
          (b.pieces || []).forEach(function (pc) { D.tiled(pc, cam); });
        }
        D.sprite(b, cam);
      });
      if (w.target) D.sprite(w.target, cam);
      if (w.targetChoice) D.sprite(w.targetChoice, cam);
      w.menuBonesLeft.concat(w.menuBonesBottom).forEach(function (m) { D.sprite(m, cam); });
      texts('CombatZone');

      // CombatZoneClipped layer: vertical bones and bone stabs, clipped to the box.
      var z = w.zone;
      g.save();
      g.beginPath();
      g.rect(Math.round(z.x) - cam.x, Math.round(z.y) - cam.y, Math.round(z.w), Math.round(z.h));
      g.clip();
      w.bones.filter(function (b) { return b.clipped; }).concat(w.stabs)
        .sort(function (a, b) { return b.seq - a.seq; })
        .forEach(function (b) { battle.drawBone(b, cam); });
      g.restore();

      // Overlay layer.
      if (w.overlayOpaque) { g.fillStyle = '#000'; g.fillRect(0, 0, C.WIDTH, C.HEIGHT); }
      if (z.visible) D.ninePatch({ tex: 'CombatZone', x: z.x, y: z.y, w: z.w, h: z.h, m: [5, 5, 5, 5], fill: 'none' }, cam);
      if (w.heart.layer === 'Overlay') D.sprite(w.heart, cam);
      w.shards.forEach(function (sp) { D.sprite(sp, cam); });
      texts('Overlay');
      if (C.DEBUG_HITBOX && w.heart.visible) {
        var hb = BTS.damage.hitbox();
        g.fillStyle = 'rgba(0,255,0,0.6)';
        if (C.SOUL_HITBOX.mode === 'point') g.fillRect(Math.round(w.heart.x) - cam.x, Math.round(w.heart.y) - cam.y, 1, 1);
        else g.fillRect(hb.l - cam.x, hb.t - cam.y, hb.r - hb.l, hb.b - hb.t);
      }

      // Touch layer (not shaken).
      BTS.touch.draw();
    },

    drawBone: function (b, cam) {
      var tint = b.color === 1 ? C.TINT.BLUE_ATTACK : (b.color === 2 ? C.TINT.ORANGE_ATTACK : null);
      var o;
      if (b.type === 'stab') {
        o = b.kind === 'V' ? { tex: 'BoneStabV', m: [0, 0, 6, 6] } : { tex: 'BoneStabH', m: [6, 6, 0, 0] };
      } else {
        o = b.kind === 'V' ? { tex: 'BoneV', m: [0, 0, 6, 6] } : { tex: 'BoneH', m: [6, 6, 0, 0] };
      }
      o.x = b.x; o.y = b.y; o.w = b.w; o.h = b.h; o.edges = 'tile'; o.fill = 'tile'; o.tint = tint;
      BTS.draw.ninePatch(o, cam);
    },

    // ---------------- turn flow ----------------
    resetVars: function () {
      var w = W();
      BTS.fn.call('CombatZoneSpeed', C.RESIZE_SPEED);
      BTS.fn.call('HeartMode', w.heart.mode);
      BTS.fn.call('HeartMaxFallSpeed', C.HEART_MAX_FALL_SPEED);
      BTS.fn.call('SansSlamDamage', 0);
      w.sans.legs.xSpeed = 0;
      w.sans.legs.x = 320;
    },

    runAttack: function (name) { BTS.fn.call('TLPlay', attackText(name)); },

    // Which attack this turn is, without side effects. Returns {name, key, advance}.
    chooseAttack: function () {
      var legs = W().sans.legs, h = legs.hitAttempts, n = legs.nextAttack;
      if (S().simulatorMode === MODE.SINGLE) return { name: S().singleAttack, key: null };
      if (h < 13) {
        if (n < PHASE1.length) return { name: PHASE1[n], key: 'phase1:' + n, advance: true };
        if (n === 14) return { name: BTS.rng.choose(PHASE1_RANDOM), key: 'phase1:14' };
        return { name: null, key: null };
      }
      if (h === 13) return { name: 'sans_spare', key: 'spare' };
      if (h <= 22) {
        if (n < PHASE2.length) return { name: PHASE2[n], key: 'phase2:' + n, advance: true };
        if (n === 9) return { name: BTS.rng.choose(PHASE2_RANDOM), key: 'phase2:9' };
        return { name: null, key: null };
      }
      return { name: 'sans_final', key: 'final' };
    },

    startAttack: function () {
      var w = W(), s = S();
      w.heart.mover.enabled = true;
      w.heart.mover.stop();
      battle.resetVars();
      BTS.fn.call('MenuBonesOff');
      var choice = battle.chooseAttack();
      var lines = battle.dialogFor(choice.key);
      if (lines.length) {
        // Fix: sans talks before the attack (lines come from js/data/sans-dialog.js).
        w.dialogActive = true;
        w.heart.mover.enabled = false;
        battle.sayLines(lines, function () {
          w.dialogActive = false;
          w.heart.mover.enabled = true;
          battle.runChoice(choice);
        });
      } else {
        battle.runChoice(choice);
      }
      if (s.simulatorMode === MODE.PRACTICE) {
        s.hp = s.maxHp; s.kr = 0; battle.practice.failed = 0;
      }
    },

    runChoice: function (choice) {
      var w = W(), s = S(), legs = w.sans.legs;
      if (s.simulatorMode === MODE.SINGLE) {
        BTS.fn.call('SansAnimation', 'Idle');
        w.sans.head.setAnim('Default', true);
        battle.runAttack(s.singleAttack);
        return;
      }
      var h = legs.hitAttempts;
      if (h === 13) {
        battle.runAttack('sans_spare');
        BTS.fn.call('SansSweat', 2);
        legs.nextAttack = 0;
        BTS.audio.setPaused('Music', true);
        return;
      }
      if (h > 13 && h <= 22) BTS.audio.stop('Music2');
      if (choice.name) battle.runAttack(choice.name);
      if (choice.advance) legs.nextAttack += 1;
    },

    endAttack: function () {
      var w = W(), s = S(), legs = w.sans.legs, h = legs.hitAttempts;
      BTS.attacks.clear();
      BTS.fn.call('BattleMenuEnable', 1);
      w.heart.visible = true;
      w.heart.mover.enabled = false;
      battle.resetVars();
      w.overlayOpaque = false;

      BTS.fn.call('SansAnimation', 'Idle');
      w.sans.head.setAnim('Default', true);
      w.sans.torso.setAnim('Default', true);
      var info = BTS.ITEMS.infoText;
      if (s.kr >= 0) w.zone.infoText = info.kr0;
      if (s.kr >= 10) w.zone.infoText = info.kr10;
      if (s.kr >= 20) w.zone.infoText = info.kr20;
      if (h < 13 && legs.nextAttack === 1) {
        w.zone.infoText = info.badTime;
        if (!BTS.audio.isTagPlaying('Music')) BTS.audio.play('mus_zz_megalovania', { loop: true, tag: 'Music' });
      }
      if (h !== 13) BTS.audio.setPaused('Music', false);
      if (info['hit' + h] !== undefined) w.zone.infoText = info['hit' + h];
      if (h > 22) {
        BTS.fn.call('BattleMenuEnable', 0);
        var z = BTS.zone.rect();
        BTS.fn.call('CombatZoneResize', z.l, z.t, z.r, z.b);
        BTS.fn.call('SansAnimation', 'Tired');
        w.sans.head.setAnim('Tired2', true);
        BTS.audio.stopAll();
        battle.sayLines(BTS.SANS_DIALOG.win || [], function () { BTS.goScene('mainmenu'); });
      }
      if (h > 13 && h !== 16 && h !== 17 && h <= 22) BTS.fn.call('MenuBoneLeft');
      if (h > 15 && h <= 22) BTS.fn.call('MenuBoneBottom');
    },

    // ---------------- sans dialog (fix #3) ----------------
    dialogFor: function (key) {
      var D = BTS.SANS_DIALOG, w = W();
      if (!key || !D || !C.DIALOG_ENABLED) return [];
      var modeName = ['normal', 'endless', 'single', 'practice'][S().simulatorMode];
      if ((D.modes || ['normal']).indexOf(modeName) < 0) return [];
      if (D.once !== false && w.dialogSeen[key]) return [];
      var parts = key.split(':'), lines = parts.length === 2 ? (D[parts[0]] || {})[parts[1]] : D[key];
      if (!lines || !lines.length) return [];
      w.dialogSeen[key] = true;
      return lines;
    },

    sayLines: function (lines, done) {
      var i = 0, head = W().sans.head, prevHead = head.animName;
      var next = function () {
        if (i >= lines.length) {
          W().speechBubbles.length = 0;
          if (head.animName !== prevHead) head.setAnim(prevHead, true);
          done();
          return;
        }
        var line = lines[i++];
        var text = typeof line === 'string' ? line : (line.text || '');
        if (line && line.head) head.setAnim(line.head, true);
        W().speechBubbles.length = 0;
        battle._dialogNext = next;
        BTS.text.sansText(text, '_DialogNext');
      };
      next();
    },

    // ---------------- practice mode ("PracticeMode" group) ----------------
    practice: {
      attack: 0,
      failed: 0,
      update: function () {
        var s = S(), w = W(), legs = w.sans.legs;
        if (s.simulatorMode !== MODE.PRACTICE) return;
        legs.nextAttack = battle.practice.attack;
        if (!w.heart.slamDamage && BTS.timeline.isRunning() > 0) {
          var target = s.practiceTarget;
          if (legs.hitAttempts > 22) target = 2;
          if (s.hp - s.kr < target) {
            if (legs.hitAttempts > 22) legs.hitAttempts = 22;
            battle.practice.failed = 1;
            BTS.fn.call('EndAttack');
          }
        }
      },
      onEnd: function () {
        var s = S(), legs = W().sans.legs, p = battle.practice;
        if (s.simulatorMode !== MODE.PRACTICE) return;
        if (p.failed === 0) {
          p.attack += 1;
          BTS.text.create('DamageFont', 'Background', 16, 16, { w: 256, h: 32, text: 'SUCCESS', timeout: 1, tint: C.TINT.GREEN });
          if (legs.hitAttempts < 13 && p.attack === 14) { legs.hitAttempts = 14; p.attack = 0; }
          if (legs.hitAttempts > 13 && p.attack > 9) p.attack = 9;
        } else {
          BTS.text.create('DamageFont', 'Background', 16, 16, { w: 256, h: 32, text: 'FAILURE', timeout: 1, tint: C.TINT.RED_HEART });
        }
        if (legs.hitAttempts > 13 && p.attack === 9) legs.hitAttempts = 23;
      }
    }
  };

  // ---------------- registered functions ----------------
  var fn = BTS.fn;
  fn.on('StartAttack', function () { battle.startAttack(); });
  fn.on('EndAttack', function () { battle.endAttack(); });
  fn.on('EndAttack', function () { battle.practice.onEnd(); });
  fn.on('RunAttack', function (n) { battle.runAttack(n); });
  fn.on('ResetVars', function () { battle.resetVars(); });
  fn.on('_DialogNext', function () { if (battle._dialogNext) battle._dialogNext(); });
  fn.on('BattlePanic', function (msg) {
    BTS.text.destroyWhere(function (t) { return t.name === 'Error'; });
    BTS.text.create('BattleFont', 'Overlay', 0, 0, { w: 640, h: 20, name: 'Error', timeout: 3, text: String(msg).toUpperCase() });
    fn.call('EndAttack');
  });
  fn.on('MenuBonesOff', function () { BTS.menubones.off(); });
  fn.on('MenuBoneLeft', function () { BTS.menubones.left(); });
  fn.on('MenuBoneBottom', function () { BTS.menubones.bottom(); });
  fn.on('DamagePlayer', function (d, k) { BTS.damage.damagePlayer(d, k); });
  fn.on('HeartJump', function () { BTS.soul.jump(); });
  fn.on('HeartCheckSolid', function (x, y) { return BTS.soul.checkSolid(U.toFloat(x), U.toFloat(y)); });

  BTS.battle = battle;
})(window.BTS = window.BTS || {});
