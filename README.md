# Bad Time Simulator (Sans Fight) — JavaScript port

A standalone HTML5 Canvas + vanilla JavaScript port of **Jcw87's Construct 2 project
"Bad Time Simulator (Sans Fight)"** (<https://github.com/Jcw87/c2-sans-fight>), a fan recreation of the sans fight
from Undertale. Undertale, its characters, sprites and music are by Toby Fox. This is a non-commercial fan project and
is not affiliated with Toby Fox. See [CREDITS.md](CREDITS.md).

There are no frameworks, no build step and no Construct runtime. It plays like the original, except for the bug fixes
listed below.

## Running it

- **Double-click `index.html`**, or
- **serve the folder**: `python3 -m http.server` or `npx serve`, then open the printed address.

Click (or press any key) on the start screen to enable sound. The original only shipped `.ogg` audio, so browsers
without Ogg Vorbis support (older Safari) will be silent.

URL parameters from the original still work: `?mode=normal`, `?mode=endless1`, `?mode=endless2`,
`?mode=single&attack=sans_bonegap1`.

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move / jump (blue soul: jump = the direction away from gravity) | Arrow keys or WASD | Left stick or d-pad |
| Confirm / advance text | Z or Enter | A (button 0) |
| Cancel / back / skip text; hold to move at half speed; quits Single-attack mode | X or Shift | X (button 2) |
| Menu (unused, as in the original) | C or Ctrl | Start (button 9) |
| Show the damage hitbox (debug) | H | |

On touch screens, A/B buttons and a floating d-pad appear automatically. Set `TOUCH_CONTROLS` in
`js/constants.js` to `true` or `false` to force them on or off.

## Modes

Everything from the original: **Normal**, **Practice**, **Endless** (phase 1 / 2), **Single attack** (all 24
attacks) and **Custom attack**. There's also a new **Credits** screen.

## Custom attacks

Custom attacks use the CSV format from the original project's
[custom attacks guide](https://github.com/Jcw87/c2-sans-fight/blob/master/Documentation/README.MD), so existing
custom attacks work unchanged. In the menu, *Custom attack → Load file* picks a `.csv`; *Paste text* opens a box you
can paste into. Both work from `file://`.

The rules, matching the original engine:

- `delay,Function,arg1,arg2,...` per line. The delay is in seconds after the previous line.
- `delay,:Label` lines are jump targets. `$Name` reads a variable.
- Function names are case-insensitive, unknown names are ignored, and up to 9 arguments are allowed.

What differs from the guide (all backwards compatible):

- `CombatZoneResizeAuto` (the guide's name) works as an alias of `CombatZoneResizeInstant` (the only name the
  original engine knew).
- `Platform` takes an optional 7th argument, **Acceleration** in px/s². Leave it empty for the original behavior.
- `\n` inside `SansText` starts a new line in the speech bubble.
- Windows (CRLF) line endings are always fine.
- Guide errata: `ANGLE` takes the variable name first (`ANGLE,Var,x1,y1,x2,y2`). `JMPG` jumps if a > b and `JMPNG` if
  a ≤ b. `SIN`/`COS` take degrees. `SansSlam` directions are 0 = right, 1 = down, 2 = left, 3 = up. The screen is
  640×480.

## Editing things

- **What Sans says between turns:** `js/data/sans-dialog.js` (plain data, comments explain the format).
- **Every tunable value** (speeds, gravity, jump strength, damage, karma, hitbox, timings, tick rate, each bug fix
  on/off): `js/constants.js`.
- Items and battle text: `js/data/items.js`. Credits text: `js/data/credits.js`.

## What changed compared to the original

- **Rewritten in plain JavaScript.** Construct 2 event sheets became small modules (see
  [PORTING_NOTES.md](PORTING_NOTES.md) for the full map). The files are classic `<script>`s, not ES modules, because
  browsers refuse to load modules from `file://`. The only Construct material used was the project's own images,
  sounds and attack CSVs.
- **Fixed 60 Hz timestep.** The original is not locked to 30 fps: it moves everything by `speed × dt` at the
  monitor's refresh rate, usually 60 Hz. The port runs its logic at a fixed 60 Hz (`TICK_RATE`), so it plays the way
  the original did on a normal monitor, including its per-tick effects.
- **Pixel-perfect scaling.** It renders at 640×480 and scales up by whole numbers (high-DPI aware, no smoothing).
- **Web Audio** with a click-to-start screen. This fixes "music doesn't play" (issue #36), which was caused by
  browser autoplay blocking. On `file://` it falls back to `<audio>` elements.
- **New:** Credits screen, paste box for custom attacks, optional touch controls, and a hitbox debug view (H).
- **Input:** a key tap shorter than one frame still counts as a press.
- **Dropped:** the "your browser doesn't support WebGL" sans speech (the canvas renderer supports every effect) and
  the service-worker "update available" notice.

## Bug fixes

Each fix below can be switched off in `js/constants.js` (`FIXES`) to get the original behavior. Every one was
checked by running the port with the fix **off** (the bug appears) and **on** (it's gone), using a headless copy of
the game.

### From the original readme's "Known Issues"

**1. Soul hitbox.** In the original, the soul only took damage when its **center point** was inside an attack. It
also checked a 4×4 hitbox sprite, but that check was always true whenever the point check was, so in practice the
hitbox was one pixel. The port uses a **centered 6×6 box** (`SOUL_HITBOX`); walls and platforms still use the full
16×16 sprite.
*Why 6×6:* I don't know Undertale's real soul hitbox and don't claim this matches it. It's a gameplay choice: the
largest centered square where every tight attack I checked can still be cleared **the intended way**, without
frame-perfect timing. For example, in `sans_bluebone` you stand still for the blue bones and hop the white ones.
I checked with a search that plays the real game logic and looks for a hit-free sequence of hops (Up presses of
various lengths, no walking):

| Hitbox | sans_bluebone | sans_bonegap1 | sans_bonegap1fast | sans_bonegap2 (3 seeds) | platforms4 / 4hard (walking, no jumping) |
|---|---|---|---|---|---|
| point (original) | found | found | found | found | found |
| **6×6 (default)** | found | found | found | found | found |
| 7×7 | found, only with exact 7–9-frame hops | – | found | – | – |
| 8×8 | none found | found | found | found | found |
| 10×10 | none found | found | none found | found | found |

At 8×8 and 10×10 the search found no hop-only way through `sans_bluebone`: a hop that clears the white bone can't
land and stop before the next blue bone arrives. When I also let the search walk during hops, it *did* find a way
through at 8×8 and 10×10, but only by walking toward the incoming bone mid-hop, which isn't how the attack is meant
to be dodged. "None found" means the search didn't find one; it isn't proof that none exists.
`mode: 'point'` brings the original hitbox back.

**2. Platform acceleration (`sans_platforms4`, `sans_platforms4hard`).** The platform now accelerates from 0 to its
full 90 px/s at **84 px/s²** (reaching full speed in about 1.07 s) instead of starting at full speed. This is done
with the new optional 7th `Platform` argument, so other attacks and old custom attacks are unaffected.
*Check:* the platform and bones don't react to the soul, so I recorded the whole attack and ran an exhaustive search
over every possible soul position, tick by tick. The soul could walk left/right on the platform but not jump.
- With the original instant start, `sans_platforms4hard` **can't** be dodged without jumping (even with the original
  point hitbox the soul gets trapped at 7.2 s), and `sans_platforms4` can't either once the hitbox is 8×8.
- With 84 px/s², both are dodgeable without jumping for every hitbox size tested (point, 6, 8, 10 px). 84 sits in
  the middle of the range (82–86) where, measured with an 8×8 box, no part of the ride needs a tighter path than
  the starting position.
- Standing completely still does get you hit, whatever the acceleration. You have to walk a bit.

**3. Sans dialog.** Sans now talks between turns through the original speech bubble (typewriter, voice, Z to
continue, X to skip). The lines live in `js/data/sans-dialog.js`: which turns, what he says, and optional faces.
Following the original author's choice, **none of it is Undertale's text**. Every line is an original placeholder
meant to be replaced. It's on in Normal mode by default.

### From the original repository's open issues

| Issue | Problem | Fix | Checked |
|---|---|---|---|
| #159 | A jump pressed on the tick before landing *added* −180 to the fall speed, so it came out short or not at all. | The jump sets the upward speed instead. | Worst jump over every press tick: 0 px → 66.9 px |
| #168 | In `sans_multi3`, `HeartTeleport` kept the soul's speed, so a jump still held when the blue-bone sub-attack started carried over, and the blue bones hit. | `HeartTeleport` resets the soul's speed. | Held-jump case: 4 hits → 0. I could **not** reproduce hits with no keys held at all, as the issue describes, so this may not cover everything the reporter saw. |
| #156 | During a slam, touching a side wall used up the slam, so there was no slam sound and **no slam damage** if you hugged a wall (an exploit in the final attack). | A slam only resolves on the axis it travels along. | Wall-hug slam: no sound / no damage → sound + 1 damage |
| #157 | Backing out of a menu with X played the MenuSelect sound. | Backing out is silent. | 1 sound → 0 |
| #135 | `Platform` direction 1 or 3 moved sideways (its angle was set while its speed was 0). | Velocity is set straight from the direction. | dir 1 / 3: (60,0),(−60,0) → (0,60),(0,−60) |
| #93 | When the box shrank onto the soul, it was left exactly touching the wall. Wall checks count touching edges as overlapping (the port does too, to match the original's behavior), so the soul got stuck (couldn't slide along a wall, frozen in corners). | The push-out leaves a 0.05 px gap, the same trick the original already used for platforms. | Sliding along the wall after a shrink: 0 px → 60.8 px |
| #149 | No way to write multi-line speech-bubble text in a CSV. | `\n` in `SansText` is a line break. | ✓ |
| docs | The guide says `CombatZoneResizeAuto`, which the engine didn't know. | Accepted as an alias. | ✓ |
| #36 | Music doesn't play. | Browser autoplay blocking; the click-to-start screen unlocks audio. | ✓ |

**Looked at, not changed:**
- **#21** (platforms only work when gravity points down) doesn't reproduce with the current original code, which
  already carries the soul with sideways gravity.
- **#82** (bone stab retract speed), **#37 / #67 / #91** (details of how Undertale does it) and **#158** (font
  spacing) are claims about Undertale I can't verify without Undertale's data.
- **#140** (input lag) has no details. The port polls input every tick and also catches taps shorter than a frame.
- The rest are feature requests.

## Folder structure

```
index.html            page, canvas, file picker and paste box
js/main.js            boot, click-to-start, scene switching (credits header at the top)
js/constants.js       all tunable values and bug-fix switches
js/*.js               core: loop, input, audio, assets, sprites, state, RNG, scheduler
js/render/            canvas scaling, tinting, sprite / 9-patch / tiled / sprite-font drawing
js/physics/           the Construct-style step movement the soul uses
js/soul.js            red and blue soul
js/battle/            battle flow, combat zone, Sans, damage and karma
js/attacks/           timeline sequencer, script commands, bones, platforms, blasters, menu bones
js/ui/                menus, battle menu, text and speech bubbles, custom attacks, touch, credits
js/data/              attack scripts, sans dialog, items/text, fonts, sprite metadata, credits
assets/               original images, fonts, sounds, music and icons (unmodified)
```
