'use strict';
var cheerio = require('cheerio');

var DEFAULT_OPTS = { indentSize: 4, maxDepth: 50 };

function mergeOpts(options) {
  if (!options || typeof options !== 'object') return DEFAULT_OPTS;
  return {
    indentSize: parseInt(options.indentSize) || DEFAULT_OPTS.indentSize,
    maxDepth: parseInt(options.maxDepth) || DEFAULT_OPTS.maxDepth
  };
}

function cleanDOM($) {
  $('script, style, svg, iframe, noscript').remove();
  $('[class*="button"], [class*="btn"], [role="button"]').remove();
  $('[class*="icon"], [class*="svg"]').remove();
  $('[class*="nav"], [class*="header"], [class*="footer"]').not('main [class*="header"]').remove();
}

function parseNode($, el, depth, opts) {
  if (!el) return '';
  if (depth > opts.maxDepth) {
    return $(el).text() || '';
  }
  if (el.type === 'text') {
    var txt = el.data || '';
    txt = txt.replace(/\s+/g, ' ');
    return txt;
  }
  if (el.type !== 'tag') return '';
  var tag = el.tagName ? el.tagName.toUpperCase() : '';
  switch (tag) {
    case 'H1': return '# ' + getTextContent($, el).trim() + '\n\n';
    case 'H2': return '## ' + getTextContent($, el).trim() + '\n\n';
    case 'H3': return '### ' + getTextContent($, el).trim() + '\n\n';
    case 'H4': return '#### ' + getTextContent($, el).trim() + '\n\n';
    case 'H5': return '##### ' + getTextContent($, el).trim() + '\n\n';
    case 'H6': return '###### ' + getTextContent($, el).trim() + '\n\n';
    case 'STRONG':
    case 'B':
      return '**' + parseChildren($, el, depth, opts).trim() + '**';
    case 'EM':
    case 'I':
      return '*' + parseChildren($, el, depth, opts).trim() + '*';
    case 'CODE':
      var parent = el.parent;
      if (parent && parent.tagName && parent.tagName.toUpperCase() === 'PRE') {
        return parseChildren($, el, depth, opts);
      }
      return '`' + getTextContent($, el).trim() + '`';
    case 'PRE':
      var codeEl = $(el).find('code');
      var codeText = codeEl.length > 0 ? codeEl.text() : $(el).text();
      var lang = '';
      if (codeEl.length > 0) {
        var cls = codeEl.attr('class') || '';
        var langMatch = cls.match(/language-(\w+)/);
        if (langMatch) lang = langMatch[1];
      }
      return '\n```' + lang + '\n' + codeText + '\n```\n\n';
    case 'P':
      var pContent = parseChildren($, el, depth, opts).trim();
      if (!pContent) return '';
      return pContent + '\n\n';
    case 'BR': return '\n';
    case 'HR': return '\n---\n\n';
    case 'UL': return parseList($, el, depth, 'ul', opts);
    case 'OL': return parseList($, el, depth, 'ol', opts);
    case 'LI': return buildListItem($, el, depth, 'ul', undefined, opts);
    case 'A':
      var href = $(el).attr('href') || '';
      var linkText = parseChildren($, el, depth, opts).trim();
      if (!linkText) return '';
      if (!href || href === '#') return linkText;
      return '[' + linkText + '](' + href + ')';
    case 'IMG':
      var alt = $(el).attr('alt') || '';
      var src = $(el).attr('src') || '';
      return '![' + alt + '](' + src + ')';
    case 'BLOCKQUOTE':
      var bqContent = parseChildren($, el, depth, opts).trim();
      var bqLines = bqContent.split('\n');
      return bqLines.map(function(line) { return '> ' + line; }).join('\n') + '\n\n';
    case 'TABLE': return parseTable($, el) + '\n\n';
    case 'SPAN': case 'DIV': case 'SECTION': case 'ARTICLE':
    case 'MAIN': case 'ASIDE': case 'FIGURE': case 'FIGCAPTION':
    case 'DETAILS': case 'SUMMARY':
      return parseChildren($, el, depth, opts);
    default:
      return parseChildren($, el, depth, opts);
  }
}

function getTextContent($, el) { return $(el).text() || ''; }

function parseChildren($, el, depth, opts) {
  var children = el.childNodes || el.children || [];
  var result = '';
  for (var i = 0; i < children.length; i++) {
    result += parseNode($, children[i], depth, opts);
  }
  return result;
}

function parseList($, ul, depth, listType, opts) {
  var items = [];
  var children = ul.childNodes || ul.children || [];
  var orderNum = 1;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (!child.tagName) continue;
    var tag = child.tagName.toUpperCase();
    if (tag === 'LI') {
      items.push(buildListItem($, child, depth, listType, orderNum, opts));
      orderNum++;
    }
  }
  return items.join('') + '\n';
}

function buildListItem($, li, depth, listType, orderNum, opts) {
  var indentUnit = opts.indentSize || 4;
  var indent = '';
  for (var d = 0; d < depth; d++) {
    for (var s = 0; s < indentUnit; s++) indent += ' ';
  }
  var marker = (listType === 'ol') ? (orderNum || 1) + '. ' : '- ';
  var line = indent + marker;
  var textPart = '';
  var nestedPart = '';
  var children = li.childNodes || li.children || [];
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.tagName) {
      var ctag = child.tagName.toUpperCase();
      if (ctag === 'UL') {
        nestedPart += parseList($, child, depth + 1, 'ul', opts);
      } else if (ctag === 'OL') {
        nestedPart += parseList($, child, depth + 1, 'ol', opts);
      } else {
        textPart += parseNode($, child, depth, opts);
      }
    } else {
      textPart += parseNode($, child, depth, opts);
    }
  }
  return line + textPart.trim() + '\n' + nestedPart;
}

function parseTable($, table) {
  var rows = [];
  $(table).find('tr').each(function(i, tr) {
    var cells = [];
    $(tr).find('th, td').each(function(j, cell) {
      cells.push($(cell).text().trim());
    });
    rows.push(cells);
  });
  if (rows.length === 0) return '';
  var result = '';
  result += '| ' + rows[0].join(' | ') + ' |\n';
  result += '| ' + rows[0].map(function() { return '---'; }).join(' | ') + ' |\n';
  for (var i = 1; i < rows.length; i++) {
    result += '| ' + rows[i].join(' | ') + ' |\n';
  }
  return result;
}

function htmlToStructuredMarkdown(html, options) {
  if (!html || typeof html !== 'string') return '';
  var opts = mergeOpts(options);
  var $ = cheerio.load(html, { decodeEntities: true });
  cleanDOM($);
  var body = $('body');
  if (body.length === 0) body = $.root();
  var result = '';
  var children = body.contents();
  children.each(function(i, child) {
    result += parseNode($, child, 0, opts);
  });
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.trim();
  return result;
}

module.exports = { htmlToStructuredMarkdown, cleanDOM, parseNode, parseChildren, parseList, buildListItem };
