/*
 * sans-dialog.js - what Sans says between turns. EDIT FREELY.
 *
 * The original project left this out on purpose (it didn't want to reuse Undertale's script). Every line
 * below was written for this port as a placeholder; none of it is from Undertale. Replace it with your own.
 *
 * Format
 *   Each entry is a list of lines. Sans says them one at a time (Z/Enter = next, X/Shift = skip typing)
 *   before that turn's attack starts.
 *   A line is either a string, or { text: '...', head: 'Wink' } to change his face while he says it.
 *   Faces: Default, LookLeft, Wink, ClosedEyes, NoEyes, BlueEye, Tired1, Tired2.
 *   Use \n for a line break. Keep lines short: the bubble fits about 4 lines of ~26 characters.
 *
 * Keys
 *   phase1[n]  before the phase 1 turn whose attack number is n (0 = the very first turn)
 *   spare      before Sans's break turn
 *   phase2[n]  before the phase 2 turn n
 *   final      before his special attack
 *   win        after you survive the special attack (these two lines are from the original project)
 */
(function (BTS) {
  'use strict';

  BTS.SANS_DIALOG = {
    modes: ['normal'],   // simulator modes that show between-turn dialog: normal, endless, single, practice
    once: true,          // show each entry only once per battle

    phase1: {
      1: ["so. you're still standing.", "that's... fine. totally fine."],
      2: ['quick tip: blue means stop.', { text: "or was it go? eh.\nyou'll figure it out.", head: 'Wink' }],
      4: ['i rented these platforms,\nso try not to scuff them.'],
      7: [{ text: "this next one's a slow ride.\nenjoy the scenery.", head: 'LookLeft' }],
      10: ["okay, speeding things up.\ni've got a nap scheduled."],
      13: [{ text: '...', head: 'ClosedEyes' }, "wow. you're committed to\nthis, huh."]
    },

    spare: ["i'm taking five.", 'feel free to stand there\nand think about it.'],

    phase2: {
      0: [{ text: 'okay. recess is over.', head: 'NoEyes' }],
      3: ['hope you like surprises\nfrom the floor.'],
      7: ["i'm running low on tricks.", { text: 'low. not out.', head: 'Wink' }]
    },

    final: [{ text: 'alright. one last thing.', head: 'Tired1' }, 'no refunds.'],

    win: ['huff... puff...', 'alright, i guess\nyou win.']
  };
})(window.BTS = window.BTS || {});
