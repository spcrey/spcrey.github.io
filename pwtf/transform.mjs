/** Preserve the original transform exactly so existing platform passwords stay compatible. */
export function transformPlatform(platform) {
  if (typeof platform !== 'string' || platform.trim().length === 0 || platform.length < 2) {
    throw new RangeError('平台名称至少需要 2 个字符');
  }
  const array = Array.from({ length: platform.length }, (_, i) => platform.charCodeAt(i));
  for (let i = platform.length; i < 12; i++) array[i] = array[i - 1] + array[i - 2];
  for (let i = 0; i < 6; i++) array[i] = array[i] % 26 + 97;
  for (let i = 6; i < 12; i++) array[i] = array[i] % 10 + 48;
  for (let i = 0; i < 6; i++) array[i] += (array[i + 6] - 48) * i;
  for (let i = 0; i < 6; i++) array[i] = array[i] % 26 + 97;
  for (let i = 6; i < 12; i++) array[i] -= (array[i] - 48) * (i - 6);
  for (let i = 6; i < 12; i++) array[i] = array[i] % 10 + 48;
  return '!Ysp' + array.slice(0, 12).map(value => String.fromCharCode(value)).join('');
}

// Compatibility with the previous page; this is not an authentication boundary.
export function acceptsLegacyCode(code) { return code === 'spcrey'; }
