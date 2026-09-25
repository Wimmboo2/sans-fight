/*
 * canvas.js - native 640x480 back buffer, shown with integer scaling (nearest neighbour).
 * The scale is computed in device pixels so it stays crisp on high-DPI screens. If the window is smaller
 * than 640x480 the game is shrunk (still nearest neighbour) so it fits on phones.
 */
(function (BTS) {
  'use strict';

  var screen = {
    canvas: null, ctx: null, buffer: null, bctx: null, scale: 1,

    init: function (canvas) {
      var C = BTS.C;
      screen.canvas = canvas;
      screen.ctx = canvas.getContext('2d');
      screen.buffer = document.createElement('canvas');
      screen.buffer.width = C.WIDTH;
      screen.buffer.height = C.HEIGHT;
      screen.bctx = screen.buffer.getContext('2d');
      screen.bctx.imageSmoothingEnabled = false;
      window.addEventListener('resize', screen.resize);
      screen.resize();
    },

    resize: function () {
      var C = BTS.C, dpr = window.devicePixelRatio || 1;
      var aw = window.innerWidth * dpr, ah = window.innerHeight * dpr;
      var fit = Math.min(aw / C.WIDTH, ah / C.HEIGHT);
      var s = fit >= 1 ? Math.floor(fit) : fit;
      screen.scale = s;
      screen.canvas.width = Math.round(C.WIDTH * s);
      screen.canvas.height = Math.round(C.HEIGHT * s);
      screen.canvas.style.width = (screen.canvas.width / dpr) + 'px';
      screen.canvas.style.height = (screen.canvas.height / dpr) + 'px';
    },

    present: function () {
      var c = screen.ctx;
      c.imageSmoothingEnabled = false;
      c.drawImage(screen.buffer, 0, 0, screen.canvas.width, screen.canvas.height);
    },

    // Page coordinates -> game coordinates.
    toGame: function (clientX, clientY) {
      var r = screen.canvas.getBoundingClientRect(), C = BTS.C;
      return { x: (clientX - r.left) / r.width * C.WIDTH, y: (clientY - r.top) / r.height * C.HEIGHT };
    }
  };

  BTS.screen = screen;
})(window.BTS = window.BTS || {});
