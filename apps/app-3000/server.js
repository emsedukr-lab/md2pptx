'use strict';
var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');
var uuidv4 = require('uuid').v4;
var multer = require('multer');
var http = require('http');
var FormData = require('form-data');
var crawler = require('./lib/crawler');
var extractor = require('./lib/extractor');
var converter = require('./lib/converter');
var zipper = require('./lib/zipper');
var app = express();
var PORT = process.env.PORT || 3000;
var PPTX_HOST = process.env.PPTX_HOST || 'localhost';
var PPTX_PORT = parseInt(process.env.PPTX_PORT) || 8001;
var TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var jobId = req.jobId || uuidv4();
    req.jobId = jobId;
    var uploadDir = path.join(TEMP_DIR, jobId, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    var ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
var upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
  fileFilter: function(req, file, cb) {
    var allowed = ['.html', '.htm', '.mhtml', '.mht', '.txt'];
    var ext = path.extname(file.originalname).toLowerCase();
    if (allowed.indexOf(ext) !== -1) cb(null, true);
    else cb(new Error('지원하지 않는 파일 형식입니다: ' + ext));
  }
});
var jobs = {};
function getJobDir(jobId) { return path.join(TEMP_DIR, jobId); }

async function processItem(source, jobId, index, options) {
  var jobDir = getJobDir(jobId);
  var opts = options || {};
  try {
    jobs[jobId].items[index].status = 'parsing';
    var crawlResult = await crawler.getContent(source);
    jobs[jobId].items[index].status = 'extracting';
    var extracted = extractor.extractSlides(crawlResult, opts);
    jobs[jobId].items[index].status = 'converting';
    var markdown = converter.convertToMarkdown(extracted, opts);
    if (!markdown || markdown.trim().length === 0) {
      jobs[jobId].items[index].status = 'error';
      jobs[jobId].items[index].error = '변환 결과가 비어 있습니다.';
      return;
    }
    var outDir = path.join(jobDir, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    var slideCount = extracted.totalSlides || 0;
    var rawBaseName;
    if (source.customName) {
      rawBaseName = source.customName.replace(/\.[^.]+$/, '');
    } else if (source.type === 'file') {
      rawBaseName = path.basename(source.originalName || source.filePath, path.extname(source.originalName || source.filePath));
    } else {
      rawBaseName = String(index + 1).padStart(2, '0') + '_slides';
    }
    var baseName = slideCount > 0 ? rawBaseName + '(' + slideCount + ')' : rawBaseName;
    var outPath = path.join(outDir, baseName + '.md');
    var counter = 1;
    while (fs.existsSync(outPath)) {
      outPath = path.join(outDir, baseName + '_' + counter + '.md');
      counter++;
    }
    fs.writeFileSync(outPath, markdown, 'utf-8');
    var writtenContent = fs.readFileSync(outPath, 'utf-8');
    if (!writtenContent || writtenContent.trim().length === 0) {
      jobs[jobId].items[index].status = 'error';
      jobs[jobId].items[index].error = '파일 저장 후 내용이 비어 있습니다.';
      return;
    }
    jobs[jobId].items[index].status = 'done';
    jobs[jobId].items[index].outputFile = outPath;
    jobs[jobId].items[index].outputFilename = path.basename(outPath);
    jobs[jobId].items[index].slideCount = slideCount;
    jobs[jobId].items[index].contentLength = writtenContent.length;
  } catch (e) {
    jobs[jobId].items[index].status = 'error';
    jobs[jobId].items[index].error = e.message;
  }
}

function assignJobId(req, res, next) { req.jobId = uuidv4(); next(); }

app.post('/api/convert', assignJobId, upload.array('files', 20), async function(req, res) {
  var jobId = req.jobId;
  var jobDir = getJobDir(jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  var uploadedFiles = req.files || [];
  var indentSize = parseInt(req.body.indentSize) || 4;
  var options = {
    indentSize: indentSize,
    showSlideNumber: req.body.showSlideNumber === 'true',
    showPageNumber: req.body.showPageNumber !== 'false',
    showCoreMessage: req.body.showCoreMessage !== 'false',
    showBody: req.body.showBody !== 'false',
    showLayout: req.body.showLayout !== 'false'
  };
  if (uploadedFiles.length === 0) {
    return res.status(400).json({ error: '파일을 제공하세요.' });
  }
  var sources = [];
  uploadedFiles.forEach(function(f) {
    sources.push({ type: 'file', filePath: f.path, originalName: f.originalname, mimeType: f.mimetype });
  });
  jobs[jobId] = {
    id: jobId, status: 'running',
    items: sources.map(function(s, i) {
      return { index: i, source: s.type, label: s.originalName, status: 'pending' };
    }),
    createdAt: Date.now()
  };
  res.json({ jobId: jobId, total: sources.length });
  (async function() {
    await Promise.all(sources.map(function(source, i) { return processItem(source, jobId, i, options); }));
    var outputFiles = jobs[jobId].items
      .filter(function(it) { return it.status === 'done' && it.outputFile; })
      .map(function(it) { return it.outputFile; });
    var doneCount = outputFiles.length;
    if (doneCount > 1) {
      try {
        var zipPath = path.join(jobDir, 'result.zip');
        await zipper.createZip(outputFiles, zipPath);
        if (fs.existsSync(zipPath)) {
          var stat = fs.statSync(zipPath);
          if (stat.size > 22) { jobs[jobId].zipPath = zipPath; }
        }
      } catch(e) { console.log('[server] ZIP 생성 실패: ' + e.message); }
    }
    if (doneCount === 1) {
      jobs[jobId].singleFile = { path: outputFiles[0], filename: path.basename(outputFiles[0]) };
    }
    jobs[jobId].status = 'done';
    jobs[jobId].doneCount = doneCount;
  })().catch(function(e) { jobs[jobId].status = 'error'; jobs[jobId].error = e.message; });
});

app.get('/api/status/:jobId', function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  res.json(job);
});

app.get('/api/download/:jobId', function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  if (job.singleFile && job.singleFile.path && fs.existsSync(job.singleFile.path)) {
    return res.download(job.singleFile.path, job.singleFile.filename);
  }
  if (job.zipPath && fs.existsSync(job.zipPath)) {
    return res.download(job.zipPath, 'slides.zip');
  }
  return res.status(404).json({ error: '다운로드 파일이 없습니다.' });
});

app.get('/api/download/:jobId/:index', function(req, res) {
  var job = jobs[req.params.jobId];
  var idx = parseInt(req.params.index);
  if (!job || !job.items[idx] || !job.items[idx].outputFile) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }
  var filePath = job.items[idx].outputFile;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '파일이 존재하지 않습니다.' });
  }
  res.download(filePath, job.items[idx].outputFilename || path.basename(filePath));
});

app.get('/api/preview/:jobId/:index', function(req, res) {
  var job = jobs[req.params.jobId];
  var idx = parseInt(req.params.index);
  if (!job || !job.items[idx] || !job.items[idx].outputFile) {
    return res.status(404).json({ error: '미리보기를 찾을 수 없습니다.' });
  }
  var content = fs.readFileSync(job.items[idx].outputFile, 'utf-8');
  res.json({ content: content, index: idx, contentLength: content.length });
});

app.post('/api/merge/:jobId', function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  var doneItems = job.items.filter(function(it) { return it.status === 'done' && it.outputFile; });
  if (doneItems.length === 0) {
    return res.status(400).json({ error: '병합할 완료 파일이 없습니다.' });
  }
  var markdowns = [];
  for (var i = 0; i < doneItems.length; i++) {
    var fp = doneItems[i].outputFile;
    if (fs.existsSync(fp)) {
      var content = fs.readFileSync(fp, 'utf-8');
      if (content && content.trim().length > 0) markdowns.push(content);
    }
  }
  var merged = converter.mergeMarkdowns(markdowns);
  if (!merged || merged.trim().length === 0) {
    return res.status(400).json({ error: '병합할 내용이 없습니다.' });
  }
  var jobDir = getJobDir(req.params.jobId);
  var mergePath = path.join(jobDir, 'merged_slides.md');
  fs.writeFileSync(mergePath, merged, 'utf-8');
  res.download(mergePath, 'merged_slides.md');
});

app.post('/api/download-selected/:jobId', async function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  var indices = req.body.indices;
  if (!indices || !Array.isArray(indices) || indices.length === 0) {
    return res.status(400).json({ error: '선택된 파일이 없습니다.' });
  }
  var selectedFiles = [];
  for (var i = 0; i < indices.length; i++) {
    var idx = parseInt(indices[i]);
    var item = job.items[idx];
    if (item && item.status === 'done' && item.outputFile && fs.existsSync(item.outputFile)) {
      selectedFiles.push(item.outputFile);
    }
  }
  if (selectedFiles.length === 0) {
    return res.status(400).json({ error: '다운로드 가능한 파일이 없습니다.' });
  }
  if (selectedFiles.length === 1) {
    return res.download(selectedFiles[0], path.basename(selectedFiles[0]));
  }
  var jobDir = getJobDir(req.params.jobId);
  var zipPath = path.join(jobDir, 'selected.zip');
  try {
    await zipper.createZip(selectedFiles, zipPath);
    res.download(zipPath, 'selected_slides.zip');
  } catch(e) {
    res.status(500).json({ error: 'ZIP 생성 실패: ' + e.message });
  }
});

app.post('/api/delete-items/:jobId', function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  var indices = req.body.indices;
  if (!indices || !Array.isArray(indices) || indices.length === 0) {
    return res.status(400).json({ error: '삭제할 항목을 선택하세요.' });
  }
  var deleted = 0;
  for (var i = 0; i < indices.length; i++) {
    var idx = parseInt(indices[i]);
    var item = job.items[idx];
    if (item && item.outputFile && fs.existsSync(item.outputFile)) {
      fs.unlinkSync(item.outputFile);
      item.status = 'deleted';
      item.outputFile = null;
      item.outputFilename = null;
      deleted++;
    }
  }
  job.doneCount = job.items.filter(function(it) { return it.status === 'done'; }).length;
  res.json({ deleted: deleted, remaining: job.doneCount });
});

app.post('/api/convert-pptx/:jobId', async function(req, res) {
  var job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  var indices = req.body.indices;
  var pptxSettings = req.body.settings || {};
  if (!indices || !Array.isArray(indices) || indices.length === 0) {
    return res.status(400).json({ error: '변환할 파일을 선택하세요.' });
  }

  var selectedFiles = [];
  for (var i = 0; i < indices.length; i++) {
    var idx = parseInt(indices[i]);
    var item = job.items[idx];
    if (item && item.status === 'done' && item.outputFile && fs.existsSync(item.outputFile)) {
      selectedFiles.push({
        path: item.outputFile,
        filename: item.outputFilename || path.basename(item.outputFile)
      });
    }
  }

  if (selectedFiles.length === 0) {
    return res.status(400).json({ error: '변환 가능한 MD 파일이 없습니다.' });
  }

  try {
    var form = new FormData();
    selectedFiles.forEach(function(f) {
      form.append('files', fs.createReadStream(f.path), { filename: f.filename, contentType: 'text/markdown' });
    });
    form.append('font_name', pptxSettings.font_name || 'Malgun Gothic');
    form.append('title_size', String(pptxSettings.title_size || 22));
    form.append('body_size', String(pptxSettings.body_size || 16));
    form.append('line_spacing_multiplier', String(pptxSettings.line_spacing_multiplier || 1.5));
    form.append('code_font_separate', String(pptxSettings.code_font_separate || false));

    var proxyRes = await new Promise(function(resolve, reject) {
      var options = {
        hostname: PPTX_HOST,
        port: PPTX_PORT,
        path: '/api/convert',
        method: 'POST',
        headers: form.getHeaders()
      };
      var proxyReq = http.request(options, function(r) {
        var chunks = [];
        r.on('data', function(chunk) { chunks.push(chunk); });
        r.on('end', function() { resolve({ statusCode: r.statusCode, headers: r.headers, body: Buffer.concat(chunks) }); });
      });
      proxyReq.on('error', reject);
      form.pipe(proxyReq);
    });

    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode || 500).json({ error: 'PPTX 변환 서버 오류' });
    }

    var contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
    var contentDisposition = proxyRes.headers['content-disposition'] || '';
    res.set('Content-Type', contentType);
    if (contentDisposition) res.set('Content-Disposition', contentDisposition);
    res.send(proxyRes.body);
  } catch (e) {
    console.error('[convert-pptx] 프록시 오류:', e.message);
    res.status(500).json({ error: 'PPTX 변환 실패: ' + e.message });
  }
});

app.listen(PORT, async function() {
  console.log('서버 시작: http://localhost:' + PORT);
  var avail = await crawler.checkAvailability();
  console.log('크롤러 가용성:');
  console.log('  puppeteer: ' + (avail.puppeteer ? '사용가능' : '없음'));
  console.log('  playwright: ' + (avail.playwright ? '사용가능' : '없음'));
  console.log('  axios: 사용가능');
});

module.exports = app;
