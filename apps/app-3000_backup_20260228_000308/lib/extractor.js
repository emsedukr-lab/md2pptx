'use strict';
var cheerio = require('cheerio');
var htmlParser = require('./html-parser');

var MAX_CONTENT_LENGTH = 500000;

function htmlToMarkdown(html, options) {
  if (!html || typeof html !== 'string') return '';
  if (html.length > MAX_CONTENT_LENGTH) {
    html = html.substring(0, MAX_CONTENT_LENGTH);
  }
  try {
    return htmlParser.htmlToStructuredMarkdown(html, options);
  } catch (e) {
    try {
      var TurndownService = require('turndown');
      var td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
      return td.turndown(html);
    } catch (e2) {
      return html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
    }
  }
}

function extractFromGenspark($) {
  var candidates = [
    '[class*="agent"]', '[class*="spark"]', '[class*="conversation"]',
    '[class*="thread"]', '[class*="answer"]', '[class*="response"]',
    '[class*="message"]', '.markdown-body', '.prose',
    '[class*="markdown"]', '[class*="content"]'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var sel = candidates[i];
    var els = Array.from($(sel) || []);
    if (els.length > 0) {
      var texts = [];
      for (var j = 0; j < els.length; j++) {
        var txt = $(els[j]).text().trim();
        if (txt.length > 200) texts.push($(els[j]).html());
      }
      if (texts.length > 0) return texts.join('\n\n');
    }
  }
  return null;
}

function extractBySlidePattern($) {
  var slideRegex = /#{1,2}\s*\[?\d+\]?[:：]/;
  var bestEl = null;
  var bestLen = 0;
  var allEls = Array.from($('div, article, section, main') || []);
  for (var i = 0; i < allEls.length; i++) {
    var el = allEls[i];
    var txt = $(el).text() || '';
    if (slideRegex.test(txt) && txt.length > bestLen) {
      bestLen = txt.length;
      bestEl = el;
    }
  }
  if (bestEl) return $(bestEl).html();
  return null;
}

function extractByRegexFromText(text) {
  if (!text) return null;
  var slideRegex = /#{1,2}\s*\[?\d+\]?[:：]/;
  var idx = text.search(slideRegex);
  if (idx !== -1) return text.slice(idx);
  return null;
}

function extractAIAnswers(html, url, options) {
  if (!html) return [''];
  var $ = cheerio.load(html, { decodeEntities: true });
  $('script, style, nav, footer, iframe, noscript, svg').remove();
  $('[class*="button"], [class*="btn"], [role="button"]').remove();
  var fullText = '';
  try { fullText = $('body').text() || ''; } catch(e) { fullText = ''; }
  if (!fullText) fullText = html.replace(/<[^>]+>/g, '');

  var gptEls = Array.from($('[data-message-author-role="assistant"]') || []);
  if (gptEls.length > 0) {
    var blocks = [];
    for (var i = 0; i < gptEls.length; i++) {
      var h = $(gptEls[i]).html();
      if (h) blocks.push(htmlToMarkdown(h, options));
    }
    if (blocks.length > 0) return blocks;
  }

  var claudeEls = Array.from($('[class*="claude"], [class*="assistant-message"]') || []);
  if (claudeEls.length > 0) {
    var blocks2 = [];
    for (var i2 = 0; i2 < claudeEls.length; i2++) {
      var h2 = $(claudeEls[i2]).html();
      if (h2 && $(claudeEls[i2]).text().length > 100) blocks2.push(htmlToMarkdown(h2, options));
    }
    if (blocks2.length > 0) return blocks2;
  }

  var url_str = url || '';
  if (url_str.includes('genspark')) {
    var gensparkHtml = extractFromGenspark($);
    if (gensparkHtml) return [htmlToMarkdown(gensparkHtml, options)];
  }

  var slidePatternHtml = extractBySlidePattern($);
  if (slidePatternHtml) return [htmlToMarkdown(slidePatternHtml, options)];

  var mdEls = Array.from($('.markdown-body, .prose, [class*="markdown"]') || []);
  if (mdEls.length > 0) {
    var blocks3 = [];
    for (var i3 = 0; i3 < mdEls.length; i3++) {
      var h3 = $(mdEls[i3]).html();
      if (h3 && $(mdEls[i3]).text().length > 100) blocks3.push(htmlToMarkdown(h3, options));
    }
    if (blocks3.length > 0) return blocks3;
  }

  var sharedEls = Array.from($('[class*="shared"], [class*="export"], [class*="output"]') || []);
  if (sharedEls.length > 0) {
    var blocks4 = [];
    for (var i4 = 0; i4 < sharedEls.length; i4++) {
      var h4 = $(sharedEls[i4]).html();
      if (h4 && $(sharedEls[i4]).text().length > 100) blocks4.push(htmlToMarkdown(h4, options));
    }
    if (blocks4.length > 0) return blocks4;
  }

  var regexResult = extractByRegexFromText(fullText);
  if (regexResult) return [regexResult];

  var best = { len: 0, html: '' };
  var allDivs = Array.from($('div, article, section, main, p') || []);
  for (var i5 = 0; i5 < allDivs.length; i5++) {
    var el5 = allDivs[i5];
    var txt5 = ($(el5).text() || '').trim();
    var h5 = $(el5).html() || '';
    if (txt5.length > best.len && h5.length < MAX_CONTENT_LENGTH) {
      best = { len: txt5.length, html: h5 };
    }
  }
  if (best.html) return [htmlToMarkdown(best.html, options)];
  return [fullText.slice(0, MAX_CONTENT_LENGTH)];
}

function parseSlides(text) {
  if (!text) return [];
  var slideRegex = /#{1,2}\s*\[?(\d+)\]?\s*[:：]\s*([^\n]+)/g;
  var matches = [];
  var match;
  while ((match = slideRegex.exec(text)) !== null) {
    matches.push({ num: parseInt(match[1]), title: match[2].trim(), index: match.index, fullLen: match[0].length });
  }
  var slides = [];
  for (var i = 0; i < matches.length; i++) {
    var m = matches[i];
    var start = m.index + m.fullLen;
    var end = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    var rawBody = text.slice(start, end).trim();
    // 챕터 소제목 제거 (# 04, # Chapter X 등)
    var bodyLines = rawBody.split('\n');
    var cleanedLines = [];
    for (var k = 0; k < bodyLines.length; k++) {
      var bline = bodyLines[k].trim();
      if (/^#{1,3}\s+\d+\s*$/.test(bline)) continue;
      if (/^#{1,3}\s+Chapter\s+/i.test(bline)) continue;
      if (/^#{1,3}\s+챕터\s+/i.test(bline)) continue;
      if (/^#{1,3}\s+파트\s+/i.test(bline)) continue;
      if (/^#{1,3}\s+Part\s+/i.test(bline)) continue;
      cleanedLines.push(bodyLines[k]);
    }
    var body = cleanedLines.join('\n').trim();
    var parsed = parseSlideBody(body);
    slides.push({
      num: m.num,
      title: m.title,
      body: parsed.body,
      coreMessage: parsed.coreMessage,
      layout: parsed.layout
    });
  }
  return slides;
}

function cleanBulletList(text) {
  if (!text || typeof text !== 'string') return text;
  var lines = text.split('\n');
  var cleaned = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.trim() === '') continue;
    cleaned.push(line);
  }
  return cleaned.join('\n');
}

function parseSlideBody(rawBody) {
  if (!rawBody || typeof rawBody !== 'string') {
    return { coreMessage: '', body: rawBody || '', layout: '' };
  }
  var coreMessage = '';
  var bodyContent = '';
  var layout = '';

  // [핵심 메시지] 섹션 추출
  var coreMatch = rawBody.match(/\*{0,2}\[핵심\s*메시지\]\*{0,2}\s*\n?([\s\S]*?)(?=\[본문\]|\[레이아웃|\s*$)/);
  if (coreMatch) {
    coreMessage = coreMatch[1].trim();
  }

  // [본문] 섹션 추출
  var bodyMatch = rawBody.match(/\[본문\]\s*\n?([\s\S]*?)(?=\[레이아웃|\s*$)/);
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim();
  }

  // [레이아웃 가이드] 섹션 추출
  var layoutMatch = rawBody.match(/\[레이아웃\s*가이드\]\s*\n?([\s\S]*?)$/);
  if (layoutMatch) {
    layout = layoutMatch[1];
    var dashIdx = layout.indexOf('\n---');
    if (dashIdx !== -1) {
      layout = layout.substring(0, dashIdx);
    }
    layout = layout.trim();
  }

  // 서브섹션이 하나도 매칭되지 않으면 전체를 body로 사용
  if (!coreMessage && !bodyContent && !layout) {
    return { coreMessage: '', body: rawBody.trim(), layout: '' };
  }

  return {
    coreMessage: coreMessage.trim(),
    body: cleanBulletList(bodyContent),
    layout: cleanBulletList(layout)
  };
}

function deduplicateSlides(slides) {
  if (!slides || !Array.isArray(slides)) return [];
  var slideMap = {};
  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];
    if (!s) continue;
    var key = String(s.num || 0);
    slideMap[key] = s;
  }
  var keys = Object.keys(slideMap);
  keys.sort(function(a, b) { return parseInt(a) - parseInt(b); });
  var result = [];
  for (var j = 0; j < keys.length; j++) {
    result.push(slideMap[keys[j]]);
  }
  return result;
}

function extractSlides(crawlResult, options) {
  if (!crawlResult) {
    return { rawText: '', slides: [], totalSlides: 0, hasSlideStructure: false };
  }
  var html = crawlResult.html || '';
  var text = crawlResult.text || '';
  var url = crawlResult.url || '';
  var filePath = crawlResult.filePath || '';
  var source = url || filePath || '';
  var opts = options || {};
  var answers = [];
  try {
    answers = extractAIAnswers(html, source, opts);
  } catch (e) {
    console.log('[extractor] extractAIAnswers 실패: ' + e.message);
    answers = [text || html.replace(/<[^>]+>/g, '')];
  }
  if (!Array.isArray(answers)) answers = [String(answers)];
  var combined = answers.join('\n\n');
  if (combined.length > MAX_CONTENT_LENGTH) {
    combined = combined.substring(0, MAX_CONTENT_LENGTH);
  }
  var slides = parseSlides(combined);
  var deduped = deduplicateSlides(slides);
  return { rawText: combined, slides: deduped, totalSlides: deduped.length, hasSlideStructure: deduped.length > 0 };
}

module.exports = { extractSlides, extractAIAnswers, parseSlides, deduplicateSlides, htmlToMarkdown, parseSlideBody };
