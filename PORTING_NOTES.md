# Porting notes

These notes cover how the Construct 2 project **"Bad Time Simulator (Sans Fight)" by Jcw87**
(<https://github.com/Jcw87/c2-sans-fight>) was ported to plain HTML5 Canvas + vanilla JavaScript.
The C2 source (`.caproj`, event sheets, layouts, animations) was used as reference only. None of it is shipped here.

## Decisions

- **Classic scripts, not ES modules.** Browsers refuse to load ES modules or `fetch()` local files from `file://`.
  Every module is therefore a plain `<script>` that attaches itself to one global namespace (`window.BTS`), and
  `index.html` loads them in dependency order. This lets the game run either by double-clicking `index.html` or by
  serving the folder. There is no build step.
- **Fixed 60 Hz logic tick.** The original is *not* locked to 30 fps. Every speed in the event sheets is
  `px/sec × dt`, and C2 ticks at the display refresh rate (usually 60 Hz, with dt capped at 1/30). The "×30" in
  the custom-attack guide only converts Undertale's per-frame values into px/s. Some things happen once per tick
  (blaster exit acceleration, 1 px movement stepping, the damage throttle), so a fixed 60 Hz step reproduces what
  players saw on a normal monitor. The tick rate lives in `js/constants.js`.
- **Jcw87's existing text is kept as-is.** That covers the flavor text, the Check text, item names, and the two lines
  inside `sans_intro.csv`. The new between-turn dialog (`js/data/sans-dialog.js`) contains only original placeholder
  lines.
- **Line endings.** The shipped CSVs use CRLF. C2 split them on `\n` only, which left a `\r` glued to the last
  column. The port strips `\r`, so attack files behave the same whatever their line endings. (C2 would have tried to
  call `"TLResume\r"` at the end of `sans_spare`'s first line. It's unclear whether that ever mattered in practice;
  closed issue #58 suggests the spare turn did end.)
- **Pixels are never read back.** Images loaded from `file://` taint the canvas, so tinting uses composite
  operations on offscreen canvases and never calls `getImageData`.

## Map: Construct 2 → port

| Construct 2 source | Port |
|---|---|
| `Globals.xml` (HP 92, MaxHP 92, KR, KR_T, modes, name "Chara", PracticeTarget 60) | `js/state.js` (+ values in `js/constants.js`) |
| `InputManagement.xml` (VPad Up/Down/Left/Right/Confirm/Cancel/Menu + `Last*`) | `js/input.js`: arrows/WASD, Z/Enter = confirm, X/Shift = cancel (hold = half speed), C/Ctrl = menu; gamepad (deadzone 25 %, d-pad 12–15, buttons 0/2/9); `js/ui/touch.js` for A/B + floating d-pad (24 px zone) |
| `Fonts.xml` + SpriteFont instances (cell size, charset, per-char widths) | `js/render/spritefont.js` + font table in `js/assets.js` |
| `RPGText.xml` (typewriter 1 char / (1/30) s, voice blip, interactive Z/X, timeout, EndFunc) + `SansText` bubble | `js/ui/dialog.js` |
| `Timeline.xml` (TLPlay/Pause/Resume/Stop, labels, `$vars`, CPU ops, jumps, 1000 lines/tick guard, panic) | `js/attacks/sequencer.js` + `js/attacks/commands.js` (case-insensitive function names, like C2's Function plugin) |
| `AttackLoader.xml` (24 CSVs via AJAX) | `js/data/attacks.js` (CSVs embedded verbatim) + `js/ui/customattack.js` (file picker + paste box) |
| `Items.xml` (Pie 99, I.Noodles 90, Steak 60, L. Hero 40; inventory 0,1,2,3,3,3,3,3) | `js/data/items.js` |
| `Menus.xml` (menu stack, directional nearest-item cursor, back actions, cursor/select sounds) | `js/ui/menu.js` |
| `MainMenu.xml` (Normal / Practice / Endless phase 1-2 / Single / Custom, `?mode=` & `?attack=`, scrolling list) | `js/ui/mainmenu.js` (+ **Credits** → `js/ui/credits.js`) |
| `Battle.xml` turn flow (Start/End/RunAttack, HitAttempts/NextAttack tables, info text, win, practice mode) | `js/battle/battle.js` |
| `Battle.xml` › BattleMenu (FIGHT target / TargetChoice / Strike / MISS / dodge, ACT Check, ITEM pages, MERCY Spare) | `js/ui/battlemenu.js` |
| › PlayerMovement (red 150 / 75 px/s; blue gravity 540/180/450/180, jump 180, hold cutoff 30, max fall 750, slams) | `js/soul.js` |
| › Bones + BoneStab / › GasterBlasters / › Platforms / › MenuBones | `js/attacks/bones.js` / `blasters.js` / `platforms.js` / `menubones.js` |
| › CombatZone (resize at ResizeSpeed, finish callback, 5 px borders, heart clamp) | `js/battle/combatzone.js` |
| › SansAnimation + SansShake (Idle / HeadBob / Tired, body parts, dodge, repeat scroll, 1/30 s shake) | `js/battle/sans.js` |
| › PlayerDamage + HPBar (0.033 s throttle, karma 6/10 → 2, blue = hurts while moving, orange = hurts while still, KR drain table, death) | `js/battle/damage.js` + `js/ui/hud.js` |
| Custom Movement behavior ("horizontal then vertical", 1 px steps, On step, Stop stepping) | `js/physics/stepmove.js` (same algorithm: `round(dist/px)` steps, min 1, revert to previous step) |
| Solid (borders) / Jump-thru (Platform1) | plain rectangles + the directional one-way checks from `HeartCheckSolid` |
| Tint effect | cached tinted canvases (`js/render/tint.js`) |
| Layers, "Destination in" clipper/unclipper | fixed draw order; `ctx.clip()` for the CombatZoneClipped layer (BoneV, BoneStab) |
| Families (Bone, BoneStab, Attack9Patch, AttackSprite, AttackTiled, RPGText, UIButtons) | shared entity fields (damage, karma, color) + typed lists |
| Audio plugin (tags Music / GasterBlaster / GasterBlast / GasterBlast2, playback rate, pause) | `js/audio.js` (Web Audio when served, pooled `<audio>` on `file://`) |
| System `Wait`, "Go to layout" | `js/scheduler.js` (game-time timers), scene switch at end of tick |
| Dropped | WebGL "NoEffects" speech (canvas supports every effect used), service-worker update notice, AJAX / Browser / FileChooser plugins |

Draw order (C2 layers): Background → Enemies → Buttons → CombatZone → CombatZoneClipped (clipped to the box) →
Overlay (box frame; opaque black during `BlackScreen`) → Touch (screen shake doesn't move it).
Sprites are drawn at their layout scale: Sans parts ×2, touch buttons ×2, Strike ×1.5, blaster size table 0/1/2.

## Per-tick order (same as C2)

1. Behaviors: heart step-movement (step callbacks run immediately), platform movement, heart-shard movement.
2. Events, in sheet order: input → timeline while-loop, then `T += dt` → RPGText → battle groups
   (BattleMenu, Platforms, PlayerMovement, Bones, BoneStab, GasterBlasters, MenuBones, CombatZone,
   SansAnimation, PlayerDamage, HPBar, SansShake, PracticeMode).
3. Pending `Wait`s, then any scene change.

## Things in the C2 source that were ambiguous or surprising

- **Hitbox.** Damage required *both* "the heart's center point is inside the attack" and "the 4×4 PlayerHitbox
  overlaps the attack". The first test implies the second, so in practice the original hitbox was one point.
- **Docs vs code.** The guide says `CombatZoneResizeAuto`, but the event sheets only implement
  `CombatZoneResizeInstant` (the port accepts both). `ANGLE` takes a variable name first. JMPG jumps if
  `a > b`, and JMPNG jumps if `a <= b` (the guide's text for both is a copy-paste error). SIN and COS take degrees.
- **Missing parameters.** C2's `Array.At()` returns `0` for missing columns. The port treats a missing column as an
  empty string, which converts to 0 numerically, so text parameters never show a stray "0".
- **Beam draw order.** "Move to object, Where = 0" is read as *behind*. That puts the red damage strip of a Gaster
  Blaster beam under the white beam, where it can't be seen.

## Bug fixes

The fixes (soul hitbox, platform acceleration, sans dialog, and the known issues from the original's tracker), with
how each was checked, are listed in [README.md](README.md#bug-fixes). Each one can be switched off with
`BTS.C.FIXES` in `js/constants.js` to get the original behavior back.
