/*
 * sans.js - Sans himself: body parts, idle animations, dodge, scrolling ("SansRepeat") and screen shake.
 * Port of the "SansAnimation" and "SansShake" groups of Battle.xml.
 */
(function (BTS) {
  'use strict';

  var U;
  function W() { return BTS.world; }

  var sans = {
    create: function () {
      U = BTS.util;
      var legs = new BTS.Sprite('SansLegs', 'Standing', 320, 224);
      var torso = new BTS.Sprite('SansTorso', 'Default', 320, 176);
      var body = new BTS.Sprite('SansBody', 'HandDown', 320, -16);
      var head = new BTS.Sprite('SansHead', 'Default', 320, 128);
      var sweat = new BTS.Sprite('SansSweat', 'Sweat1', 320, -176);
      body.visible = false;
      sweat.visible = false;
      [torso, head].forEach(function (s) { s.t = 0; s.offsetX = 0; s.offsetY = 0; });
      legs.nextAttack = 0; legs.hitAttempts = 0; legs.dodgeState = 0; legs.dodgeTimer = 0;
      legs.justDodged = false; legs.xSpeed = 0;
      return {
        legs: legs, torso: torso, body: body, head: head, sweat: sweat,
        animation: '',
        shake: { cx: 320, cy: 240, intensity: 0, timer: 0, x: 0, y: 0 }
      };
    },

    // ----- timeline / event functions -----
    setAnimation: function (name) {
      var s = W().sans;
      s.body.visible = false; s.legs.visible = true; s.torso.visible = true;
      s.animation = name === undefined || name === null || name === 0 ? '' : String(name);
    },
    setBody: function (name) {
      var s = W().sans;
      s.animation = '';
      s.body.visible = true; s.legs.visible = false; s.torso.visible = false;
      s.body.setAnim(name, true);
    },
    setTorso: function (name) {
      var s = W().sans;
      s.body.visible = false; s.legs.visible = true; s.torso.visible = true;
      s.torso.setAnim(name, true);
    },
    setHead: function (name) { W().sans.head.setAnim(name, true); },
    setSweat: function (level) {
      var s = W().sans, n = U.toInt(level);
      if (n === 0) s.sweat.visible = false;
      if (n > 0) { s.sweat.visible = true; s.sweat.setAnim('Sweat' + level, true); }
    },
    setX: function (x) { W().sans.legs.x = U.toInt(x); },
    repeat: function () { W().sans.legs.xSpeed = BTS.C.SANS_REPEAT_SPEED; },
    endRepeat: function () { W().sans.legs.xSpeed = 0; },
    shake: function (n) {
      var sh = W().sans.shake;
      sh.intensity = U.toInt(n);
      sh.timer = 0;
    },

    // ----- per-tick (SansAnimation group) -----
    update: function (dt) {
      var s = W().sans, legs = s.legs, z = W().zone, C = BTS.C;

      if (legs.xSpeed !== 0) {
        legs.y = z.y - 16;
        legs.x += legs.xSpeed * dt;
        legs.xSpeed -= C.SANS_REPEAT_DECEL * dt;
        if (legs.x < -100) {
          legs.x = 740;
          s.head.setAnim(BTS.rng.choose(['Default', 'LookLeft', 'Wink', 'ClosedEyes', 'NoEyes']), true);
          s.torso.setAnim(BTS.rng.choose(['Default', 'Default', 'Default', 'Shrug']), true);
        }
      } else {
        legs.y = z.targetT - 16;
      }

      if (legs.dodgeState !== 0) legs.dodgeTimer += dt;
      if (legs.dodgeState === 1) {
        legs.x = 320 - U.sin(legs.dodgeTimer * 225) * 100;
        if (legs.dodgeTimer >= 0.4) {
          legs.x = 220;
          legs.dodgeState = 2;
          legs.dodgeTimer = 0;
          BTS.scheduler.wait(0.6, function () {
            BTS.text.create('DamageFont', 'Enemies', 272, 50, { w: 176, h: 32, text: 'MISS', timeout: 1.5, tint: C.TINT.GREY_TEXT });
          });
        }
      }
      if (legs.dodgeState === 2 && legs.dodgeTimer >= 1.1) {
        legs.dodgeState = 3;
        legs.dodgeTimer = 0;
      }
      if (legs.dodgeState === 3) {
        legs.x = 320 - U.cos(legs.dodgeTimer * 225) * 100;
        if (legs.dodgeTimer >= 0.4) {
          legs.x = 320;
          legs.dodgeState = 0;
          legs.dodgeTimer = 0;
          legs.hitAttempts += 1;
          legs.justDodged = true;
          W().targetChoice = null;
          if (W().target) W().target.state = 2;
          BTS.fn.call('StartAttack');
        }
      }

      var torso = s.torso, head = s.head, a = s.animation;
      if (a !== '') { torso.t += dt; head.t += dt; }
      if (a === 'Idle') {
        if (torso.t > 1.2) torso.t -= 1.2;
        if (head.t > 1.2) head.t -= 1.2;
        torso.offsetX = U.sin(360 * torso.t / 1.2);
        torso.offsetY = U.sin(720 * torso.t / 1.2);
        head.offsetY = -U.sin(720 * head.t / 1.2) * 0.4;
      }
      if (a === 'HeadBob') {
        if (head.t > 1.1) head.t -= 1.1;
        head.offsetX = U.sin(360 * head.t / 1.1);
        head.offsetY = U.sin(720 * head.t / 1.1);
      }
      if (a === 'Tired') {
        if (torso.t > 3.8) torso.t -= 3.8;
        if (head.t > 3.8) head.t -= 3.8;
        torso.offsetY = U.sin(360 * torso.t / 3.8);
        head.offsetY = U.sin(360 * head.t / 3.8);
      }
      if (a === '') {
        torso.t = 0; torso.offsetX = 0; torso.offsetY = 0;
        head.t = 0; head.offsetX = 0; head.offsetY = 0;
      }

      if (head.animName === 'BlueEye' && head.playing) head.stopAnim();
      if (head.animName === 'BlueEye') head.setFrame(Math.floor(BTS.rng.range(2)));

      var tp = legs.imagePoint('Torso');
      torso.x = tp.x + torso.offsetX;
      torso.y = tp.y + torso.offsetY;
      s.body.x = legs.x;
      s.body.y = legs.y;
      var hp;
      if (s.body.visible) { hp = s.body.imagePoint('Head'); head.x = hp.x; head.y = hp.y; }
      if (torso.visible) { hp = torso.imagePoint('Head'); head.x = hp.x + head.offsetX; head.y = hp.y + head.offsetY; }
      var sp = head.imagePoint('Sweat');
      s.sweat.x = sp.x; s.sweat.y = sp.y;
    },

    // ----- per-tick (SansShake group); returns the camera offset -----
    updateShake: function (dt) {
      var sh = W().sans.shake;
      if (sh.intensity > 0) sh.timer += dt;
      else { sh.x = 0; sh.y = 0; }
      if (sh.timer >= BTS.C.SHAKE_STEP) {
        sh.timer -= BTS.C.SHAKE_STEP;
        sh.intensity -= 1;
        sh.x = sh.intensity * BTS.rng.choose([1, -1]);
        sh.y = sh.intensity * BTS.rng.choose([1, -1]);
      }
    }
  };

  BTS.sans = sans;
})(window.BTS = window.BTS || {});
