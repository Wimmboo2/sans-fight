/*
 * Bad Time Simulator (Sans Fight) - pure JavaScript port
 * =====================================================
 * Original Construct 2 project "Bad Time Simulator (Sans Fight)" by Jcw87:
 *   https://github.com/Jcw87/c2-sans-fight
 * Undertale, its characters, sprites and music are by Toby Fox. This is a non-commercial fan project
 * and is not affiliated with Toby Fox.
 * This version: a pure JavaScript port with bug fixes, based on Jcw87's work.
 *
 * main.js - boot (loading + click-to-start), scene switching and the tick/render entry points.
 */
(function (BTS) {
  'use strict';

  function scene(name) { return { mainmenu: BTS.mainmenu, battle: BTS.battle }[name]; }
  var phase = 'loading';     // loading -> ready (click to start) -> running
  var progress = 0;
  var logo = null;

  BTS.goScene = function (name, opts) { BTS.state.pendingScene = { name: name, opts: opts }; };

  function switchScene() {
    var p = BTS.state.pendingScene;
    if (!p) return;
    BTS.state.pendingScene = null;
    BTS.state.scene = p.name;
    scene(p.name).enter(p.opts);
  }

  // One logic tick.
  BTS.step = function (dt) {
    var s = BTS.state;
    s.tick += 1;
    s.time = s.tick * dt;
    BTS.touch.update();
    if (s.scene) scene(s.scene).tick(dt);
    BTS.scheduler.run();
    switchScene();
  };

  function render() {
    var g = BTS.screen.bctx, C = BTS.C;
    if (phase === 'running' && BTS.state.scene) {
      scene(BTS.state.scene).draw();
    } else {
      g.fillStyle = '#000';
      g.fillRect(0, 0, C.WIDTH, C.HEIGHT);
      if (logo && logo.complete && logo.width) g.drawImage(logo, Math.round((C.WIDTH - logo.width) / 2), 200);
      if (phase === 'loading') {
        g.fillStyle = '#fff';
        g.fillRect(220, 260, Math.round(200 * progress), 6);
        g.strokeStyle = '#fff';
        g.strokeRect(219.5, 259.5, 201, 7);
      } else {
        BTS.draw.text({ font: 'BattleFont', x: 0, y: 260, w: 640, h: 20, scale: 3, visible: true, halign: 'center',
          text: 'CLICK OR PRESS ANY KEY TO START' }, { x: 0, y: 0 });
      }
    }
    BTS.screen.present();
  }

  function start() {
    if (phase !== 'ready') return;
    phase = 'running';
    BTS.audio.unlock();
    BTS.goScene('mainmenu');
    switchScene();
  }

  BTS.boot = function () {
    BTS.initState();
    var canvas = document.getElementById('game');
    BTS.screen.init(canvas);
    BTS.input.attach(window);
    BTS.audio.init();
    BTS.touch.attach(canvas);
    BTS.customattack.attach();
    logo = new Image();
    logo.src = 'assets/icons/loading-logo.png';

    var parts = [0, 0];
    var upd = function (i) { return function (d, n) { parts[i] = d / n; progress = (parts[0] + parts[1]) / 2; }; };
    Promise.all([BTS.assets.load(upd(0)), BTS.audio.load(upd(1))]).then(function () {
      phase = 'ready';
      canvas.addEventListener('pointerdown', start);
      BTS.input.anyKeyHandlers.push(start);
    });

    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyH' && BTS.input.captureKeys) BTS.C.DEBUG_HITBOX = !BTS.C.DEBUG_HITBOX;
    });

    BTS.loop.start(function (dt) { if (phase === 'running') BTS.step(dt); }, render);
  };
})(window.BTS = window.BTS || {});
