'use strict';
const path = require('path');
const fs = require('fs');

const CONTENT_SELECTORS = [
  '.message-content', '.agent-response', '.chat-message',
  '.markdown-body', '[class*="answer"]', '[class*="response"]',
  '[class*="message"]', '[class*="agent"]', '[class*="spark"]',
  '[class*="conversation"]', '.prose'
];

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0'
};

async function crawlWithPuppeteer(url) {
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    timeout: 90000
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(BROWSER_HEADERS['User-Agent']);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    let found = false;
    for (const sel of CONTENT_SELECTORS) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        found = true;
        break;
      } catch (e) { /* continue */ }
    }
    if (!found) await new Promise(r => setTimeout(r, 4000));

    if (process.env.DEBUG_SCREENSHOT === 'true') {
      const tmpDir = path.join('/Users/chungji/Documents/test/slide-converter/temp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      await page.screenshot({ path: path.join(tmpDir, 'debug_' + Date.now() + '.png'), fullPage: true });
    }

    const result = await page.evaluate(() => ({
      html: document.documentElement.outerHTML,
      text: document.body ? document.body.innerText : ''
    }));

    return { html: result.html, text: result.text, url };
  } finally {
    await browser.close();
  }
}

async function crawlWithPlaywright(url) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_HEADERS['User-Agent'],
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const text = await page.evaluate(() => document.body ? document.body.innerText : '');
    return { html, text, url };
  } finally {
    await browser.close();
  }
}

async function crawlWithAxios(url) {
  const axios = require('axios');
  const response = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 30000,
    maxRedirects: 5,
    responseType: 'arraybuffer'
  });
  const html = response.data.toString('utf-8');
  return { html, text: '', url };
}

async function crawlUrl(url) {
  try {
    console.log('[puppeteer] 시도중: ' + url);
    return await crawlWithPuppeteer(url);
  } catch (e) {
    console.log('[puppeteer] 실패: ' + e.message);
  }

  try {
    console.log('[playwright] 시도중: ' + url);
    return await crawlWithPlaywright(url);
  } catch (e) {
    console.log('[playwright] 실패: ' + e.message);
  }

  try {
    console.log('[axios] 시도중: ' + url);
    return await crawlWithAxios(url);
  } catch (e) {
    const msg = e.response
      ? '해당 사이트의 봇 차단으로 접근이 제한됩니다 (HTTP ' + e.response.status + ')'
      : '네트워크 오류: ' + e.message;
    throw new Error(msg);
  }
}

function extractHtmlFromMhtml(content) {
  const boundary = content.match(/boundary="?([^"\r\n]+)"?/i);
  if (!boundary) return content;
  const parts = content.split('--' + boundary[1]);
  for (const part of parts) {
    if (part.includes('Content-Type: text/html')) {
      const htmlStart = part.indexOf('\r\n\r\n');
      if (htmlStart !== -1) {
        let html = part.slice(htmlStart + 4);
        html = html.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g,
          function(_, hex) { return String.fromCharCode(parseInt(hex, 16)); });
        return html;
      }
    }
  }
  return content;
}

async function parseHtmlFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath);

  let html;
  try {
    html = content.toString('utf-8');
  } catch (e) {
    html = content.toString('utf-8');
  }

  if (ext === '.mhtml' || ext === '.mht') {
    html = extractHtmlFromMhtml(html);
  }

  if (ext === '.txt') {
    return { html: '<pre>' + html + '</pre>', text: html, filePath };
  }

  return { html, text: '', filePath };
}

async function getContent(source) {
  if (source.type === 'file') {
    return await parseHtmlFile(source.filePath);
  } else {
    return await crawlUrl(source.url);
  }
}

async function checkAvailability() {
  const results = {};
  try { require('puppeteer-extra'); require('puppeteer-extra-plugin-stealth'); results.puppeteer = true; } catch(e) { results.puppeteer = false; }
  try { require('playwright'); results.playwright = true; } catch(e) { results.playwright = false; }
  results.axios = true;
  return results;
}

module.exports = { crawlUrl, getContent, parseHtmlFile, checkAvailability };
