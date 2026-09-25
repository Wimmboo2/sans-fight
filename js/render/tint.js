/*
 * tint.js - the C2 "Tint" effect (multiply RGB). Tinted copies are cached per image and colour.
 * Uses compositing only, never getImageData, so it also works for images loaded from file://.
 */
(function (BTS) {
  'use strict';

  var cache = new Map();

  BTS.tint = {
    get: function (img, rgb) {
      if (!img || !rgb || (rgb[0] === 1 && rgb[1] === 1 && rgb[2] === 1)) return img;
      var byImg = cache.get(img);
      if (!byImg) { byImg = {}; cache.set(img, byImg); }
      var key = rgb.join(',');
      if (byImg[key]) return byImg[key];
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      if (!w || !h) return img;
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = 'rgb(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' + Math.round(rgb[2] * 255) + ')';
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(img, 0, 0);
      byImg[key] = c;
      return c;
    }
  };
})(window.BTS = window.BTS || {});
