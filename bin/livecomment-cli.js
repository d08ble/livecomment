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
      'sh': 'c'
    },

    noLogging: [/*
      'watch.skip',
      'watch.scan',
      'object.parsed',
      'exe.emit',
      'exe.frame',
      'exe.onframe',
      'run.eval'*/
    ],

    paths: []
  }

  // options ]
  // help [

  var usage = process.argv[1]+' [--port <port>] [--ws_port <port>] [--path <path> [--ignore <regexp>]]...\n' +
    '  [--dangerousCodeExecutionClient] [--dangerousCodeExecutionServer] \n' +
    '  [--debug]' +
    '  [--log <type[,type...]>]' +
    '  [--verbose]\n\n' +
    '  Example:\n' +
    "    livecomment --port 5000 --ws_port 5001 --ignore '\.git\/' --path . --ignore '\/node_modules.*' --path config/ --dangerousCodeExecutionClient --dangerousCodeExecutionServer --debug 1 --log=watch.skip,watch.scan --help\n"

  var describe = {
    'port': 'http port (default: 3070)',
    'ws_port': 'websocket port (default: 8980)',
    'path': 'path to your files',
    'ignore': 'filter files in path',
    'dangerousCodeExecutionClient': 'run js plugins locally, can access your system files (default: disabled)',
    'dangerousCodeExecutionServer': 'run js plugins in html, can controll your browser (default: disabled)',
    'debug': 'enable debug mode (default: NO)',
    'log': 'enable logging for event types: watch.skip, watch.scan, object.parsed, exe.emit, exe.frame, exe.onframe, run.eval',
    'verbose': 'verbose'
  }

  // help ]
  // process args [

  var minimist = require('./minimist-patched')

  var lastPath

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
        var o = {}
        o[val] = {
          ignore: [
          ]
        }
        lastPath = o[val]
        options.paths.push(o);
      }
//      console.log(key, val)
      return true
    }
  })
//  console.log(argv)

  if (argv.port) {
    options.port = argv.port
  }
  if (argv.ws_port) {
    options.ws_port = argv.ws_port
  }
  if (argv.debug) {
    options.debug = argv.debug
  }
  if (argv.dangerousCodeExecutionClient) {
    options.dangerousCodeExecution.push('client')
  }
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

  var LiveComment = require('../livecomment')
  var livecomment = new LiveComment(options)

})();