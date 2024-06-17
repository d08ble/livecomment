(function () {
  // options [

  options = {
    port: 3070,
    ws_port: 8980,
    debug: false,

    dangerousCodeExecution: [],

    common: {
      ignore: [
      ]
    },

    extlangs: {
      'css': 'css',
      'less': 'css',
      'js': 'javascript',
//    'jade': 'jade',
      'json': 'javascript',

      'hpp': 'cpp',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'cpp',

      'm': 'objectivec',
      'mm': 'objectivec',

      'acpul': 'c',

      'pro': 'c',
      'sh': 'c',

      'rs': 'javascript',
      'toml': 'py',

      'py': 'python',

      'swift': 'c'
    },

    noLogging: [
      'watch.skip',
      'watch.scan',
      'object.parsed',
      'exe.emit',
      'exe.frame',
      'exe.onframe',
      'run.eval'
    ],

    paths: []
  }

  // options ]
  // help [

  var usage = process.argv[1]+' [--port <port>] [--ws_port <port>] [--path <path> [--ignore <regexp>]]...\n' +
    '  [--preset <name>\n' +
    '  [--ws_port_client <port>\n' +
    '  [--dangerousCodeExecutionClient] [--dangerousCodeExecutionServer] \n' +
    '  [--debug]' +
    '  [--log <type[,type...]>]' +
    '  [--verbose]\n\n' +
    '  Example:\n' +
    '   livecomment .\n' +
    "   livecomment --port 5000 --ws_port 5001 --ignore '\.git\/' --path . --ignore '\/node_modules.*' --path config/ --dangerousCodeExecutionClient --dangerousCodeExecutionServer --debug 1 --log=watch.skip,watch.scan --help\n"

  var describe = {
    'port': 'http port (default: 3070)',
    'ws_port': 'websocket port (default: 8980)',
    'ws_port_client': 'websocket port for client (default: 8980) for vm port mapping like 8980:12345',
    'path': 'path to your files',
    'ignore': 'filter files in path',
    'dangerousCodeExecutionClient': '(depreacted, always enabled) run js plugins in html, can controll your browser',
    'dangerousCodeExecutionServer': 'run js plugins locally, can access your system files (default: disabled)',
    'fileProcessDelay': 'file process delay (default: 1s)',
    'debug': 'enable debug mode (default: NO)',
    'log': 'enable logging for event types: watch.skip, watch.scan, object.parsed, exe.emit, exe.frame, exe.onframe, run.eval',
    'verbose': 'verbose',
    'preset': 'options preset, available presets: node (todo)'
  }

  // help ]
  // process args [

  var minimist = require('./minimist-patched')

  var lastPath

function addPath(path) {
    var o = {}
    o[path] = {
      ignore: [
      ]
    }
    lastPath = o[path]
    options.paths.push(o);
}

var workingDirectory = process.cwd()
console.log("workingDirectory", workingDirectory)


  var argv = minimist(process.argv.slice(2), {
    unknown: function(arg, key, val) {
      if (key == 'ignore') {
        if (!lastPath) {
          options.common.ignore.push(new RegExp(val));
        }
        else {
          lastPath.ignore.push(new RegExp(val));
        }
      }
      else if (key == 'path') {
        addPath(val)
        var o = {}
        o[val] = {
          ignore: [
          ]
        }
        lastPath = o[val]
        options.paths.push(o);
      }
      if (arg == '.') {
        // $ livecomment .
        addPath(workingDirectory)
      }
//      console.log(key, val)
      return true
    }
  })

  // Add work dir as default
  if (options.paths.length == 0) {
    addPath(workingDirectory)
  }

  // Process options
  if (argv.port) {
    options.port = argv.port
  }
  if (argv.ws_port) {
    options.ws_port = argv.ws_port
  }
  if (argv.ws_port_client) {
    options.ws_port_client = argv.ws_port_client
  }
  if (argv.debug) {
    options.debug = argv.debug
  }
  if (argv.fileProcessDelay) {
    options.fileProcessDelay = argv.fileProcessDelay
  }
  
  // Always enable frontend plugins
  options.dangerousCodeExecution.push('client')

  if (argv.dangerousCodeExecutionServer) {
    options.dangerousCodeExecution.push('server')
  }
  if (argv.log) {
    var a = argv.log.split(',')
    a.forEach(function (s) {
//      console.log(s)
      var i = options.noLogging.indexOf(s)
      if (i != -1) {
        options.noLogging.splice(i, 1);
      }
    })
  }

  if (argv.verbose) {
    console.log(options)
  }

  if (argv.help) {
    console.log(usage)
    Object.keys(describe).forEach(function (p) {
      console.log('  --'+p+' -', describe[p])
    })
    return
  }

  // process args ]

options.extractCommentTagFromLine = function extractCommentTagFromLine(fileext, line) {
  line = line.trim();
  // CHECK FORMAT [
  var b;
  function chkfmt(b) {
    if (line.indexOf(b) == 0 && line.indexOf('[') == line.length-1) // begin
      return [line.substr(b.length, line.length-b.length-1).trim(), 0];
    if (line.indexOf(b) == 0 && line.indexOf(']') == line.length-1 && line.indexOf('[') == -1) // end
      return [line.substr(b.length, line.length-b.length-1).trim(), 1];
    return null;
  };
  // CHECK FORMAT ]

  // SUPPORT FORMATS [
  switch (fileext) {
    case '.log':
    case '.txt':
      function chkfmt0() {
        if (line.length > 0 && line.indexOf('[') == line.length-1) {// begin
          return [line.substr(0, line.length-1).trim(), 0];
        }
        if (line.length > 0 && line.indexOf(']') == line.length-1 && line.indexOf('[') == -1) { // end
          return [line.substr(0, line.length-1).trim(), 1];
        }
        return null
      }
      return chkfmt0() || false;
    case '.ts':
    case '.js':
    case '.java':
    case '.c':
    case '.h':
    case '.cpp':
    case '.hpp':
    case '.less':
    case '.m':
    case '.mm':
    case '.rs':
    case '.swift':
      return chkfmt('//') || false;
    case '.css':
      return chkfmt('/*') || false;
    case '.acpul':
    case '.sh':
    case '.py':
    case '.pro':
    case '.toml':
      return chkfmt('#') || false;
    case '.ejs':
    case '.jade':
    case '.sass':
    case '.styl':
    case '.coffee':
      break;
    default:
      return null;
  }
  // SUPPORT FORMATS ]
  return false;
}

  var LiveComment = require('../livecomment')
  var livecomment = new LiveComment(options)

})();