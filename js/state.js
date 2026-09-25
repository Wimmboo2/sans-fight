/*
 * state.js - global game state (the C2 "Globals" event sheet plus timing).
 */
(function (BTS) {
  'use strict';

  BTS.MODE = { NORMAL: 0, ENDLESS: 1, SINGLE: 2, PRACTICE: 3 };
  BTS.HEARTMODE = { RED: 0, BLUE: 1 };

  BTS.state = {
    time: 0,          // game time in seconds (C2 "time")
    tick: 0,
    dt: 1 / 60,
    timeScale: 1,     // the "Debug" timeline command sets this to 0
    simulatorMode: 0,
    endlessStage: 0,
    practiceTarget: 60,
    singleAttack: '',
    name: 'Chara',
    hp: 92,
    maxHp: 92,
    kr: 0,
    krT: 0,
    scene: null,
    pendingScene: null,
    customAttack: null  // text of a user-loaded attack
  };

  BTS.initState = function () {
    var C = BTS.C, s = BTS.state;
    s.dt = 1 / C.TICK_RATE;
    s.practiceTarget = C.PRACTICE_TARGET;
    s.name = C.PLAYER_NAME;
    s.hp = C.START_HP;
    s.maxHp = C.MAX_HP;
  };
})(window.BTS = window.BTS || {});
