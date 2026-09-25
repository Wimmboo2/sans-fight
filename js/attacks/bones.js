/*
 * bones.js - BoneH / BoneV (and their Repeat versions), SineBones and BoneStab.
 * Port of the "Bones" and "BoneStab" groups of Battle.xml.
 */
(function (BTS) {
  'use strict';

  var U;
  function W() { return BTS.world; }
  function zr() { return BTS.zone.rect(); }

  function newBone(kind, x, y, size, dir, speed, color) {
    var C = BTS.C;
    var b = {
      type: 'bone', kind: kind, seq: W().seq++,
      x: U.toInt(x), y: U.toInt(y),
      w: kind === 'H' ? U.toInt(size) : 10,
      h: kind === 'H' ? 10 : U.toInt(size),
      dir: U.toInt(dir), speed: U.toInt(speed), color: U.toInt(color),
      damage: C.BONE_DAMAGE, karma: C.BONE_KARMA,
      clipped: kind === 'V'            // BoneV lives on the clipped layer, BoneH does not
    };
    W().bones.push(b);
    return b;
  }

  var bones = {
    init: function () { U = BTS.util; },

    boneH: function (x, y, w, dir, speed, color) { return newBone('H', x, y, w, dir, speed, color); },
    boneV: function (x, y, h, dir, speed, color) { return newBone('V', x, y, h, dir, speed, color); },

    repeat: function (kind, sx, sy, size, dir, speed, count, spacing) {
      sx = U.toFloat(sx); sy = U.toFloat(sy); dir = U.toFloat(dir);
      count = U.toInt(count); spacing = U.toInt(spacing);
      for (var i = 0; i <= count - 1; i++) {
        var x = sx - U.cos(dir * 90) * spacing * i;
        var y = sy - U.sin(dir * 90) * spacing * i;
        newBone(kind, x, y, size, dir, speed, 0);
      }
    },

    sineBones: function (count, spacing, speed, height) {
      count = U.toInt(count); spacing = U.toInt(spacing); speed = U.toInt(speed); height = U.toInt(height);
      for (var i = 0; i <= count - 1; i++) {
        var z = zr(), x = 0, dir = 0;
        if (spacing > 0) { x = z.r + spacing * i; dir = 2; }
        if (spacing < 0) { x = z.l + spacing * i; dir = 0; }
        var sine = Math.floor(Math.sin(i / 3) * 28);
        var y = z.t + 6;
        newBone('V', x, y, height + sine, dir, speed, 0);
        y = z.t + 6 + height + sine + 39;
        newBone('V', x, y, z.b - 5 - y, dir, speed, 0);
      }
    },

    boneStab: function (dir, distance, warnTime, stayTime) {
      var d = U.toFloat(dir);
      if (!(d >= 0 && d <= 3)) return;
      var z = zr(), wn = {
        type: 'warn', seq: W().seq++, dir: U.toInt(dir), distance: U.toInt(distance),
        warnTime: U.toFloat(warnTime), stayTime: U.toFloat(stayTime), damage: 0, karma: 0, color: 0
      };
      BTS.audio.play('Warning');
      var zw = z.r - z.l, zh = z.b - z.t;
      if (wn.dir === 0) { wn.w = wn.distance - 3; wn.h = zh - 16; wn.x = z.r - wn.w - 8; wn.y = z.t + 8; }
      if (wn.dir === 1) { wn.w = zw - 16; wn.h = wn.distance - 3; wn.x = z.l + 8; wn.y = z.b - wn.h - 8; }
      if (wn.dir === 2) { wn.w = wn.distance - 3; wn.h = zh - 16; wn.x = z.l + 8; wn.y = z.t + 8; }
      if (wn.dir === 3) { wn.w = zw - 16; wn.h = wn.distance - 3; wn.x = z.l + 8; wn.y = z.t + 8; }
      W().warns.push(wn);
    },

    update: function (dt) {
      var w = W(), C = BTS.C;
      // Bone family: move, then destroy when off-screen in the direction of travel.
      w.bones.forEach(function (b) {
        b.x += U.cos(b.dir * 90) * dt * b.speed;
        b.y += U.sin(b.dir * 90) * dt * b.speed;
      });
      w.bones = w.bones.filter(function (b) {
        if (b.dir === 0 && b.x > C.WIDTH) return false;
        if (b.dir === 1 && b.y > C.HEIGHT) return false;
        if (b.dir === 2 && b.x < -b.w) return false;
        if (b.dir === 3 && b.y < -b.h) return false;
        return true;
      });

      // Warnings that ran out turn into bone stabs (checked before the countdown, like the original).
      w.warns.slice().forEach(function (wn) {
        if (wn.warnTime !== 0) return;
        BTS.audio.play('BoneStab');
        U.remove(w.warns, wn);
        var z = zr(), s = {
          type: 'stab', seq: w.seq++, dir: wn.dir, distance: wn.distance, stayTime: wn.stayTime,
          reverse: false, damage: C.BONE_DAMAGE, karma: C.BONE_KARMA, color: 0, clipped: true
        };
        if (wn.dir === 1 || wn.dir === 3) {
          s.kind = 'V'; s.x = z.l; s.w = z.r - z.l; s.h = wn.distance + 8; s.destX = s.x;
          if (wn.dir === 1) { s.y = z.b - 5; s.destY = z.b - 5 - wn.distance; }
          else { s.y = z.t + 5 - s.h; s.destY = z.t + 5 - s.h + wn.distance; }
        } else {
          s.kind = 'H'; s.y = z.t; s.w = wn.distance + 8; s.h = z.b - z.t; s.destY = s.y;
          if (wn.dir === 0) { s.x = z.r - 5; s.destX = z.r - 5 - wn.distance; }
          else { s.x = z.l + 5 - s.w; s.destX = z.l + 5 - s.w + wn.distance; }
        }
        w.stabs.push(s);
      });
      w.warns.forEach(function (wn) { if (wn.warnTime > 0) wn.warnTime -= Math.min(dt, wn.warnTime); });

      w.stabs.slice().forEach(function (s) {
        var speed = s.distance * C.BONESTAB_SPEED_FACTOR, cx = U.cos(s.dir * 90), sy = U.sin(s.dir * 90);
        if (s.reverse) {
          s.x += cx * dt * speed; s.y += sy * dt * speed;
        } else {
          s.x -= cx * dt * speed; s.y -= sy * dt * speed;
          if (U.angleWithin(s.dir * 90, U.angle(s.x, s.y, s.destX, s.destY), 0.5)) { s.x = s.destX; s.y = s.destY; }
          if (s.x === s.destX && s.y === s.destY) {
            s.stayTime -= Math.min(dt, s.stayTime);
            if (s.stayTime === 0) s.reverse = true;
          }
        }
        if (s.x > C.WIDTH || s.x + s.w < 0 || s.y > C.HEIGHT || s.y + s.h < 0) U.remove(w.stabs, s);
      });
    }
  };

  BTS.bones = bones;
})(window.BTS = window.BTS || {});
