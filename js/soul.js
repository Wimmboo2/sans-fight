/*
 * soul.js - the player's heart: red mode (free movement) and blue mode (gravity, jumping, slams, platforms).
 * Port of the "PlayerMovement" group of Battle.xml. Movement itself is the C2-style StepMover.
 */
(function (BTS) {
  'use strict';

  var C, U;
  var RED = 0, BLUE = 1;

  function W() { return BTS.world; }

  // ---------- collision helpers ----------

  function heartBox(h, ox, oy) {
    var half = C.HEART_SIZE / 2;
    return { l: h.x - half + ox, r: h.x + half + ox, t: h.y - half + oy, b: h.y + half + oy };
  }

  // The four 5 px border walls around the combat zone (the C2 "CombatZoneBorder" solids).
  function borders() {
    var z = W().zone, B = C.ZONE_BORDER;
    return [
      { l: z.x, t: z.y, r: z.x + z.w, b: z.y + B },
      { l: z.x, t: z.y, r: z.x + B, b: z.y + z.h },
      { l: z.x, t: z.y + z.h - B, r: z.x + z.w, b: z.y + z.h },
      { l: z.x + z.w - B, t: z.y, r: z.x + z.w, b: z.y + z.h }
    ];
  }

  // C2 overlap tests count touching edges as overlapping (this is what makes issue #93 happen).
  function overlaps(a, b) { return U.rectsOverlap(a, b, false); }

  function platformRect(p) { return { l: p.x, t: p.y, r: p.x + p.w, b: p.y + p.h }; }

  // One-way platform test from HeartCheckSolid, for the heart's current gravity angle.
  function platformSolidFor(h, p, angle) {
    var hb = heartBox(h, 0, 0), pr = platformRect(p), m = h.mover, pm = p.mover;
    if (U.angleWithin(angle, 0, 0.5)) return p.x > h.x && m.dx >= pm.dx && hb.r <= pr.l + 2;
    if (U.angleWithin(angle, 90, 0.5)) return p.y > h.y && m.dy >= pm.dy && hb.b <= pr.t + 2;
    if (U.angleWithin(angle, 180, 0.5)) return p.x < h.x && m.dx <= pm.dx && hb.l >= pr.r - 2;
    if (U.angleWithin(angle, 270, 0.5)) return p.y < h.y && m.dy <= pm.dy && hb.t >= pr.b - 2;
    return false;
  }

  // HeartCheckSolid(ox, oy): 1 if the heart, moved by (ox, oy), touches a wall or a platform it can stand on.
  function checkSolid(ox, oy) {
    var h = W().heart, box = heartBox(h, ox, oy), bs = borders(), i;
    for (i = 0; i < bs.length; i++) if (overlaps(box, bs[i])) return 1;
    var ps = W().platforms;
    for (i = 0; i < ps.length; i++) {
      if (overlaps(box, platformRect(ps[i])) && platformSolidFor(h, ps[i], h.angle)) return 1;
    }
    return 0;
  }

  function platformsAt(ox, oy) {
    var h = W().heart, box = heartBox(h, ox, oy), out = [];
    W().platforms.forEach(function (p) { if (overlaps(box, platformRect(p))) out.push(p); });
    return out;
  }

  // ---------- step callbacks (C2 "On horizontal/vertical step") ----------

  function slamImpact(speed) {
    var h = W().heart;
    h.slammed = false;
    if (Math.abs(speed) >= C.SLAM_SOUND_MIN_SPEED) {
      BTS.audio.play('PlayerDamaged');
      BTS.audio.play('Slam');
      BTS.fn.call('SansShake', Math.floor(Math.abs(speed) / 30 / 3));
      if (h.slamDamage && BTS.state.hp > 1) BTS.state.hp -= 1;
    }
  }

  function slamIsHorizontal(h) { return U.angleWithin(h.angle, 0, 0.5) || U.angleWithin(h.angle, 180, 0.5); }

  function onHStep() {
    var h = W().heart, m = h.mover;
    if (!checkSolid(0, 0)) return;
    if (h.slammed && (!C.FIXES.slamOwnAxis || slamIsHorizontal(h))) slamImpact(m.dx);
    if (m.dx < 0) { m.dx = 0; m.stopStepping(); }
    if (m.dx > 0) { m.dx = 0; m.stopStepping(); }
  }

  function onVStep() {
    var h = W().heart, m = h.mover;
    if (!checkSolid(0, 0)) return;
    if (h.slammed && (!C.FIXES.slamOwnAxis || !slamIsHorizontal(h))) slamImpact(m.dy);
    if (m.dy < 0) { m.dy = 0; m.stopStepping(); }
    if (m.dy > 0) { m.dy = 0; m.stopStepping(); }
  }

  // ---------- public ----------

  var soul = {
    RED: RED,
    BLUE: BLUE,
    maxFallSpeed: 750,

    create: function () {
      C = BTS.C; U = BTS.util;
      var h = new BTS.Sprite('PlayerHeart', 'Default', 320, 320);
      h.visible = false;
      h.angle = 90;
      h.mode = RED;
      h.slammed = false;
      h.slamDamage = false;
      h.layer = 'CombatZone';
      h.tint = C.TINT.RED_HEART;
      h.mover = new BTS.StepMover(h, { mode: 'hv', pxPerStep: C.HEART_STEP_PX, onHStep: onHStep, onVStep: onVStep });
      soul.maxFallSpeed = C.HEART_MAX_FALL_SPEED;
      return h;
    },

    checkSolid: checkSolid,
    heartBox: heartBox,
    borders: borders,

    setMode: function (mode) {
      var h = W().heart;
      mode = U.toInt(mode);
      if (mode === RED) {
        h.mode = RED; h.angle = 90; h.tint = C.TINT.RED_HEART;
      } else if (mode === BLUE) {
        h.mode = BLUE; h.angle = 90; h.tint = C.TINT.BLUE_HEART;
      }
    },

    teleport: function (x, y) {
      var h = W().heart;
      h.x = U.toInt(x);
      h.y = U.toInt(y);
      h.visible = true;
      if (C.FIXES.teleportResetsVelocity) h.mover.stop();
    },

    slam: function (dir) {
      var h = W().heart;
      soul.setMode(BLUE);
      h.slammed = true;
      h.angle = Math.floor(U.toFloat(dir)) * 90;
      h.mover.dx = U.cos(h.angle) * soul.maxFallSpeed;
      h.mover.dy = U.sin(h.angle) * soul.maxFallSpeed;
    },

    jump: function () {
      var h = W().heart, m = h.mover;
      if (h.mode !== BLUE) return;
      var X = U.cos(h.angle), Y = U.sin(h.angle);
      if (checkSolid(X, Y) !== 1) return;
      if (!C.FIXES.jumpSetsVelocity) {
        m.dx = m.dx - X * C.HEART_JUMP_STRENGTH;
        m.dy = m.dy - Y * C.HEART_JUMP_STRENGTH;
        return;
      }
      // Fix #159: set the speed along gravity instead of adding to it (relative to a platform underneath).
      var base = 0;
      platformsAt(X, Y).forEach(function (p) {
        if (platformSolidFor(h, p, h.angle)) base = p.mover.dx * X + p.mover.dy * Y;
      });
      var along = m.dx * X + m.dy * Y, want = base - C.HEART_JUMP_STRENGTH;
      m.dx += (want - along) * X;
      m.dy += (want - along) * Y;
    },

    // Per-tick event logic (runs after the behaviour movement, like the C2 event sheet).
    update: function (dt) {
      var h = W().heart, m = h.mover, pad = BTS.input.pad;
      var speed = pad.Cancel ? C.HEART_SPEED_SLOW : C.HEART_SPEED;

      if (h.mode === RED) {
        if (pad.Up === pad.Down) m.dy = 0;
        else { if (pad.Up) m.dy = -speed; if (pad.Down) m.dy = speed; }
        if (pad.Left === pad.Right) m.dx = 0;
        else { if (pad.Left) m.dx = -speed; if (pad.Right) m.dx = speed; }
        return;
      }
      if (h.mode !== BLUE) return;

      var down = 0, g = 0, cut = C.HEART_JUMPHOLD_CUTOFF;
      var P = BTS.input;
      if (U.angleWithin(h.angle, 0, 0.5)) {
        if (P.pressed('Left')) soul.jump();
        if (P.released('Left') && m.dx < -cut) m.dx = -cut;
        down = m.dx;
      }
      if (U.angleWithin(h.angle, 90, 0.5)) {
        if (P.pressed('Up')) soul.jump();
        if (P.released('Up') && m.dy < -cut) m.dy = -cut;
        down = m.dy;
      }
      if (U.angleWithin(h.angle, 180, 0.5)) {
        if (P.pressed('Right')) soul.jump();
        if (P.released('Right') && m.dx > cut) m.dx = cut;
        down = -m.dx;
      }
      if (U.angleWithin(h.angle, 270, 0.5)) {
        if (P.pressed('Down')) soul.jump();
        if (P.released('Down') && m.dy > cut) m.dy = cut;
        down = -m.dy;
      }

      if (down < C.GRAVITY_CUTOFF && down > 15) g = C.GRAVITY_FALL;
      if (down <= 15 && down > -30) g = C.GRAVITY_APEX;
      if (down <= -30 && down > -120) g = C.GRAVITY_SLOW_RISE;
      if (down <= -120) g = C.GRAVITY_FAST_RISE;

      var X = U.cos(h.angle), Y = U.sin(h.angle), mf = soul.maxFallSpeed;
      if (checkSolid(X * 0.2, Y * 0.2) === 0) {
        m.dx += X * g * dt;
        m.dy += Y * g * dt;
        if (U.angleWithin(h.angle, 0, 0.5) && m.dx > mf) m.dx = mf;
        if (U.angleWithin(h.angle, 90, 0.5) && m.dy > mf) m.dy = mf;
        if (U.angleWithin(h.angle, 180, 0.5) && m.dx < -mf) m.dx = -mf;
        if (U.angleWithin(h.angle, 270, 0.5) && m.dy < -mf) m.dy = -mf;
      }

      var sideways = U.angleWithin(h.angle, 0, 0.5) || U.angleWithin(h.angle, 180, 0.5);
      var ps;
      if (sideways) {
        m.dy = 0;
        if (C.FIXES.platformsAnyGravity) {
          ridePlatform(h, X, Y);
        } else {
          ps = platformsAt(X * 0.2, Y * 0.2);
          if (ps.length) { m.dx = ps[0].mover.dx; m.dy = ps[0].mover.dy; }
        }
        if (pad.Up !== pad.Down) {
          if (pad.Up) m.dy -= speed;
          if (pad.Down) m.dy += speed;
        }
      } else {
        m.dx = 0;
        ridePlatform(h, X, Y);
        if (pad.Left !== pad.Right) {
          if (pad.Left) m.dx -= speed;
          if (pad.Right) m.dx += speed;
        }
      }
    }
  };

  // Stand on / ride a platform under the heart (relative to gravity) and snap to its surface.
  function ridePlatform(h, X, Y) {
    var m = h.mover, ps = platformsAt(X * 0.5, Y * 0.5);
    ps.forEach(function (p) {
      if (!platformSolidFor(h, p, h.angle)) return;
      var pr = platformRect(p), snap = C.HEART_PLATFORM_SNAP;
      m.dx = p.mover.dx; m.dy = p.mover.dy;
      if (U.angleWithin(h.angle, 90, 0.5)) h.y = pr.t - snap;
      else if (U.angleWithin(h.angle, 270, 0.5)) h.y = pr.b + snap;
      else if (U.angleWithin(h.angle, 0, 0.5)) h.x = pr.l - snap;
      else if (U.angleWithin(h.angle, 180, 0.5)) h.x = pr.r + snap;
    });
  }

  BTS.soul = soul;
})(window.BTS = window.BTS || {});
