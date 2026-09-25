/*
 * sprite.js - logic-side sprite: position, angle, scale, animation state, image points and bounding box.
 * No DOM here; js/render/draw.js draws these.
 */
(function (BTS) {
  'use strict';

  function Sprite(obj, anim, x, y) {
    this.obj = obj;
    this.meta = BTS.SPRITES[obj];
    this.x = x || 0;
    this.y = y || 0;
    this.angle = 0;               // degrees
    this.scaleX = this.meta.scale;
    this.scaleY = this.meta.scale;
    this.visible = true;
    this.opacity = 1;
    this.tint = null;             // [r,g,b] 0..1 or null
    this.animName = null;
    this.frame = 0;
    this.animT = 0;
    this.playing = false;
    this.onFinished = null;
    this.setAnim(anim || Object.keys(this.meta.anims)[0], true);
  }

  Sprite.prototype.anim = function () { return this.meta.anims[this.animName]; };
  Sprite.prototype.cur = function () { return this.anim().frames[this.frame]; };

  // C2 "Set animation": ignored if that animation is already playing.
  Sprite.prototype.setAnim = function (name, fromBeginning) {
    var target = null;
    for (var k in this.meta.anims) if (k.toLowerCase() === String(name).toLowerCase()) target = k;
    if (!target) return;
    if (target === this.animName && this.playing) return;
    var keepFrame = (fromBeginning === false) ? this.frame : 0;
    this.animName = target;
    this.frame = Math.min(keepFrame, this.anim().frames.length - 1);
    this.animT = 0;
    this.playing = true;
  };
  Sprite.prototype.stopAnim = function () { this.playing = false; };
  Sprite.prototype.startAnim = function (fromBeginning) {
    if (fromBeginning) { this.frame = 0; this.animT = 0; }
    this.playing = true;
  };
  Sprite.prototype.setFrame = function (f) {
    var n = this.anim().frames.length;
    this.frame = Math.max(0, Math.min(n - 1, f | 0));
    this.animT = 0;
  };

  Sprite.prototype.update = function (dt) {
    if (!this.playing) return;
    var a = this.anim();
    if (a.speed === 0) return;
    this.animT += dt * a.speed;
    for (;;) {
      var dur = a.frames[this.frame].dur || 1;
      if (this.animT < dur) break;
      this.animT -= dur;
      if (this.frame < a.frames.length - 1) {
        this.frame++;
      } else if (a.loop) {
        this.frame = a.repeatTo || 0;
      } else {
        this.playing = false;
        if (this.onFinished) this.onFinished(this);
        break;
      }
    }
  };

  // Current drawn size.
  Sprite.prototype.width = function () { return this.cur().w * this.scaleX; };
  Sprite.prototype.height = function () { return this.cur().h * this.scaleY; };
  Sprite.prototype.imageWidth = function () { return this.cur().w; };
  Sprite.prototype.imageHeight = function () { return this.cur().h; };

  // Image point in world space (rotation included).
  Sprite.prototype.imagePoint = function (name) {
    var f = this.cur();
    var p = f.pts && f.pts[name];
    if (!p) return { x: this.x, y: this.y };
    var ox = (p[0] - f.hx) * this.width(), oy = (p[1] - f.hy) * this.height();
    if (!this.angle) return { x: this.x + ox, y: this.y + oy };
    var c = BTS.util.cos(this.angle), s = BTS.util.sin(this.angle);
    return { x: this.x + ox * c - oy * s, y: this.y + ox * s + oy * c };
  };

  // Axis-aligned bounding box (exact for angles that are multiples of 90 degrees).
  Sprite.prototype.bbox = function () {
    var f = this.cur(), w = this.width(), h = this.height();
    var l = -f.hx * w, t = -f.hy * h, r = l + w, b = t + h;
    var a = BTS.util.normAngle(this.angle);
    if (a === 0) return { l: this.x + l, t: this.y + t, r: this.x + r, b: this.y + b };
    var c = BTS.util.cos(a), s = BTS.util.sin(a);
    var xs = [l * c - t * s, r * c - t * s, r * c - b * s, l * c - b * s];
    var ys = [l * s + t * c, r * s + t * c, r * s + b * c, l * s + b * c];
    return {
      l: this.x + Math.min.apply(null, xs), r: this.x + Math.max.apply(null, xs),
      t: this.y + Math.min.apply(null, ys), b: this.y + Math.max.apply(null, ys)
    };
  };

  BTS.Sprite = Sprite;
})(window.BTS = window.BTS || {});
