var koa = require('koa');

var router = require('koa-router')();
var serve = require('koa-static');
var bodyParser = require('koa-bodyparser');
var fs = require('fs')
var path = require('path');
var Promise = require('bluebird');
var app = module.exports = koa();
Promise.promisifyAll(fs);

var svgStorage = path.join('.', 'public', 'uploadedSvgs');

app.use(serve('public/'));
app.use(serve('node_modules/paper'));
app.use(bodyParser());

router.post('/new', function*(){
  this.response.body = yield writeSvg(this.request.body.filename, this.request.body.svg);
});

router.get('/all', function*() {
  this.response.body = yield getAllSvgs();
});

app
  .use(router.routes())
  .use(router.allowedMethods());

if (!fs.existsSync(svgStorage)){
  fs.mkdirSync(svgStorage);
}

app.listen(3000);

function getSvgFilenames() {
  return new Promise(function(resolve, reject) {
    fs.readdir(svgStorage, function(err, data) {
      if (err) {
        reject(err);
      }
      var files = data.filter((file) => {
        return '.svg' === path.extname(file);
      });
      resolve(data);
    });
  });
}

function getAllSvgs() {
  var promises = [];
  getSvgFilenames().then((data) => {
    data.forEach((datum) => {
      promises.push(new Promise(function(resolve, reject) {
        fs.readFile(datum, function(err, contents) {
          if (err) {
            reject(err);
          }
          resolve(contents);
        });
      }));
    });
  });
  return Promise.all(promises);
}

function writeSvg(filename, svg) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path.join(svgStorage, filename), svg, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ status: 'ok' });
      }
    });
  })
}
