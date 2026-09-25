# Credits

- **Original project:** the Construct 2 project "Bad Time Simulator (Sans Fight)" by **Jcw87**:
  <https://github.com/Jcw87/c2-sans-fight>
- **Undertale:** Undertale, its characters, sprites and music are by **Toby Fox**. This is a non-commercial fan
  project and is not affiliated with Toby Fox.
- **This version:** a pure JavaScript port with bug fixes, based on Jcw87's work.

## What comes from where

| Part | Source |
|---|---|
| Sprites, fonts, sound effects, music (`assets/`) | From the original project's repository, copied unchanged. They were ripped from Undertale (Toby Fox). |
| The 24 built-in attack scripts (`js/data/attacks.js`) | Jcw87's CSV files, embedded verbatim. The one change is the platform acceleration argument in `sans_platforms4` / `sans_platforms4hard`. |
| Game rules, timings, menus, battle text (`js/data/items.js`) | Re-implemented from Jcw87's Construct 2 event sheets. The text is kept as the original project had it. |
| Custom attack format | The format from the original project's custom attacks guide (`Documentation/` in Jcw87's repository), written by its contributors. |
| All JavaScript | New code written for this port. No Construct 2 runtime or exported code is included. |
| Between-turn Sans lines (`js/data/sans-dialog.js`) | Placeholder lines written for this port. They are not from Undertale. |

## License note

The original repository doesn't state a license. This port redistributes Jcw87's attack scripts and the Undertale
assets that project used, as a non-commercial fan project, with full credit. If you are a rights holder and want
something removed, please open an issue.
