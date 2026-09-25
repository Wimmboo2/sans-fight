/*
 * commands.js - every function an attack script can call, registered under its original name.
 * (Battle flow functions like StartAttack/EndAttack live in js/battle/battle.js.)
 */
(function (BTS) {
  'use strict';

  var fn = BTS.fn, tl = BTS.timeline, U = BTS.util;
  function W() { return BTS.world; }
  function f(v) { return U.toFloat(v); }

  // Removes every attack object (C2: destroy Attack9Patch + AttackSprite, which takes the beams with it).
  BTS.attacks = {
    clear: function () {
      var w = W();
      w.bones.length = 0; w.stabs.length = 0; w.warns.length = 0; w.platforms.length = 0;
      w.blasters.length = 0; w.menuBonesLeft.length = 0; w.menuBonesBottom.length = 0;
    }
  };

  // ----- timeline control -----
  fn.on('TLPlay', function (text) { tl.play(text); });
  fn.on('TLPause', function () { tl.pause(); });
  fn.on('TLResume', function () { tl.resume(); });
  fn.on('TLStop', function () { tl.stop(); });
  fn.on('TLIsRunning', function () { return tl.isRunning(); });
  fn.on('TLPanic', function (name) { tl.setPanic(name); });

  // ----- variables and maths ("TimelineCPU") -----
  var V = function () { return tl.vars; };
  fn.on('SET', function (k, v) { V()[k] = v; });
  fn.on('ADD', function (k, a, b) { V()[k] = f(a) + f(b); });
  fn.on('SUB', function (k, a, b) { V()[k] = f(a) - f(b); });
  fn.on('MUL', function (k, a, b) { V()[k] = f(a) * f(b); });
  fn.on('DIV', function (k, a, b) { V()[k] = f(a) / f(b); });
  fn.on('MOD', function (k, a, b) { V()[k] = f(a) % f(b); });
  fn.on('FLOOR', function (k, a) { V()[k] = Math.floor(f(a)); });
  fn.on('DEG', function (k, a) { V()[k] = f(a) * 180 / Math.PI; });
  fn.on('RAD', function (k, a) { V()[k] = f(a) * Math.PI / 180; });
  fn.on('SIN', function (k, a) { V()[k] = U.sin(f(a)); });
  fn.on('COS', function (k, a) { V()[k] = U.cos(f(a)); });
  fn.on('ANGLE', function (k, x1, y1, x2, y2) { V()[k] = U.angle(f(x1), f(y1), f(x2), f(y2)); });
  fn.on('RND', function (k, n) { V()[k] = Math.floor(BTS.rng.range(U.toInt(n))); });
  fn.on('GetHeartPos', function (kx, ky) { V()[kx] = W().heart.x; V()[ky] = W().heart.y; });

  // ----- jumps -----
  fn.on('JMPABS', function (t) { tl.jumpAbs(t); });
  fn.on('JMPREL', function (n) { tl.line += U.toInt(n) - 1; });
  fn.on('JMPZ', function (t, a) { if (f(a) === 0) tl.jumpAbs(t); });
  fn.on('JMPNZ', function (t, a) { if (f(a) !== 0) tl.jumpAbs(t); });
  fn.on('JMPE', function (t, a, b) { if (f(a) === f(b)) tl.jumpAbs(t); });
  fn.on('JMPNE', function (t, a, b) { if (f(a) !== f(b)) tl.jumpAbs(t); });
  fn.on('JMPL', function (t, a, b) { if (f(a) < f(b)) tl.jumpAbs(t); });
  fn.on('JMPNL', function (t, a, b) { if (f(a) >= f(b)) tl.jumpAbs(t); });
  fn.on('JMPG', function (t, a, b) { if (f(a) > f(b)) tl.jumpAbs(t); });
  fn.on('JMPNG', function (t, a, b) { if (f(a) <= f(b)) tl.jumpAbs(t); });
  fn.on('Debug', function () { BTS.state.timeScale = 0; });

  // ----- generalities -----
  fn.on('BlackScreen', function (v) {
    var w = W();
    if (U.toInt(v) === 1) {
      w.overlayOpaque = true;
      w.zone.visible = false;
      BTS.audio.setPaused('Music', true);
      BTS.attacks.clear();
    }
    if (U.toInt(v) === 0) {
      w.overlayOpaque = false;
      BTS.audio.setPaused('Music', false);
      w.zone.visible = true;
    }
  });
  fn.on('Sound', function (name, rate) {
    if (BTS.audio.isMusic(name)) return;           // "Sound" only plays from the sounds folder
    BTS.audio.play(name);
    if (rate !== '' && rate !== undefined) BTS.audio.setRate('', f(rate));
  });
  fn.on('Music', function (name) {
    if (!BTS.audio.isMusic(name)) return;
    BTS.audio.play(name, { loop: true, tag: 'Music' });
  });

  // ----- attacks -----
  fn.on('BoneH', function (x, y, w, d, s, c) { BTS.bones.boneH(x, y, w, d, s, c); });
  fn.on('BoneV', function (x, y, h, d, s, c) { BTS.bones.boneV(x, y, h, d, s, c); });
  fn.on('BoneHRepeat', function (x, y, w, d, s, n, sp) { BTS.bones.repeat('H', x, y, w, d, s, n, sp); });
  fn.on('BoneVRepeat', function (x, y, h, d, s, n, sp) { BTS.bones.repeat('V', x, y, h, d, s, n, sp); });
  fn.on('SineBones', function (n, sp, s, h) { BTS.bones.sineBones(n, sp, s, h); });
  fn.on('BoneStab', function (d, dist, warn, stay) { BTS.bones.boneStab(d, dist, warn, stay); });
  fn.on('GasterBlaster', function (size, x, y, ex, ey, ea, st, bt) { BTS.blasters.create(size, x, y, ex, ey, ea, st, bt); });
  fn.on('Platform', function (x, y, w, d, s, r, a) { BTS.platforms.create(x, y, w, d, s, r, a); });
  fn.on('PlatformRepeat', function (x, y, w, d, s, n, sp) { BTS.platforms.repeat(x, y, w, d, s, n, sp); });

  // ----- soul -----
  fn.on('HeartMode', function (m) { BTS.soul.setMode(m); });
  fn.on('HeartTeleport', function (x, y) { BTS.soul.teleport(x, y); });
  fn.on('HeartMaxFallSpeed', function (v) { BTS.soul.maxFallSpeed = U.toInt(v); });
  fn.on('SansSlam', function (d) { var n = f(d); if (n >= 0 && n <= 3) BTS.soul.slam(d); });
  fn.on('SansSlamDamage', function (v) { W().heart.slamDamage = U.toInt(v) !== 0; });

  // ----- sans -----
  fn.on('SansAnimation', function (n) { BTS.sans.setAnimation(n); });
  fn.on('SansBody', function (n) { BTS.sans.setBody(n); });
  fn.on('SansTorso', function (n) { BTS.sans.setTorso(n); });
  fn.on('SansHead', function (n) { BTS.sans.setHead(n); });
  fn.on('SansSweat', function (n) { BTS.sans.setSweat(n); });
  fn.on('SansX', function (x) { BTS.sans.setX(x); });
  fn.on('SansRepeat', function () { BTS.sans.repeat(); });
  fn.on('SansEndRepeat', function () { BTS.sans.endRepeat(); });
  fn.on('SansShake', function (n) { BTS.sans.shake(n); });
  fn.on('SansText', function (t, end) { BTS.text.sansText(t, end); });
  fn.on('EndSansText', function () { BTS.text.endSansText(); });

  // ----- combat zone -----
  fn.on('CombatZoneSpeed', function (s) { BTS.zone.setSpeed(s); });
  fn.on('CombatZoneResize', function (l, t, r, b, fin) { BTS.zone.resize(l, t, r, b, fin); });
  fn.on('CombatZoneResizeInstant', function (l, t, r, b) { BTS.zone.resizeInstant(l, t, r, b); });
  fn.on('CombatZoneResizeAuto', function (l, t, r, b) {
    if (BTS.C.FIXES.resizeAutoAlias) BTS.zone.resizeInstant(l, t, r, b);
  });
  fn.on('CombatZoneTick', function () { BTS.zone.tick(BTS.state.dt); });
})(window.BTS = window.BTS || {});
