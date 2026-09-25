/*
 * draw.js - drawing primitives matching the C2 plugins used by the original:
 * Sprite, 9-patch, Tiled Background and Sprite Font. Positions are pixel-rounded like the original
 * ("Pixel rounding" was on). cam = {x, y} is the top-left of the view.
 */
(function (BTS) {
  'use strict';

  var DEG = Math.PI / 180;
  function ctx() { return BTS.screen.bctx; }

  function tileRect(g, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (dw <= 0 || dh <= 0 || sw <= 0 || sh <= 0) return;
    for (var yy = 0; yy < dh; yy += sh) {
      var ch = Math.min(sh, dh - yy);
      for (var xx = 0; xx < dw; xx += sw) {
        var cw = Math.min(sw, dw - xx);
        g.drawImage(img, sx, sy, cw, ch, dx + xx, dy + yy, cw, ch);
      }
    }
  }
  function part(g, img, mode, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (dw <= 0 || dh <= 0 || sw <= 0 || sh <= 0) return;
    if (mode === 'tile') tileRect(g, img, sx, sy, sw, sh, dx, dy, dw, dh);
    else g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  var draw = {
    sprite: function (s, cam) {
      if (!s || !s.visible) return;
      var img = BTS.assets.frame(s.obj, s.animName, s.frame);
      if (!img) return;
      img = BTS.tint.get(img, s.tint);
      var f = s.cur(), w = s.width(), h = s.height(), g = ctx();
      g.globalAlpha = Math.max(0, Math.min(1, s.opacity));
      if (!BTS.util.normAngle(s.angle)) {
        g.drawImage(img, Math.round(s.x - f.hx * w) - cam.x, Math.round(s.y - f.hy * h) - cam.y, w, h);
      } else {
        g.save();
        g.translate(Math.round(s.x) - cam.x, Math.round(s.y) - cam.y);
        g.rotate(s.angle * DEG);
        g.drawImage(img, -f.hx * w, -f.hy * h, w, h);
        g.restore();
      }
      g.globalAlpha = 1;
    },

    // 9-patch. o = {tex, x, y, w, h, m: [l, r, t, b], edges: 'tile'|'stretch', fill: 'tile'|'stretch'|'none',
    //              tint, opacity}
    ninePatch: function (o, cam) {
      var img = BTS.assets.tex(o.tex);
      if (!img || !img.width) return;
      img = BTS.tint.get(img, o.tint);
      var g = ctx();
      var x = Math.round(Math.min(o.x, o.x + o.w)) - cam.x, y = Math.round(Math.min(o.y, o.y + o.h)) - cam.y;
      var w = Math.round(Math.abs(o.w)), h = Math.round(Math.abs(o.h));
      if (w <= 0 || h <= 0) return;
      var tw = img.width, th = img.height;
      var l = o.m[0], r = o.m[1], t = o.m[2], b = o.m[3];
      if (l + r > w) { l = Math.floor(l * w / (l + r)); r = w - l; }
      if (t + b > h) { t = Math.floor(t * h / (t + b)); b = h - t; }
      var sl = o.m[0], sr = o.m[1], st = o.m[2], sb = o.m[3];
      var mw = tw - sl - sr, mh = th - st - sb, iw = w - l - r, ih = h - t - b;
      var e = o.edges || 'stretch', fill = o.fill || 'stretch';
      g.globalAlpha = o.opacity === undefined ? 1 : o.opacity;
      g.save();
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      // corners
      part(g, img, 'stretch', 0, 0, sl, st, x, y, l, t);
      part(g, img, 'stretch', tw - sr, 0, sr, st, x + w - r, y, r, t);
      part(g, img, 'stretch', 0, th - sb, sl, sb, x, y + h - b, l, b);
      part(g, img, 'stretch', tw - sr, th - sb, sr, sb, x + w - r, y + h - b, r, b);
      // edges
      part(g, img, e, sl, 0, mw, st, x + l, y, iw, t);
      part(g, img, e, sl, th - sb, mw, sb, x + l, y + h - b, iw, b);
      part(g, img, e, 0, st, sl, mh, x, y + t, l, ih);
      part(g, img, e, tw - sr, st, sr, mh, x + w - r, y + t, r, ih);
      // centre
      if (fill !== 'none') part(g, img, fill, sl, st, mw, mh, x + l, y + t, iw, ih);
      g.restore();
      g.globalAlpha = 1;
    },

    // Tiled background. o = {tex, x, y, w, h, angle, hx, hy, tint, opacity}
    tiled: function (o, cam) {
      var img = BTS.assets.tex(o.tex);
      if (!img || !img.width || o.w <= 0 || o.h <= 0) return;
      img = BTS.tint.get(img, o.tint);
      var g = ctx();
      g.globalAlpha = o.opacity === undefined ? 1 : Math.max(0, Math.min(1, o.opacity));
      g.save();
      g.translate(Math.round(o.x) - cam.x, Math.round(o.y) - cam.y);
      if (o.angle) g.rotate(o.angle * DEG);
      var ox = -(o.hx || 0) * o.w, oy = -(o.hy || 0) * o.h;
      g.beginPath(); g.rect(ox, oy, o.w, o.h); g.clip();
      tileRect(g, img, 0, 0, img.width, img.height, ox, oy, o.w + img.width, o.h + img.height);
      g.restore();
      g.globalAlpha = 1;
    },

    // Sprite-font text. t = text object (see js/ui/dialog.js).
    wrap: function (font, text, maxW, scale) {
      var lines = [];
      String(text).split('\n').forEach(function (para) {
        var words = para.split(' '), line = null;
        words.forEach(function (word) {
          var cand = line === null ? word : line + ' ' + word;
          if (line !== null && draw.measure(font, cand, scale) > maxW) { lines.push(line); line = word; }
          else line = cand;
        });
        lines.push(line === null ? '' : line);
      });
      return lines;
    },
    measure: function (font, s, scale) {
      var w = 0;
      for (var i = 0; i < s.length; i++) w += font.charWidth(s[i]) * scale;
      return w;
    },
    text: function (t, cam) {
      if (!t || !t.visible || !t.text) return;
      var font = BTS.FONTS[t.font], img = BTS.assets.tex(t.font);
      if (!img || !img.width) return;
      img = BTS.tint.get(img, t.tint);
      var g = ctx(), sc = t.scale, lh = font.ch * sc, cols = Math.floor(img.width / font.cw);
      var lines = draw.wrap(font, t.text, t.w, sc);
      g.globalAlpha = t.opacity === undefined ? 1 : t.opacity;
      for (var li = 0; li < lines.length; li++) {
        if ((li + 1) * lh > t.h + 0.5 && li > 0) break;
        var line = lines[li], px = t.x;
        if (t.halign === 'center') px += Math.floor((t.w - draw.measure(font, line, sc)) / 2);
        var py = t.y + li * lh;
        for (var i = 0; i < line.length; i++) {
          var c = line[i], idx = font.index[c];
          if (idx !== undefined) {
            g.drawImage(img, (idx % cols) * font.cw, Math.floor(idx / cols) * font.ch, font.cw, font.ch,
              Math.round(px) - cam.x, Math.round(py) - cam.y, font.cw * sc, font.ch * sc);
          }
          px += font.charWidth(c) * sc;
        }
      }
      g.globalAlpha = 1;
    },

    rect: function (x, y, w, h, color, cam) {
      var g = ctx();
      g.fillStyle = color;
      g.fillRect(Math.round(x) - cam.x, Math.round(y) - cam.y, Math.round(w), Math.round(h));
    }
  };

  BTS.draw = draw;
})(window.BTS = window.BTS || {});
