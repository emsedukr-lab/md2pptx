'use strict';

var META_PATTERNS = [
  /슬라이드\s*끝\.\s*/g,
  /슬라이드\s*끝\s*/g,
  /진행\s*상황\s*:\s*[^\n]*/g,
  /계속됩니다\.?\s*/g,
  /이어서\s*작성\.?\s*/g,
  /계속\s*작성\.?\s*/g,
  /다음에\s*계속\.?\s*/g,
  /---\s*끝\s*---/g,
  /^\s*아래는\s[^\n]*입니다\.?\s*$/gm,
  /^\s*다음과\s*같이\s*작성하였습니다\.?\s*$/gm,
  /^\s*이하\s[^\n]*내용입니다\.?\s*$/gm,
  /^\s*총\s*\d+\s*개?\s*슬라이드.*$/gm,
  /^\s*동적\s*분리.*$/gm,
  /^\s*위\s*내용은.*$/gm,
  /^\s*다음은.*슬라이드.*$/gm,
  /^\s*최종\s*슬라이드\s*수\s*:.*$/gm,
  /^\s*슬라이드\s*수\s*:.*$/gm,
  /동적\s*분리\s*포함/g,
  /동적분리\s*포함/g,
  /^\s*총\s*페이지.*$/gm,
  /^\s*슬라이드\s*총.*$/gm
];

function cleanMetaText(text) {
  if (!text) return text;
  for (var i = 0; i < META_PATTERNS.length; i++) {
    text = text.replace(META_PATTERNS[i], '');
  }
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function removeChapterHeadings(text) {
  if (!text) return text;
  var lines = text.split('\n');
  var result = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    if (/^#{1,3}\s+\d+\s*$/.test(trimmed)) continue;
    if (/^#{1,3}\s+Chapter\s+/i.test(trimmed)) continue;
    if (/^#{1,3}\s+챕터\s+/i.test(trimmed)) continue;
    if (/^#{1,3}\s+파트\s+/i.test(trimmed)) continue;
    if (/^#{1,3}\s+Part\s+/i.test(trimmed)) continue;
    result.push(line);
  }
  return result.join('\n');
}

function enforceBlankLineRules(text) {
  if (!text) return text;
  var lines = text.split('\n');
  var result = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    if (trimmed === '') {
      if (i + 1 < lines.length && lines[i + 1].trim() === '---') continue;
      if (result.length > 0 && result[result.length - 1].trim() === '---') continue;
      if (i + 1 < lines.length) {
        var nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed === '[핵심 메시지]' || nextTrimmed === '[본문]' || nextTrimmed === '[레이아웃 가이드]') {
          if (result.length > 0 && result[result.length - 1].trim() === '') continue;
          result.push('');
          continue;
        }
      }
      continue;
    }
    result.push(line);
  }
  return result.join('\n');
}

function stripTrailingMeta(text) {
  if (!text) return text;
  var segments = text.split('\n---\n');
  if (segments.length === 0) return text;
  for (var i = 0; i < segments.length; i++) {
    var lines = segments[i].split('\n');
    while (lines.length > 0 && lines[lines.length - 1].trim() === '---') {
      lines.pop();
    }
    if (i === segments.length - 1) {
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
    }
    segments[i] = lines.join('\n');
  }
  segments = segments.filter(function(s) { return s.trim().length > 0; });
  return segments.join('\n---\n');
}

function convertToMarkdown(extractResult, options) {
  var opts = options || {};
  if (opts.showSlideNumber === undefined) opts.showSlideNumber = false;
  if (opts.showPageNumber === undefined) opts.showPageNumber = true;
  if (opts.showCoreMessage === undefined) opts.showCoreMessage = true;
  if (opts.showBody === undefined) opts.showBody = true;
  if (opts.showLayout === undefined) opts.showLayout = true;

  if (!extractResult) {
    return '# 변환 결과 없음\n\n콘텐츠를 추출할 수 없었습니다.\n';
  }
  var rawText = extractResult.rawText || '';
  var slides = [];
  if (extractResult.slides && Array.isArray(extractResult.slides)) {
    slides = extractResult.slides;
  } else if (Array.isArray(extractResult)) {
    slides = extractResult;
  }
  if (slides.length === 0) {
    if (rawText) return rawText;
    return '# 변환 결과\n\n슬라이드 구조를 감지하지 못했습니다.\n';
  }
  var parts = [];
  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];
    if (!slide) continue;
    var section = buildSlideSection(slide, opts);
    parts.push(section);
  }
  var result = parts.join('\n---\n');
  result = cleanMetaText(result);
  result = removeChapterHeadings(result);
  result = enforceBlankLineRules(result);
  result = stripTrailingMeta(result);
  if (result && !result.endsWith('\n---')) {
    result = result.trimEnd() + '\n---';
  }
  return result;
}

function cleanSectionContent(text) {
  if (!text || typeof text !== 'string') return '';
  var lines = text.split('\n');
  var cleaned = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.trim() === '') continue;
    cleaned.push(line);
  }
  return cleaned.join('\n');
}

function buildSlideSection(slide, opts) {
  if (!slide) return '';
  opts = opts || {};
  if (opts.showSlideNumber === undefined) opts.showSlideNumber = false;
  if (opts.showPageNumber === undefined) opts.showPageNumber = true;
  if (opts.showCoreMessage === undefined) opts.showCoreMessage = true;
  if (opts.showBody === undefined) opts.showBody = true;
  if (opts.showLayout === undefined) opts.showLayout = true;

  var lines = [];
  var titleLine = '';
  if (slide.titleLine) {
    var tl = slide.titleLine.replace(/^##\s*/, '');
    var numMatch = tl.match(/^\[(\d+)\]\s*[:：]\s*/);
    var numPart = '';
    var restTitle = tl;
    if (numMatch) {
      numPart = numMatch[0];
      restTitle = tl.slice(numMatch[0].length);
    }
    var pageMatch = restTitle.match(/\s*\(교재\s*p\.?\s*\d+\)\s*$/);
    var pagePart = '';
    var titleText = restTitle;
    if (pageMatch) {
      pagePart = pageMatch[0].trim();
      titleText = restTitle.slice(0, pageMatch.index).trim();
    }
    titleLine = '# ';
    if (opts.showSlideNumber && numPart) {
      titleLine += numPart;
    }
    titleLine += titleText;
    if (opts.showPageNumber && pagePart) {
      titleLine += ' ' + pagePart;
    }
  } else if (slide.num != null && slide.title) {
    var pageMatch2 = slide.title.match(/\s*\(교재\s*p\.?\s*\d+\)\s*$/);
    var pagePart2 = '';
    var titleText2 = slide.title;
    if (pageMatch2) {
      pagePart2 = pageMatch2[0].trim();
      titleText2 = slide.title.slice(0, pageMatch2.index).trim();
    }
    titleLine = '# ';
    if (opts.showSlideNumber) {
      titleLine += '[' + slide.num + ']: ';
    }
    titleLine += titleText2;
    if (opts.showPageNumber && pagePart2) {
      titleLine += ' ' + pagePart2;
    }
  } else if (slide.title) {
    var pageMatch3 = slide.title.match(/\s*\(교재\s*p\.?\s*\d+\)\s*$/);
    var pagePart3 = '';
    var titleText3 = slide.title;
    if (pageMatch3) {
      pagePart3 = pageMatch3[0].trim();
      titleText3 = slide.title.slice(0, pageMatch3.index).trim();
    }
    titleLine = '# ' + titleText3;
    if (opts.showPageNumber && pagePart3) {
      titleLine += ' ' + pagePart3;
    }
  }
  if (titleLine) {
    lines.push(titleLine);
  }
  var coreMessage = cleanSectionContent(slide.coreMessage);
  if (opts.showCoreMessage && coreMessage) {
    if (lines.length > 0) lines.push('');
    lines.push('[핵심 메시지]');
    lines.push(coreMessage);
  }
  var body = cleanSectionContent(slide.body);
  if (opts.showBody && body) {
    if (lines.length > 0) lines.push('');
    lines.push('[본문]');
    lines.push(body);
  }
  var layout = cleanSectionContent(slide.layout);
  if (opts.showLayout && layout) {
    if (lines.length > 0) lines.push('');
    lines.push('[레이아웃 가이드]');
    lines.push(layout);
  }
  if (lines.length === 0 && opts.showBody && body) return body;
  return lines.join('\n');
}

function urlToFilename(url, index) {
  var paddedIndex = String(index + 1).padStart(2, '0');
  try {
    var parsed = new URL(url);
    var name = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname;
    name = name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').substring(0, 40);
    return paddedIndex + '_' + name + '.md';
  } catch (e) {
    return paddedIndex + '_slides.md';
  }
}

function mergeMarkdowns(markdownArray, separator) {
  if (!markdownArray || !Array.isArray(markdownArray)) return '';
  var sep = separator || '\n---\n';
  var filtered = markdownArray.filter(function(md) {
    return md && typeof md === 'string' && md.trim().length > 0;
  });
  if (filtered.length === 0) return '';
  return filtered.join(sep);
}

function extractTitleFromMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';
  var lines = markdown.split('\n');
  for (var i = 0; i < Math.min(lines.length, 20); i++) {
    var line = lines[i].trim();
    var headingMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headingMatch) {
      var title = headingMatch[1].trim();
      title = title.replace(/\[?\d+\]?\s*[:：]\s*/, '');
      title = title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 60);
      return title.trim();
    }
  }
  return '';
}

module.exports = { convertToMarkdown, buildSlideSection, urlToFilename, mergeMarkdowns, extractTitleFromMarkdown };
