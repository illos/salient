import { expect, test } from 'vitest';
import { CommandIdentities } from '../../web/command-identities';

test('a lost reply retries the same command while a changed intent gets a new identity', () => {
  let sequence = 0;
  const ids = new CommandIdentities(() => `command-${++sequence}`);
  const pause = JSON.stringify(['session.transition', { id: 's1', revision: 0, action: 'pause' }]);
  const resume = JSON.stringify([
    'session.transition',
    { id: 's1', revision: 1, action: 'resume' },
  ]);
  const committed = new Set<string>();
  let writes = 0;
  const attempt = (key: string, loseReply: boolean) => {
    const id = ids.forPayload(key);
    if (!committed.has(id)) {
      committed.add(id);
      writes++;
    }
    if (loseReply) throw new Error('Reply lost after commit');
    ids.acknowledged(key);
    return id;
  };
  expect(() => attempt(pause, true)).toThrow('Reply lost');
  expect(ids.forPayload(pause)).toBe('command-1');
  expect(attempt(pause, false)).toBe('command-1');
  expect(attempt(resume, false)).toBe('command-2');
  expect(writes).toBe(2);
  expect(ids.forPayload(pause)).toBe('command-3');
});

test('show, hide, show is a new intent even if the first show reply was lost', () => {
  let sequence = 0;
  const ids = new CommandIdentities(() => `command-${++sequence}`);
  const first = ids.forPayload('show');
  expect(ids.forPayload('show')).toBe(first);
  const hide = ids.forPayload('hide');
  expect(hide).not.toBe(first);
  ids.acknowledged('hide');
  expect(ids.forPayload('show')).not.toBe(first);
  // A changed intent also supersedes a failed/ambiguous one before acknowledgment.
  const hidden = ids.forPayload('hide');
  ids.forPayload('show');
  expect(ids.forPayload('hide')).not.toBe(hidden);
});
