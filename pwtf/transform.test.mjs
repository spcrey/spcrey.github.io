import test from 'node:test';
import assert from 'node:assert/strict';
import { transformPlatform, acceptsLegacyCode } from './transform.mjs';

// Frozen values from the original published page, not reimplementations of the formula.
const legacyVectors = [
  [
    "ab",
    "!Yspmnybtd789040"
  ],
  [
    "github",
    "!Yspsxvwqn380618"
  ],
  [
    "GitHub",
    "!Yspmxvqqn380618"
  ],
  [
    "notion",
    "!Yspzbjdun986236"
  ],
  [
    "微信",
    "!Yspvpkvor087854"
  ],
  [
    "test.example.com",
    "!Yspfxwltv889444"
  ],
  [
    " a",
    "!Yspztylwr485896"
  ],
  [
    "long-platform-name-123",
    "!Yspxhlyqv682452"
  ]
];

test('existing platform passwords stay compatible with the original page', () => {
  for (const [name, expected] of legacyVectors) assert.equal(transformPlatform(name), expected);
});

test('reject names that previously produced invalid results', () => {
  for (const name of ['', 'x', '   ', null]) assert.throws(() => transformPlatform(name), RangeError);
});

test('platform spelling and case are preserved', () => {
  assert.notEqual(transformPlatform('github'), transformPlatform('GitHub'));
});

test('legacy access code behavior is preserved', () => {
  assert.equal(acceptsLegacyCode('spcrey'), true);
  assert.equal(acceptsLegacyCode(''), false);
  assert.equal(acceptsLegacyCode('wrong'), false);
});
