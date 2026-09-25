/*
 * damage.js - hits, HP, KARMA (KR) and the death sequence (the "PlayerDamage" group of Battle.xml).
 *
 * Soul hitbox: see C.SOUL_HITBOX. 'point' reproduces the original (only the heart's centre point
 * counted), 'box' uses a centred w x h box. Walls and platforms always use the full 16x16 sprite.
 */
(function (BTS) {
  'use strict';

  var U;
  function W() { return BTS.world; }
  function S() { return BTS.state; }

  // ----- shapes -----
  function rectOf(o) {   // 9-patch objects may have negative sizes
    return { l: Math.min(o.x, o.x + o.w), r: Math.max(o.x, o.x + o.w), t: Math.min(o.y, o.y + o.h), b: Math.max(o.y, o.y + o.h) };
  }

  // Oriented box (x, y = hotspot at the left-middle edge, like the beam) vs point / axis-aligned box.
  function obbCorners(o) {
    var c = U.cos(o.angle), s = U.sin(o.angle), hh = o.h / 2;
    var pts = [[0, -hh], [o.w, -hh], [o.w, hh], [0, hh]];
    return pts.map(function (p) { return [o.x + p[0] * c - p[1] * s, o.y + p[0] * s + p[1] * c]; });
  }
  function pointInObb(px, py, o) {
    var c = U.cos(o.angle), s = U.sin(o.angle), dx = px - o.x, dy = py - o.y;
    var lx = dx * c + dy * s, ly = -dx * s + dy * c;
    return lx >= 0 && lx <= o.w && ly >= -o.h / 2 && ly <= o.h / 2;
  }
  function project(pts, ax, ay) {
    var mn = Infinity, mx = -Infinity;
    pts.forEach(function (p) { var d = p[0] * ax + p[1] * ay; if (d < mn) mn = d; if (d > mx) mx = d; });
    return [mn, mx];
  }
  function rectObbOverlap(r, o) {
    var A = [[r.l, r.t], [r.r, r.t], [r.r, r.b], [r.l, r.b]], B = obbCorners(o);
    var c = U.cos(o.angle), s = U.sin(o.angle);
    var axes = [[1, 0], [0, 1], [c, s], [-s, c]];
    for (var i = 0; i < axes.length; i++) {
      var a = project(A, axes[i][0], axes[i][1]), b = project(B, axes[i][0], axes[i][1]);
      if (a[1] <= b[0] || b[1] <= a[0]) return false;
    }
    return true;
  }

  function hitbox() {
    var h = W().heart, hb = BTS.C.SOUL_HITBOX;
    return { l: h.x - hb.w / 2, r: h.x + hb.w / 2, t: h.y - hb.h / 2, b: h.y + hb.h / 2 };
  }
  function hitsRect(r) {
    var h = W().heart;
    if (BTS.C.SOUL_HITBOX.mode === 'point') return U.pointInRect(h.x, h.y, r);
    return U.rectsOverlap(hitbox(), r, true);
  }
  function hitsObb(o) {
    var h = W().heart;
    if (BTS.C.SOUL_HITBOX.mode === 'point') return pointInObb(h.x, h.y, o);
    return rectObbOverlap(hitbox(), o);
  }

  var damage = {
    lastDamageTime: -1,
    hitbox: hitbox,
    hitsRect: hitsRect,
    hitsObb: hitsObb,

    init: function () { U = BTS.util; damage.lastDamageTime = -1; },

    damagePlayer: function (dmg, karma) {
      damage.lastDamageTime = S().time;
      S().hp -= U.toFloat(dmg);
      S().kr += U.toFloat(karma);
      BTS.audio.play('PlayerDamaged');
    },

    // Karma of an attack drops after its first hit (>= 3 becomes 2).
    reduceKarma: function (list) { list.forEach(function (o) { if (o.karma >= 3) o.karma = BTS.C.KARMA_REPEAT; }); },

    update: function (dt) {
      var w = W(), s = S(), C = BTS.C, h = w.heart;

      if (h && damage.lastDamageTime < s.time - C.DAMAGE_COOLDOWN) {
        // AttackSprite family: menu bones (Gaster Blaster skulls themselves never do damage).
        var sprites = w.menuBonesLeft.concat(w.menuBonesBottom).filter(function (m) {
          return m.damage > 0 && h.visible && hitsRect(BTS.menubones.rect(m));
        });
        if (sprites.length) {
          damage.damagePlayer(sprites[0].damage, sprites[0].karma);
          damage.reduceKarma(sprites);
          if (s.hp <= 0) s.hp = 1;            // menu bones can't kill
        }
        // AttackTiled: the beams.
        var beams = w.blasters.map(function (b) { return b.hit; }).filter(function (o) {
          return o.damage > 0 && hitsObb(o);
        });
        if (beams.length) { damage.damagePlayer(beams[0].damage, beams[0].karma); damage.reduceKarma(beams); }
        // Attack9Patch: bones and bone stabs, by colour (white always, blue if moving, orange if still).
        var nine = w.bones.filter(function (b) { return b.kind === 'H'; })
          .concat(w.stabs.filter(function (b) { return b.kind === 'H'; }))
          .concat(w.stabs.filter(function (b) { return b.kind === 'V'; }))
          .concat(w.bones.filter(function (b) { return b.kind === 'V'; }))
          .filter(function (o) { return o.damage > 0 && hitsRect(rectOf(o)); });
        var moving = h.mover.isMoving();
        [0, 1, 2].forEach(function (col) {
          var hit = nine.filter(function (o) { return o.color === col; });
          if (!hit.length) return;
          if (col === 1 && !moving) return;
          if (col === 2 && moving) return;
          damage.damagePlayer(hit[0].damage, hit[0].karma);
          damage.reduceKarma(hit);
        });
      }

      if (s.kr > C.KR_MAX) s.kr = C.KR_MAX;
      if (s.kr >= s.hp) s.kr = s.hp - 1;
      if (s.kr > 0 && s.hp > 1) {
        s.krT += dt;
        for (var i = 0; i < C.KR_DRAIN.length; i++) {
          var row = C.KR_DRAIN[i];
          if (s.kr >= row.kr && s.krT >= row.t) { s.kr -= 1; s.hp -= 1; s.krT = 0; break; }
        }
      }
      if (s.hp > s.maxHp) s.hp = s.maxHp;
      if (h && s.hp <= 0 && h.mode >= 0) damage.die();
    },

    die: function () {
      var w = W(), h = w.heart, C = BTS.C;
      h.mode = -1;
      h.mover.enabled = false;
      h.angle = 90;
      h.tint = C.TINT.RED_HEART;
      h.layer = 'Overlay';
      BTS.fn.call('TLStop');
      BTS.fn.call('BlackScreen', 1);
      BTS.audio.stopAll();
      BTS.attacks.clear();
      BTS.scheduler.wait(20 / 30, function () {
        h.setAnim('Split', true);
        BTS.audio.play('HeartSplit');
        BTS.scheduler.wait(40 / 30, function () {
          h.visible = false;
          BTS.audio.play('HeartShatter');
          for (var i = 1; i <= 6; i++) {
            var sh = new BTS.Sprite('HeartShard', 'Default', h.x, h.y);
            sh.mover = new BTS.StepMover(sh, { mode: 'none' });
            var a = BTS.rng.range(360) * Math.PI / 180;
            sh.mover.dx = Math.cos(a) * 180; sh.mover.dy = Math.sin(a) * 180;
            w.shards.push(sh);
          }
          BTS.scheduler.wait(2, function () { BTS.goScene('mainmenu'); });
        });
      });
    }
  };

  BTS.damage = damage;
})(window.BTS = window.BTS || {});
