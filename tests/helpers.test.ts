import { describe, expect, test } from 'bun:test';
import { applyLinePrefix, formatTag, runPrefixed } from '../src/helpers.ts';

describe('applyLinePrefix', () => {
  test('buffers an incomplete line until a newline arrives', () => {
    expect(applyLinePrefix('', 'hel', '[t] ')).toEqual(['hel', '']);
    expect(applyLinePrefix('hel', 'lo\nwo', '[t] ')).toEqual(['wo', '[t] hello\n']);
  });

  test('prefixes every complete line, including blanks', () => {
    expect(applyLinePrefix('', 'a\n\nb\n', '[t] ')).toEqual(['', '[t] a\n[t] \n[t] b\n']);
  });

  test('strips a trailing CR so CRLF does not keep the carriage return', () => {
    expect(applyLinePrefix('', 'a\r\nb\r\n', '[t] ')).toEqual(['', '[t] a\n[t] b\n']);
  });

  test('eof flushes a leftover partial line with a trailing newline', () => {
    expect(applyLinePrefix('hello', '', '[t] ', true)).toEqual(['', '[t] hello\n']);
  });

  test('eof with an empty pending buffer writes nothing', () => {
    expect(applyLinePrefix('', '', '[t] ', true)).toEqual(['', '']);
  });

  test('a command that already ended with newline does not get an extra line', () => {
    expect(applyLinePrefix('', 'hello\n', '[t] ', true)).toEqual(['', '[t] hello\n']);
  });

  test('the prefix string is prepended literally', () => {
    expect(applyLinePrefix('', 'x\n', '[web]')).toEqual(['', '[web]x\n']);
  });
});

describe('formatTag', () => {
  test('wraps the label in dim square brackets with a trailing space', () => {
    expect(formatTag('git status')).toBe('\x1b[2m[git status]\x1b[0m ');
  });
});

function captureWrites(stream: NodeJS.WriteStream): { text: () => string; restore: () => void } {
  const chunks: string[] = [];
  const original = stream.write;
  stream.write = ((chunk: unknown, encodingOrCb?: unknown, cb?: unknown) => {
    if (typeof chunk === 'string') {
      chunks.push(chunk);
    } else if (chunk instanceof Uint8Array) {
      chunks.push(new TextDecoder().decode(chunk));
    } else {
      chunks.push(String(chunk));
    }
    if (typeof encodingOrCb === 'function') {
      encodingOrCb();
    } else if (typeof cb === 'function') {
      cb();
    }
    return true;
  }) as typeof stream.write;
  return {
    text: () => chunks.join(''),
    restore: () => {
      stream.write = original;
    },
  };
}

describe('runPrefixed', () => {
  test('prefixes each stdout line', async () => {
    const out = captureWrites(process.stdout);
    const err = captureWrites(process.stderr);
    try {
      await runPrefixed('out', 'printf "hello\\nworld\\n"');
      expect(out.text()).toBe(`${formatTag('out')}hello\n${formatTag('out')}world\n`);
      expect(err.text()).toBe('');
    } finally {
      out.restore();
      err.restore();
    }
  });

  test('prefixes each stderr line separately from stdout', async () => {
    const out = captureWrites(process.stdout);
    const err = captureWrites(process.stderr);
    try {
      await runPrefixed('x', 'echo out; echo err >&2');
      expect(out.text()).toBe(`${formatTag('x')}out\n`);
      expect(err.text()).toBe(`${formatTag('x')}err\n`);
    } finally {
      out.restore();
      err.restore();
    }
  });

  test('flushes a final line that has no trailing newline', async () => {
    const out = captureWrites(process.stdout);
    const err = captureWrites(process.stderr);
    try {
      await runPrefixed('t', 'printf hello');
      expect(out.text()).toBe(`${formatTag('t')}hello\n`);
    } finally {
      out.restore();
      err.restore();
    }
  });

  test('throws an error with exitCode on non-zero status', async () => {
    const out = captureWrites(process.stdout);
    const err = captureWrites(process.stderr);
    try {
      await runPrefixed('t', 'exit 7');
      throw new Error('expected runPrefixed to throw');
    } catch (caught) {
      expect(caught).toBeInstanceOf(Error);
      expect((caught as { exitCode: number }).exitCode).toBe(7);
    } finally {
      out.restore();
      err.restore();
    }
  });
});
