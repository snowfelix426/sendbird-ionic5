export function xssEscape(target) {
  if (typeof target === 'string') {
    return target
      .split('&')
      .join('&amp;')
      .split('#')
      .join('&#35;')
      .split('<')
      .join('&lt;')
      .split('>')
      .join('&gt;')
      .split('"')
      .join('&quot;')
      .split("'")
      .join('&apos;')
      .split('+')
      .join('&#43;')
      .split('-')
      .join('&#45;')
      .split('(')
      .join('&#40;')
      .split(')')
      .join('&#41;')
      .split('%')
      .join('&#37;');
  } else {
    return target;
  }
}