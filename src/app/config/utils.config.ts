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

export function xssUnEscape(target) {
  if (typeof target === 'string') {
    return target
      .split('&amp;')
      .join('&')
      .split('&#35;')
      .join('#')
      .split('&lt;')
      .join('<')
      .split('&gt;')
      .join('>')
      .split('&quot;')
      .join('"')
      .split('&apos;')
      .join("'")
      .split('&#43;')
      .join('+')
      .split('&#45;')
      .join('-')
      .split('&#40;')
      .join('(')
      .split('&#41;')
      .join(')')
      .split('&#37;')
      .join('%');
  } else {
    return target;
  }
}

export function stringToUrlLink(target) {
  if (typeof target === 'string') {
    return '<a href="' + target +
      '" target="_blank" style="color: #3880ff;">'
      + target + '</a>';
  } else {
    return target
  }
}

export function urlLinkToString(target) {
  if (typeof target === 'string' && target.includes("<a href=")) {
    return target.substring(target.indexOf(">") + 1, target.lastIndexOf("<"));
  } else {
    return target
  }
}
