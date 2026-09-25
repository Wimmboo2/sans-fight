/*
 * items.js - items and battle text from the original project (Items.xml and Battle.xml).
 * This text is kept exactly as the original project had it.
 */
(function (BTS) {
  'use strict';

  BTS.ITEMS = {
    // ItemType (0 = heal), heal amount, full name, short name
    db: [
      { type: 0, heal: 99, name: 'Butterscotch Pie', short: 'Pie' },
      { type: 0, heal: 90, name: 'Instant Noodles', short: 'I.Noodles' },
      { type: 0, heal: 60, name: 'Face Steak', short: 'Steak' },
      { type: 0, heal: 40, name: 'Legendary Hero', short: 'L. Hero' }
    ],
    inventory: [0, 1, 2, 3, 3, 3, 3, 3],

    infoText: {
      kr0: '* You felt your sins crawling\n  on your back.',
      kr10: '* You felt your sins weighing\n  on your neck.',
      kr20: '* KARMA coursing through your\n  veins.',
      badTime: "* You feel like you're going to\n  have a bad time.",
      hit13: '* Sans is taking a break.',
      hit15: '* The REAL battle finally begins.',
      hit19: "* Reading this doesn't seem\n  like the best use of time.",
      hit20: '* Sans is starting to look\n  really tired.',
      hit21: '* Sans is preparing something.',
      hit22: '* Sans is getting ready to\n  use his special attack.',
      check: '* SANS 1 ATK 1 DEF\n* The easiest enemy.\n* Can only deal 1 damage.',
      check2: "* Can't keep dodging forever.\n* Keep attacking."
    }
  };
})(window.BTS = window.BTS || {});
