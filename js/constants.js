/*
 * constants.js - every tunable value in one place.
 * Values come from the original Construct 2 event sheets unless a comment says otherwise.
 * Speeds are px/second, times are seconds, angles are degrees.
 */
(function (BTS) {
  'use strict';

  BTS.C = {
    WIDTH: 640,
    HEIGHT: 480,
    MENU_LAYOUT_HEIGHT: 1280,     // main menu layout is 640x1280 and scrolls

    // Fixed timestep. The original is dt-based at display refresh rate (usually 60 Hz).
    TICK_RATE: 60,
    MAX_STEPS_PER_FRAME: 5,

    // --- Soul (PlayerMovement group) ---
    HEART_SPEED: 150,
    HEART_SPEED_SLOW: 75,         // while Cancel (X) is held
    HEART_JUMP_STRENGTH: 180,
    HEART_JUMPHOLD_CUTOFF: 30,    // releasing jump caps upward speed to this
    HEART_MAX_FALL_SPEED: 750,    // default for HeartMaxFallSpeed
    HEART_SIZE: 16,               // walls/platforms collide with the full 16x16 sprite
    HEART_PLATFORM_SNAP: 8.05,    // heart centre sits this far from a platform edge when riding
    // Blue-soul gravity by "down speed" v (speed along gravity, positive = falling)
    GRAVITY_FAST_RISE: 180,       // v <= -120
    GRAVITY_SLOW_RISE: 450,       // -120 < v <= -30
    GRAVITY_APEX: 180,            // -30 < v <= 15
    GRAVITY_FALL: 540,            // 15 < v < GRAVITY_CUTOFF
    GRAVITY_CUTOFF: 240,          // v >= this: no gravity (fall speed stays constant)
    SLAM_SOUND_MIN_SPEED: 330,
    HEART_STEP_PX: 1,             // Custom Movement "pixels per step"

    // Soul hitbox used for DAMAGE (walls and platforms still use the full 16x16 sprite).
    // mode 'box'  : centred axis-aligned box of w x h. Default 6x6, see README "Bug fixes > Soul hitbox":
    //               the largest size where the tight attacks can still be cleared the intended way
    //               (at 8x8 no stand-still-and-hop way through sans_bluebone was found).
    // mode 'point': the original's effective hitbox (only the heart's centre point).
    SOUL_HITBOX: { mode: 'box', w: 6, h: 6 },

    // --- Damage / karma (PlayerDamage group) ---
    DAMAGE_COOLDOWN: 0.033,       // at most one damage tick per ~1/30 s
    BONE_DAMAGE: 1,
    BONE_KARMA: 6,
    BLAST_DAMAGE: 1,
    BLAST_KARMA: 10,
    MENU_BONE_DAMAGE: 1,
    KARMA_REPEAT: 2,              // karma values >= 3 drop to this after the first hit
    KR_MAX: 40,
    // KR drain: first matching row wins (KR >= kr and timer >= t) -> KR-1, HP-1
    KR_DRAIN: [
      { kr: 40, t: 0.033 },
      { kr: 30, t: 0.066 },
      { kr: 20, t: 0.166 },
      { kr: 10, t: 0.5 },
      { kr: 0, t: 1 }
    ],
    START_HP: 92,
    MAX_HP: 92,
    PLAYER_NAME: 'Chara',
    PRACTICE_TARGET: 60,

    // --- Combat zone ---
    ZONE_BORDER: 5,
    RESIZE_SPEED: 480,
    MENU_ZONE: [33, 251, 608, 391],

    // --- Attacks ---
    BONESTAB_SPEED_FACTOR: 10,    // retract/extend speed = Distance * this
    BLASTER_APPROACH: 10,         // lerp factor per second while entering
    BLASTER_FIRE_DELAY: 0.1,
    BLASTER_LEAVE_ACCEL: 30,      // added to LeaveSpeed every TICK (per-tick in the original)

    // --- Text ---
    TEXT_CHAR_TIME: 1 / 30,

    // --- Sans ---
    SANS_REPEAT_SPEED: -900,
    SANS_REPEAT_DECEL: 45,
    SHAKE_STEP: 1 / 30,

    // Tint colours (C2 Tint effect percentages / 100)
    TINT: {
      RED_HEART: [1, 0, 0],
      BLUE_HEART: [0, 0.2353, 1],
      BLUE_ATTACK: [0.0784, 0.6627, 1],
      ORANGE_ATTACK: [1, 0.6274, 0.2509],
      GREY_TEXT: [0.75, 0.75, 0.75],
      DISABLED_TEXT: [0.5, 0.5, 0.5],
      KARMA_TEXT: [1, 0, 1],
      BLACK: [0, 0, 0],
      WHITE: [1, 1, 1],
      GREEN: [0, 1, 0]
    },

    // --- Sans between-turn dialog (fix for "Sans dialog is missing") ---
    DIALOG_ENABLED: true,

    // --- Fixes for known bugs of the original. Set any to false to get the original behaviour. ---
    FIXES: {
      platformAcceleration: true, // readme: platforms4/4hard platform should accelerate from 0
      teleportResetsVelocity: true, // #168: HeartTeleport kept the soul's speed, so a jump held through a multi3 switch carried over
      jumpSetsVelocity: true,     // #159: jump ADDED -180 to the current fall speed, so late jumps came out short
      slamOwnAxis: true,          // #156: side-wall contact swallows a vertical slam (no sound, no damage)
      silentMenuBack: true,       // #157: backing out of a menu plays MenuSelect
      verticalPlatforms: true,    // #135: platform direction 1/3 moves sideways
      resizeUnpin: true,          // #93: shrinking box can leave the soul stuck against a border
      speechNewlines: true,       // #149: "\n" in SansText starts a new line
      resizeAutoAlias: true       // docs name CombatZoneResizeAuto; code only had CombatZoneResizeInstant
    },

    TOUCH_CONTROLS: 'auto',       // 'auto' (touch devices only), true (always) or false (never)
    DEBUG_HITBOX: false           // draw the damage hitbox (also toggled with the H key)
  };
})(window.BTS = window.BTS || {});
