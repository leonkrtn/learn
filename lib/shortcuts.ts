// Every keyboard shortcut of the app, for the help page under Settings and the hints next to the tools.
// A combo is written with `+`: `alt`, `mod` (⌘ on a Mac, Ctrl elsewhere) and `shift` are modifiers.
// Letter shortcuts with Alt match the physical key (e.code), so ⌥ works on a Mac although it types another character there.

export type Shortcut = { keys: string[]; label: string };
export type ShortcutGroup = { name: string; where: string; items: Shortcut[] };

export const SHORTCUTS: ShortcutGroup[] = [
  {
    name: 'Everywhere in a subject', where: 'Also while typing an answer',
    items: [
      { keys: ['alt+C'], label: 'Open or close your cheatsheet' },
      { keys: ['alt+N'], label: 'Open or close your notes' },
      { keys: ['Esc'], label: 'Close the open drawer' },
    ],
  },
  {
    name: 'Practice, cycle, problem sets and mock exam', where: 'When no answer field has the focus',
    items: [
      { keys: ['Enter'], label: 'Check the answer, then go to the next question' },
      { keys: ['A', 'B', 'C', 'D', 'E'], label: 'Choose an option of a multiple-choice question' },
      { keys: ['T', 'F'], label: 'True or false' },
      { keys: ['R'], label: 'Same question with new numbers (after checking)' },
      { keys: ['←', '→'], label: 'Earlier and later questions of a set' },
      { keys: ['Enter'], label: 'In an answer field: next field, or check after the last one' },
    ],
  },
  {
    name: 'Flashcards', where: '',
    items: [
      { keys: ['Space', 'Enter'], label: 'Show the answer' },
      { keys: ['1', '2', '3', '4'], label: 'Again, Hard, Good, Easy' },
      { keys: ['Space', 'Enter'], label: 'Good, once the answer is shown' },
    ],
  },
  {
    name: 'Slides', where: 'In the single-slide view',
    items: [
      { keys: ['←', '→'], label: 'Previous and next slide (also Page Up and Page Down)' },
      { keys: ['S'], label: 'Star or unstar the slide' },
      { keys: ['F'], label: 'Full view of the slide' },
      { keys: ['N'], label: 'Full view with the notes' },
      { keys: ['Esc'], label: 'Leave the full view or stop placing a pin' },
    ],
  },
  {
    name: 'Note and cheatsheet editor', where: 'In the text field',
    items: [
      { keys: ['mod+Enter'], label: 'Save' },
      { keys: ['/beta'], label: 'Type / or \\ and a name to insert a symbol or formula' },
      { keys: ['↑', '↓'], label: 'Move through the suggestions' },
      { keys: ['Enter', 'Tab'], label: 'Insert the suggestion' },
      { keys: ['Esc'], label: 'Close the suggestions' },
    ],
  },
  {
    name: 'Formula editor', where: '',
    items: [
      { keys: ['Enter'], label: 'Insert the formula' },
      { keys: ['Esc'], label: 'Cancel' },
    ],
  },
];

const MAC: Record<string, string> = { alt: '⌥', mod: '⌘', shift: '⇧' };
const PC: Record<string, string> = { alt: 'Alt', mod: 'Ctrl', shift: 'Shift' };

/** The keys of one combo as they are labelled on the keyboard: ['⌥', 'C'] on a Mac, ['Alt', 'C'] elsewhere. */
export function comboKeys(combo: string, mac: boolean): string[] {
  const parts = combo.length > 1 && combo.includes('+') ? combo.split('+') : [combo];
  return parts.map(p => (mac ? MAC : PC)[p] ?? p);
}

/** One combo as plain text, for titles: "⌥C" on a Mac, "Alt+C" elsewhere. */
export function comboText(combo: string, mac: boolean): string {
  return comboKeys(combo, mac).join(mac ? '' : '+');
}

export function isMacUA(ua: string): boolean {
  return /Macintosh|Mac OS X|iPad|iPhone/.test(ua);
}
