/*
 * audio.js - sound and music with C2-style tags.
 *   Served over http(s): Web Audio (fetch + decodeAudioData).
 *   Opened from file://: pooled <audio> elements (browsers block fetch() of local files).
 * Tag "" means "the last sound played", like C2's Audio plugin.
 */
(function (BTS) {
  'use strict';

  var SOUNDS = ['BattleText', 'BoneStab', 'Ding', 'Flash', 'GasterBlast', 'GasterBlast2', 'GasterBlaster',
    'HeartShatter', 'HeartSplit', 'MenuCursor', 'MenuSelect', 'PlayerDamaged', 'PlayerFight', 'PlayerHeal',
    'SansSpeak', 'Slam', 'Warning'];
  var MUSIC = ['mus_zz_megalovania'];
  var BASE = 'assets/audio/';

  var mode = 'none';       // 'webaudio' | 'html' | 'none'
  var ctx = null;
  var buffers = {};        // webaudio: lowercase name -> AudioBuffer
  var pools = {};          // html: lowercase name -> [HTMLAudioElement]
  var names = {};          // lowercase -> file name
  var tracks = [];         // live sounds
  var last = null;

  SOUNDS.concat(MUSIC).forEach(function (n) { names[n.toLowerCase()] = n; });

  // ---- Track: one playing sound ----
  function Track(name, tag, loop) {
    this.name = name; this.tag = tag || ''; this.loop = !!loop;
    this.rate = 1; this.paused = false; this.ended = false;
    this.src = null; this.el = null; this.startedAt = 0; this.offset = 0;
  }
  Track.prototype.start = function () {
    var self = this;
    if (mode === 'webaudio') {
      var buf = buffers[this.name];
      if (!buf) { this.ended = true; return; }
      var s = ctx.createBufferSource();
      s.buffer = buf; s.loop = this.loop; s.playbackRate.value = this.rate;
      s.connect(ctx.destination);
      s.onended = function () { if (!self.paused && self.src === s) self.ended = true; };
      var off = this.offset % buf.duration;
      s.start(0, off);
      this.src = s; this.startedAt = ctx.currentTime - off / this.rate;
    } else if (mode === 'html') {
      var el = takeElement(this.name);
      if (!el) { this.ended = true; return; }
      el.loop = this.loop;
      setRate(el, this.rate);
      try { el.currentTime = this.offset; } catch (e) { /* not seekable yet */ }
      el.onended = function () { if (!self.paused) self.ended = true; };
      var p = el.play(); if (p && p.catch) p.catch(function () {});
      this.el = el;
    } else {
      this.ended = true;
    }
  };
  Track.prototype.halt = function () {
    if (this.src) { try { this.src.onended = null; this.src.stop(); } catch (e) { /* already stopped */ } this.src = null; }
    if (this.el) { this.el.onended = null; this.el.pause(); this.el._busy = false; this.el = null; }
  };
  Track.prototype.stop = function () { this.halt(); this.ended = true; };
  Track.prototype.pause = function () {
    if (this.paused || this.ended) return;
    if (this.src) this.offset = (ctx.currentTime - this.startedAt) * this.rate;
    if (this.el) this.offset = this.el.currentTime;
    this.paused = true;
    this.halt();
  };
  Track.prototype.resume = function () {
    if (!this.paused || this.ended) return;
    this.paused = false;
    this.start();
  };
  Track.prototype.setRate = function (r) {
    if (!(r > 0)) return;
    if (this.src) {
      this.offset = (ctx.currentTime - this.startedAt) * this.rate;
      this.startedAt = ctx.currentTime - this.offset / r;
      this.src.playbackRate.value = r;
    }
    if (this.el) setRate(this.el, r);
    this.rate = r;
  };

  function setRate(el, r) {
    el.preservesPitch = false; el.mozPreservesPitch = false; el.webkitPreservesPitch = false;
    el.playbackRate = r;
  }

  function takeElement(name) {
    var pool = pools[name];
    if (!pool || !pool.length) return null;
    for (var i = 0; i < pool.length; i++) if (!pool[i]._busy) { pool[i]._busy = true; return pool[i]; }
    var el = pool[0].cloneNode(true);
    el._busy = true; pool.push(el);
    return el;
  }

  function prune() { tracks = tracks.filter(function (t) { return !t.ended; }); }
  function byTag(tag) {
    prune();
    if (!tag) return last && !last.ended ? [last] : [];
    var t = String(tag).toLowerCase();
    return tracks.filter(function (x) { return x.tag.toLowerCase() === t; });
  }

  var audio = {
    log: [],           // names of sounds played (used by the headless tests)
    mode: function () { return mode; },
    isMusic: function (name) { return MUSIC.some(function (m) { return m.toLowerCase() === String(name).toLowerCase(); }); },

    init: function () {
      var isFile = typeof location !== 'undefined' && location.protocol === 'file:';
      var AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!isFile && AC) { mode = 'webaudio'; ctx = new AC(); }
      else if (typeof Audio !== 'undefined') mode = 'html';
      else mode = 'none';
    },

    // Loads every sound; onEach(done, total) reports progress.
    load: function (onEach) {
      var list = SOUNDS.concat(MUSIC), done = 0;
      function tick() { done++; if (onEach) onEach(done, list.length); }
      return Promise.all(list.map(function (n) {
        var url = BASE + n + '.ogg', key = n.toLowerCase();
        if (mode === 'webaudio') {
          return fetch(url).then(function (r) { return r.arrayBuffer(); })
            .then(function (ab) {
              return new Promise(function (res) { ctx.decodeAudioData(ab, res, function () { res(null); }); });
            })
            .then(function (buf) { if (buf) buffers[key] = buf; tick(); })
            .catch(function () { tick(); });
        }
        if (mode === 'html') {
          return new Promise(function (res) {
            var el = new Audio();
            var fin = function () { el.oncanplaythrough = el.onerror = null; tick(); res(); };
            el.preload = 'auto';
            el.oncanplaythrough = fin; el.onerror = fin;
            el.src = url;
            pools[key] = [el];
            setTimeout(fin, 8000);
          });
        }
        tick();
        return Promise.resolve();
      }));
    },

    // Must be called from a user gesture (the click-to-start screen).
    unlock: function () {
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },

    play: function (name, opts) {
      opts = opts || {};
      var key = String(name).toLowerCase();
      audio.log.push(names[key] || name);
      if (audio.log.length > 500) audio.log.shift();
      if (!names[key]) return null;
      var t = new Track(key, opts.tag, opts.loop);
      if (opts.rate) t.rate = opts.rate;
      t.start();
      tracks.push(t);
      last = t;
      return t;
    },
    setRate: function (tag, rate) { byTag(tag).forEach(function (t) { t.setRate(rate); }); },
    stop: function (tag) { byTag(tag).forEach(function (t) { t.stop(); }); prune(); },
    stopAll: function () { tracks.forEach(function (t) { t.stop(); }); tracks = []; last = null; },
    setPaused: function (tag, paused) { byTag(tag).forEach(function (t) { if (paused) t.pause(); else t.resume(); }); },
    isTagPlaying: function (tag) { return byTag(tag).some(function (t) { return !t.paused; }); }
  };

  BTS.audio = audio;
})(window.BTS = window.BTS || {});
