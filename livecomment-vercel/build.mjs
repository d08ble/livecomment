import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(__dirname, 'dist');

function loadLess() {
  for (const dir of [__dirname, ROOT]) {
    try {
      return require(path.join(dir, 'node_modules/less'));
    } catch (_) {}
  }
  throw new Error('less not found — run npm install in livecomment-vercel or project root');
}

const less = loadLess();

const WS_PORT = process.env.WS_PORT || '8980';
const CODE_EXECUTION = process.env.CODE_EXECUTION || 'false';
const QUERY_HASH = process.env.QUERY_HASH || '';

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function bundleJs() {
  const jsDir = path.join(PUBLIC, 'js');
  const parts = [
    path.join(jsDir, 'lib', 'socket.io.js'),
    path.join(jsDir, 'lib', 'prism.js'),
    path.join(jsDir, 'lib', 'md5.js'),
    path.join(jsDir, 'lib', 'EventEmitter.js'),
    path.join(jsDir, 'socketio.js'),
    path.join(jsDir, 'main.js'),
    path.join(jsDir, 'executor.js'),
  ];
  return parts.map((p) => fs.readFileSync(p, 'utf8')).join('\n;\n');
}

async function compileLess() {
  const src = path.join(PUBLIC, 'css', 'styles.less');
  const reset = path.join(PUBLIC, 'css', 'reset.css');
  const input = fs.readFileSync(reset, 'utf8') + '\n' + fs.readFileSync(src, 'utf8');
  const { css } = await less.render(input, { filename: src });
  return css;
}

function writeIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="livecomment for live projects">
  <meta name="author" content="d08ble">
  <meta name="ws_port" content="${WS_PORT}">
  <meta name="code_execution" content="${CODE_EXECUTION}">
  <meta name="queryHash" content="${QUERY_HASH}">
  <title>livecomment</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/hljs/default.css">
  <script src="https://cdn.jsdelivr.net/npm/jquery@2.1.0/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/underscore@1.13.6/underscore-min.js"></script>
  <script src="/js/bundle.js"></script>
</head>
<body>
  <div id="wrap">
    <div class="container">
      <div id="main-view">
        <h6>LIVECOMMENT [</h6>
          <h2>Hello world!</h2>
        <h6>LIVECOMMENT ]</h6>

        <h6>ports [</h6>
          <h6>WS: ${WS_PORT}</h6>
        <h6>ports ]</h6>
      </div>
    </div>
  </div>
  <div id="menu">
    <button id="btnmm">--</button>
    <button id="btnpp">++</button>
    <button id="btnmc">-[]</button>
    <button id="btnpc">+[]</button>
    <div class="selection-mode">
      <input type="radio" id="radio1" name="smode" value="A">
      <label for="radio1">CODE</label>
      <input type="radio" id="radio2" name="smode" value="B">
      <label for="radio2">CHILD</label>
      <input type="radio" id="radio3" name="smode" value="C">
      <label for="radio3">ALL</label>
      <input type="radio" id="radio4" name="smode" value="D" checked>
      <label for="radio4">CODE R</label>
      <input type="radio" id="radio5" name="smode" value="E">
      <label for="radio5">CHILD R</label>
      <input type="radio" id="radio6" name="smode" value="F">
      <label for="radio6">ALL R</label>
    </div>
    <div class="heartbeat" style="display:inline-block;float:right;margin:7px 10px 0 0">
      <img src="/img/heartbeat.gif" alt="">
    </div>
  </div>
</body>
</html>
`;
}

rmrf(DIST);
copyDir(PUBLIC, DIST);

fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'js', 'bundle.js'), bundleJs());

const css = await compileLess();
fs.writeFileSync(path.join(DIST, 'css', 'styles.css'), css);
fs.unlinkSync(path.join(DIST, 'css', 'styles.less'));

fs.writeFileSync(path.join(DIST, 'index.html'), writeIndexHtml());

console.log('Built dist/ from public/');
console.log('  WS_PORT=%s', WS_PORT);
