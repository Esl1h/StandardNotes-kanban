import fc from 'fast-check';
import fs from 'fs/promises';
import { parseMarkdown } from './parseMarkdown';
import { convertStateToMarkdown } from './convertStateToMarkdown';

const rt = (text: string) => convertStateToMarkdown(parseMarkdown(text));

test('round-trip is idempotent for arbitrary text', () => {
  fc.assert(fc.property(fc.string(), (s) => rt(rt(s)) === rt(s)));
});

// Random text rarely forms valid structure, so also draw from the lines
// the parser actually has branches for.
const knownLine = fc.constantFrom(
  '',
  '   ',
  '# Lane',
  '## Lane',
  '#',
  '# [id:abc123]',
  '* Card',
  '* Card [id:def456]',
  '- Card',
  '+ Card',
  '*',
  '  * Description: text',
  '  * Description:',
  '\t* Description: text',
  '    * Description: text',
  '  * Due: 2026-01-01',
  '  * Label: red',
  '    > continuation',
  '    >',
  '  * Checklist:',
  '    [x] done',
  '    [ ] todo',
  '    [x] ',
  '    [x] done\r',
  '  * Comments:',
  '  * Comments: trailing',
  '    * comment',
  '    * Due: not a field',
  '\t\t* comment',
  'loose text',
  '    * loose',
  '--- ',
  'text\r'
);

test('round-trip is idempotent for structured lines in any order', () => {
  fc.assert(
    fc.property(fc.array(knownLine, { maxLength: 30 }), (lines) => {
      const text = lines.join('\n');
      return rt(rt(text)) === rt(text);
    }),
    { numRuns: 2000 }
  );
});

test.each([
  '# A\n* c1\nnota solta\n# B\n* c2\n',
  '\n\n# A\n* c1\n',
  '# A\n* c1\n\t* Description: x\n',
  '# A\n- c1\n',
  '# A\n* c1\n  * Description:\n',
  '## A\n* c\n',
])('stays stable after repeated saves: %j', (text) => {
  const once = rt(text);
  expect(rt(once)).toBe(once);
  expect(rt(rt(once))).toBe(once);
});

test('blank lines are never reported as parsing errors', () => {
  const { parsingErrors } = parseMarkdown('\n\n# A\n\n\n* c1\n\n');
  expect(parsingErrors).toEqual([]);
});

test('an unrecognized line stays under the card it was written in', () => {
  const text = '# A\n* c1\nnota solta\n# B\n* c2\n';
  const { boardData, parsingErrors } = parseMarkdown(text);

  expect(boardData.lanes[0].cards[0].extraLines).toEqual(['nota solta']);
  expect(boardData.lanes[1].cards[0].extraLines).toBeUndefined();
  expect(parsingErrors.map((e) => e.lineText)).toEqual(['nota solta']);
  expect(rt(text)).toBe('# A\n* c1\nnota solta\n\n# B\n* c2\n');
});

test('an unrecognized line before any lane is kept at the top', () => {
  const text = 'intro\n# A\n* c1\n';
  expect(parseMarkdown(text).preamble).toEqual(['intro']);
  expect(rt(text)).toBe('intro\n\n# A\n* c1\n');
});

test('an unrecognized line under a lane without cards stays in that lane', () => {
  const text = '# A\nnote\n\n# B\n* c\n';
  expect(parseMarkdown(text).boardData.lanes[0].extraLines).toEqual(['note']);
  // An empty lane already renders with one extra newline before the next.
  expect(rt(text)).toBe('# A\nnote\n\n\n# B\n* c\n');
});

test('a plain text note without lanes is preserved', () => {
  expect(rt('just some text\nsecond line')).toBe(
    'just some text\nsecond line\n'
  );
});

test('examples/Kanban.txt round-trips byte for byte', async () => {
  const file = await fs.readFile('./examples/Kanban.txt', 'utf8');
  expect(rt(file)).toBe(file);
});
