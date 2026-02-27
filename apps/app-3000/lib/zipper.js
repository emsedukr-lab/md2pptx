'use strict';
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');

function createZip(files, outputPath) {
  return new Promise(function(resolve, reject) {
    if (!files || files.length === 0) {
      return reject(new Error('ZIP에 추가할 파일이 없습니다.'));
    }

    var output = fs.createWriteStream(outputPath);
    var archive = archiver('zip', { zlib: { level: 9 } });
    var addedCount = 0;

    output.on('close', function() {
      console.log('[zipper] ZIP 생성 완료: ' + outputPath + ' (' + archive.pointer() + ' bytes, ' + addedCount + '개 파일)');
      if (addedCount === 0) {
        reject(new Error('ZIP에 추가된 파일이 없습니다.'));
      } else {
        resolve(outputPath);
      }
    });

    archive.on('error', function(err) {
      reject(new Error('ZIP 생성 실패: ' + err.message));
    });

    archive.pipe(output);

    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      if (typeof file === 'string') {
        if (fs.existsSync(file)) {
          var content = fs.readFileSync(file, 'utf-8');
          if (content && content.trim().length > 0) {
            var filename = path.basename(file);
            archive.append(Buffer.from(content, 'utf-8'), { name: filename });
            console.log('[zipper] 파일 추가 (경로): ' + filename + ' (' + content.length + ' chars)');
            addedCount++;
          } else {
            console.log('[zipper] 건너뜀 (빈 파일): ' + file);
          }
        } else {
          console.log('[zipper] 건너뜀 (파일 없음): ' + file);
        }
      } else if (file && typeof file === 'object') {
        if (file.content && file.content.trim().length > 0) {
          var fname = file.filename || ('file_' + (i + 1) + '.md');
          archive.append(Buffer.from(file.content, 'utf-8'), { name: fname });
          console.log('[zipper] 파일 추가 (객체): ' + fname + ' (' + file.content.length + ' chars)');
          addedCount++;
        } else if (file.path && fs.existsSync(file.path)) {
          var fcontent = fs.readFileSync(file.path, 'utf-8');
          if (fcontent && fcontent.trim().length > 0) {
            var fn = file.filename || path.basename(file.path);
            archive.append(Buffer.from(fcontent, 'utf-8'), { name: fn });
            console.log('[zipper] 파일 추가 (path): ' + fn);
            addedCount++;
          }
        }
      }
    }

    if (addedCount === 0) {
      archive.abort();
      return reject(new Error('유효한 콘텐츠가 있는 파일이 없습니다.'));
    }

    archive.finalize();
  });
}

function generateZipFilename() {
  var now = new Date();
  function pad(n) { return String(n).padStart(2, '0'); }
  var datePart = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
  var timePart = pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  return 'slides_' + datePart + '_' + timePart + '.zip';
}

module.exports = { createZip, generateZipFilename };
