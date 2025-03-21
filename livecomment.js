// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** [
//
//  by d08ble
//
// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** ]

// URL NPM [
// https://www.npmjs.org/package/livecomment
// URL NPM ]

// KNOWN BUGS [
// || multiple tags split, demo:
//     * TAG [
//     *  one
//     * TAG ]
//     * TAG [
//     *  two
//     * TAG ]
// || scanwatch ignore multiple +subdirs
// || delete file
// || lazy update
// KNOWN BUGS ]


// MODULE DEPS [

var express = require('express');
var connectAssets = require('connect-assets');
var watch = require('node-watch');
var _ = require('underscore');
var path = require('path');
var walk = require('walkdir');
var async = require('async');
var md5 = require('MD5');
var events = require('events');
var scanwatch = require('scanwatch');

// MODULE DEPS ]
// LiveComment [

function LiveComment(options) {
  if (!(this instanceof LiveComment)) return new LiveComment(options);
  events.EventEmitter.call(this); // no events

  // CONFIG [

  var config = require('./config/config.js');

  config = _.extend(config, options);

  var dangerousCodeExecution = config.dangerousCodeExecution && config.dangerousCodeExecution.indexOf('server') != -1
  config.clientCodeExecution = !!(config.dangerousCodeExecution && config.dangerousCodeExecution.indexOf('client') != -1)

  function isLogging(s) {
    return !(config.noLogging && config.noLogging.indexOf(s) != -1)
  }

  // Log config options on startup
  console.log("\n=== LiveComment Configuration ===");
  console.log("Server Settings:");
  console.log("  Port:", config.port);
  console.log("  WebSocket Port:", config.ws_port);
  console.log("  WebSocket Client Port:", config.ws_port_client || 'same as server');
  console.log("\nSecurity Settings:");
  console.log("  Dangerous Code Execution:", config.dangerousCodeExecution || 'disabled');
  console.log("  Client Code Execution:", config.clientCodeExecution ? 'enabled' : 'disabled');
  console.log("\nFile Processing:");
  console.log("  Max File Size:", config.maxFileSize ? `${config.maxFileSize} bytes` : 'unlimited');
  console.log("  File Process Delay:", config.fileProcessDelay ? `${config.fileProcessDelay}ms` : '0ms');
  console.log("\nLogging:");
  console.log("  Disabled Logs:", config.noLogging ? config.noLogging.join(', ') : 'none');
  console.log("\nSupported File Types:");
  console.log("  Extensions:", Object.keys(config.extlangs || {}).join(', ') || 'none');
  console.log("==============================\n");

  // CONFIG ]
  // HTTP SERVER [

  var app = express();

  app.set('port', config.port);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
  app.use(connectAssets({
    paths: [__dirname+'/public/css', __dirname+'/public/js'],
    helperContext: app.locals
  }));
  app.use(function(req, res, next){
    res.locals.config = config;
    next();
  });
  function homeIndex(req, res) {
    if (config.homeIndex) {
      return config.homeIndex(req, res)
    }
    res.render('home', {
      title: 'Home'
    });
  };

  app.get('/', homeIndex);

  app.use('/img', express.static(__dirname+'/public/img'));

  // Start the server
  var server = app.listen(app.get('port'), function() {
    console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
  });

  // Export the server instance
  this.server = server;
  this.app = app;

  // HTTP SERVER ]

  var storage;

  // WS SERVER [

  console.log("✔ socket.io server listening on port %d", config.ws_port);

  var io = require('socket.io')(config.ws_port);

  io.sockets.on('connection', function (socket) {


    console.log('Client', socket.handshake.address);

    // SEND CONNECTED [

    var time = (new Date).toLocaleTimeString();
    socket.emit('message', {'event': 'connected', 'time': time});

    // SEND CONNECTED ]
    // SEND INITIAL STATE - todo: client should require hash list [

    function applyFilter(o, filter) {
      if (!config.filterRoute)
        return o
      // for prevent change original object, only
      var newO = {
        name: o.name,
        extlang: o.extlang,
        objects: JSON.parse(JSON.stringify(o.objects)),
        lines: o.lines.slice()
      }
      if (!config.filterRoute(newO, filter)) {
        return null
      }
      return newO
    }

    function sendState(socket) {
      var files = {};
      var objects = {}
      _.each(storage.objects, function(oSrc) {
        var o = applyFilter(oSrc, socket.lcFilter)
        if (!o)
          return


        objects[o.name] = {
          name: o.name,
          extlang: o.extlang,
          objects: o.objects
        }
        files[o.name] = o.lines //buf.split('\n');
      });
      socket.emit('message', {'event': 'state', 'objects': objects, 'files': files});
    };

//    sendState(socket);
    // SEND INITIAL STATE - todo: client should require hash list ]
    // ON MESSAGE [

    socket.on('message', function (msg) {
      console.log('msg:', msg);
      if (msg.event=='queryAll') {
        socket.lcFilter = {
          queryHash: msg.queryHash,
          location: msg.location
        };
        sendState(socket);
      }
    });

    // ON MESSAGE ]
    // OBJECT UPDATE -> NOTIFY CLIENTS [

    storage.on('object.updated', function(oSrc) {

      io.sockets.sockets.forEach(function (socket) {
        var o = applyFilter(oSrc, socket.lcFilter)
        if (!o)
          return

        //var file = fs.readFileSync(o.filename, "utf8");
        var obj = {
          name: o.name,
          extlang: o.extlang,
          objects: o.objects
        }
        var file = o.lines.join('\n')

        // hotfix: mulitple send same file - use socket-hash [

        var hash = md5(file)
        socket.__lcFileCS = socket.__lcFileCS || {}
        if (!(socket.__lcFileCS[obj.name] && socket.__lcFileCS[obj.name] == hash)) {
          socket.__lcFileCS[obj.name] = hash
          socket.emit('message', {'event': 'object.updated', 'object': obj, 'file': file});
        }
        else {
          console.log("duplicate "+ o.name)
        }

        // hotfix: mulitple send same file - use socket-hash ]
      });
    })

    // OBJECT UPDATE -> NOTIFY CLIENTS ]

  });

  // WS SERVER ]

  // OBJECT EXECUTOR [
  // constructor [

  function ObjectExecutor(options) {
    if (!(this instanceof ObjectExecutor)) return new ObjectExecutor(options);
    events.EventEmitter.call(this);

    this.objects = {}
    this.startup()
    this.IsLivecomment = true
    this.IsLivecommentServer = true
    this.IsLivecommentClient = false
  }
  ObjectExecutor.prototype.__proto__ = events.EventEmitter.prototype;

  // constructor ]
  // startup [

  ObjectExecutor.prototype.startup = function startup() {
    var self = this
    this.test()

    // boostrap [
    // onFrame require this.object [

    this.object = {name:'SYS:::~~~23o4jwerfowe', events:[]}

    // onFrame require this.object ]
    // hook frame('server.exec') [

    this.onFrame('server.exec', '', 'frame', function() {
      try
      {
        eval(self.data)
      }
      catch(e)
      {
        console.log('*** EVAL ERROR *** [')
        console.log(e)
        console.log('*** EVAL ERROR *** ]')
      }
    })

    // hook frame('server.exec') ]
    // boostrap ]
  }

  // startup ]
  // callbacks [
  // beforeSet - hook. can modify object. todo: use common proto.hook [

/*
  ObjectExecutor.prototype.beforeSet = function beforeSet(object) {
    // 3. return object
    var listeners = this.listeners('beforeSet')
    _.each(listeners, function (l) {
      object = l(object)
    })
    return object
  }
*/

  // beforeSet - hook. can modify object. todo: use common proto.hook ]
  // mount [

  ObjectExecutor.prototype.mount = function mount(name) {
    var o = this.objects[name]
    if (o)
      this.emitFrames(o.frames, 'mount', true)
  }

  // mount ]
  // unmount [

  ObjectExecutor.prototype.unmount = function unmount(name) {
    var self = this
    var o = this.objects[name]
    if (o) {
      this.emitFrames(o.frames, 'unmount', true)
      _.each(o.events, function (ev) {
        self.removeListener(ev[0], ev[1])
      })
    }
    delete this.objects[name]
  }

  // unmount ]
  // callbacks ]
  // setObject [

  ObjectExecutor.prototype.setObject = function setObject(name) {
    var object = {
      name: name,
      frames: [
        ['this', name, undefined]
      ],
      events: []
    }
    this.objects[name] = object
    this.object = object
  }

  // setObject ]
  // frame - PLUGIN SHARED [

  ObjectExecutor.prototype.frame = function frame(type, id, options) {
    var frame = [type, id, options]
    if (isLogging('exe.frame'))
      console.log('EXE.FRAME', frame)
    this.object.frames.push(frame)
    this.emitFrame(frame, 'frame')
  }

  // frame - PLUGIN SHARED ]
  // onFrame - PLUGIN SHARED [

  ObjectExecutor.prototype.onFrame = function onFrame(type, id, events, cb) {
    if (type == 'this')
      id = this.object.name
    var self = this
    var evs = events.split('|')
    evname = '['+type+']['+id+']'
    _.each(evs, function (ev) {
      var s = evname+'['+ev+']'
      self.on(s, cb)
      self.object.events.push([s, cb])
      if (isLogging('exe.onframe'))
        console.log('EXE.ONFRAME', s, typeof cb)
    })
  }

  // onFrame - PLUGIN SHARED ]
  // test [

  ObjectExecutor.prototype.test = function test() {
/*    this.on('beforeSet', function (o) {
      o.name = o.name+'TEST'
      return o;
    })
    this.setObject('aaa')
//    this.frame('test.css1')
//    this.frame('test.css1', 'id1')
    this.onFrame('this', '', 'mount|unmount', function (type, id, options) {
      console.log('A', type, id, options)
    })
    this.onFrame('test.css1', '', 'frame|mount|unmount', function (type, id, options) {
      console.log('B', type, id, options)
    })
    this.onFrame('test.css1', 'id1', 'frame|mount|unmount', function (type, id, options) {
      console.log('C', type, id, options)
    })
    this.frame('test.css1')
    this.frame('test.css1', 'id1')
    this.mount('aaa')
    this.unmount('aaa')
    this.frame('test.css1')*/
  }

  // test ]
  // emitFrame [

  ObjectExecutor.prototype.emitFrame = function emitFrame(frame, event, mode) {
    var self = this
    function emit(a, b, c) {
      var evname = '['+a+']['+b+']['+event+']'
      if (isLogging('exe.emit'))
        console.log('EXE.EMIT', evname, c, self.object.name)
      self.emit(evname, event, self.object.name, c)
    }
    var id = frame[1] === undefined ? '' : frame[1]
    if (id !== '' && mode === undefined)
      emit(frame[0], '', frame[2])      // all types
    emit(frame[0], id, frame[2])  // specific type
  }

  // emitFrame ]
  // emitFrames [

  ObjectExecutor.prototype.emitFrames = function emitFrames(frames, event, mode) {
    var self = this
    _.each(frames, function (frame) {
      self.emitFrame(frame, event, mode)
    })
  }

  // emitFrames ]
  // run [

  ObjectExecutor.prototype.run = function run(code, data) {
    if (isLogging('run.eval')) {
      console.log('EVAL [');
      console.log('CODE [');
      console.log(code);
      console.log('CODE ]');
      console.log('DATA [');
      console.log(data);
      console.log('DATA ]');
      console.log('EVAL ]');
    }
//    eval('console.log(this)')
//    var frame = this.frame
    this.data = data
    try
    {
      eval(code);
    }
    catch(e)
    {
      console.log('*** EVAL ERROR *** [')
      console.log(e)
      console.log('*** EVAL ERROR *** ]')
    }
  }

  // run ]
  // process [

  ObjectExecutor.prototype.process = function process(object) {
    var self = this
    var comment = '//'
    var commentLen = comment.length
    var prefix = comment + ':='
    var prefixLen = prefix.length
    _.each(object.objects, function (o, key) {
      // 1. split to code:data [
      var mode = 0
      var code = ''
      var data = ''
      var begin = o.lines[0];
      var end = o.lines[1]-1;
      if (begin < end) {
        var ss = object.lines.slice(begin, end);
        for (var i in ss) {
          var line = ss[i]
          if (line.indexOf(prefix) == 0) {
            var lineC = line.slice(prefixLen)
            code += lineC + '\n'
            continue;
          }
          if (mode == 0 && code !== '' && line.indexOf(comment) == 0)
            mode = 1
          if (mode == 1) {
            if (line.indexOf(comment) == 0)
              line = line.slice(commentLen)
          } else
            mode = 2

          data += line + '\n'
        }
      }
      // 1. split to code:data ]

      // 2. update [
      executor.setObject(key)
      // 2. update ]

      // 3. code execution [
      // execute(code, data) [

      if (code !== '')
        self.run(code, data)

      // execute(code, data) ]
      // mount [

      executor.mount(key)

      // mount ]
      // 3. code execution ]
    })
  }

  // process ]

  var executor = new ObjectExecutor()

  // OBJECT EXECUTOR ]
  // LIB READ LINES [

  var fs = require('fs');

  function readLines(input, func) {
    var remaining = '';

    function process() {
      var index = remaining.indexOf('\n');
      while (index > -1) {
        var line = remaining.substring(0, index);
        remaining = remaining.substring(index + 1);
//        var res = func(line, false);
//        if (!res)
//          break;
        func(line, false);
        index = remaining.indexOf('\n');
//        console.log(index)
      }
    }

    input.on('close', function() {

    })

    input.on('error', function(err) {
      console.log('Error input stream', err)

//      func('', true);
    })

    input.on('data', function(data) {
      remaining += data;

      process()
    });

    input.on('end', function() {
      if (remaining.length > 0) {
//        func(remaining, false);
        process()
      }
      if (remaining.length > 0) {
        func(remaining, false);
      }
      func('', true);
    });
  }

  // LIB READ LINES ]
  // LIB STRING [

  String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, "");
  };

  // LIB STRING ]
  // DataStorage [

  function DataStorage(options) {
    if (!(this instanceof DataStorage)) return new DataStorage(options);
    events.EventEmitter.call(this);

    this.objects = {};
  }
  DataStorage.prototype.__proto__ = events.EventEmitter.prototype;

  // set [

  DataStorage.prototype.set = function set(object) {
    // code execution [
    if (dangerousCodeExecution) {
      // 1. unmount [
      var prev = this.objects[object.name]
      prev && _.each(prev.objects, function (o, key) {
        executor.unmount(key)
      })
      // 1. unmount ]
      // 2. process [
      executor.process(object)
      // 2. process ]

      // 3. before SetObject [
//      object = executor.beforeSet(object)
      object = (options.hooks && options.hooks.beforeSet !== undefined) ? options.hooks.beforeSet(object) : object
      // 3. before SetObject ]
    }
    // code execution ]

    // SetObject [
    this.objects[object.name] = object;
    // SetObject ]

    this.emit('object.updated', object);
  }

  // set ]
  // DataObject [

  function DataObject(options) {
    if (!(this instanceof DataObject)) return new DataObject(options);

    this.name = options.name;
    this.filename = options.name;
    this.extlang = options.extlang;
    this.objects = {};
  }

  DataObject.prototype.set = function set(o, data)
  {
    var P0='[[[!@#~~';
    var P1='///!@#~~';
    function toStrPath(o) {
      function objectToStr(o) {
        return o.name// + P0 + o.lines[0] + ',' + o.lines[1];
      }
      var s = '';
      for (var i in o.parents) {
        var parent = o.parents[i];
        s += objectToStr(parent)+P1;
      }
      s += objectToStr(o);

//      console.log(s);
      return s;
    }
    var path = toStrPath(o);

    this.objects[path] = data;
  }

  // DataObject ]

  storage = new DataStorage();

  // DataStorage ]
  // MERGE LOGIC [

  function mergeChanges(filename, extlang, lines, objects) {

    if (objects.length > 0) {

      console.log(filename, extlang);

      var obj = new DataObject({name: filename, extlang: extlang});
      obj.lines = lines;

      for (var i in objects) {
        var o = objects[i];
        var data = lines.slice(o.lines[0], o.lines[1]).join('\n');
        obj.set(o, {hash:md5(data), lines: o.lines});
      }

      storage.set(obj);
    }
  };

  // MERGE LOGIC ]
  // ANALYZE FILE [

  function analyze(filename, callback) {
    var stack = [];

    function analyzeCallback() {
      process.nextTick(() => {
        callback()
      })
    }
  
      // CHECK MAX FILE SIZE [
    try {
      const stats = fs.statSync(filename);
      const fileSize = stats.size;
      if (fileSize > config.maxFileSize) {
        console.warn(`Skip file ${fileSize} > ${config.maxFileSize} maxFileSize ${filename}`)
        analyzeCallback()
        return
      }
    } catch (error) {
      console.error('Error getting file size:', error)
      analyzeCallback()
      return
    }
    // CHECK MAX FILE SIZE ]
  
    var input = fs.createReadStream(filename);
    var fileext = path.extname(filename);
    var lineN = 0;
    var objects = [];
    var lines = []

    // CHECK EXTLANG [

    function _configGetExtLang(filext) {
      var fileext1 = filext.indexOf('.') == 0 ? fileext.substring(1, filext.length) : fileext;
      if (!config.extlangs.hasOwnProperty(fileext1))
        return null;

      return config.extlangs[fileext1];
    };

    var extlang = _configGetExtLang(fileext);
    if (!extlang) {
      analyzeCallback()
      return;
    }

    // CHECK EXTLANG ]
    // READ LINES/LINE [

    readLines(input, function readLine(line, complete) {
  //    console.log(line);
      lines.push(line);
      lineN += 1;

      // checkCommentLine [

      function checkCommentLine(stack, fileext, line, lineN, cbs) {

        // custom comment format use config.extractCommentTagFromLine [

        function extractCommentTagFromLine(fileext, line) {
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
            case '.js':
            case '.java':
            case '.c':
            case '.h':
            case '.cpp':
            case '.hpp':
            case '.less':
            case '.m':
            case '.mm':
              return chkfmt('//') || false;
            case '.css':
              return chkfmt('/*') || false;
            case '.acpul':
            case '.sh':
            case '.py':
            case '.pro':
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

        var tag = (config.extractCommentTagFromLine && config.extractCommentTagFromLine(fileext, line)) || extractCommentTagFromLine(fileext, line);
        if (tag === null)
          return false;

        // custom comment format use config.extractCommentTagFromLine ]

        if (tag) {
          // PROCESSING TAG [
          if (tag[1] == 0) {
            // ON BEGIN [
            var c = {name:tag[0], lines:[lineN, -1], parents:[]};
            stack.push(c);
            cbs.begin(stack, c);
            // ON BEGIN ]
          } else if (tag[1] == 1) {
            // ON END [
            if (stack.length > 0) {
              var ok = false;
              // dirty hack! [
              if (stack.slice(-1)[0].name == tag[0])
                ok = true;
              else if (stack.length > 1 && stack.slice(-2)[0].name == tag[0]) {
                var a = stack.slice(-2);
                var c = stack.pop();
                ok = true;
              } else
                cbs.error('Found close tag without match start tag'+tag[0]);
              // dirty hack! ]
              if (ok) {
                var c = stack.pop();
                c.lines[1] = lineN;
                //_.each(stack, function(p) {c.parents.push(p.name);});
                c.parents  = stack.slice(0);
                cbs.end(stack, c);
              }
            } else {
              cbs.error('Found close tag without any start tag '+tag[0]);
            }
            // ON END ]
          }
  //        console.log(filename);
  //        console.log(tag);
          // PROCESSING TAG ]
        }

        return true;
      };

      // checkCommentLine ]
      // complete [

      if (complete)
      {
        mergeChanges(filename, extlang, lines, objects);
        analyzeCallback()
        return true;
      }

      // complete ]
      // check line [

      var res = checkCommentLine(stack, fileext, line, lineN, {
        begin: function(stack, c) {
        },
        end: function(stack, c) {
  //        udb.add(c);
          if (isLogging('object.parsed'))
            console.log(c);
          objects.push(c);
        },
        error: function(msg) {
          console.log('ERROR:', msg);
        }
      });

      // check line ]

      return res;
    });
    // READ LINES/LINE ]

  };

  // ANALYZE FILE ]
  // CHECK PATH [

  function checkContainsPathComponent(dirs, path) {
    return _.find(dirs, function(dir) {
      var v = path.indexOf(dir);
      return v == 0;
    });
  }
  // CHECK PATH ]
  // SCANWATCH [
  // files queue [

  var analyzeQueue = async.queue(analyze)

  var delayedFiles = {}

  function addDelayedFile(file) {
    delayedFiles[file] = new Date()
    var delayedFilesInterval = setInterval(function () {
      var now = new Date()
      _.each(delayedFiles, function (t, file) {
        var dt = now - t
        var maxTime = config && config.fileProcessDelay || 0
        if (dt > maxTime) {
//          console.log(file, dt)
          delete delayedFiles[file]
          analyzeQueue.push(file)
        }
      })
      if (_.size(delayedFiles) == 0) {
        clearInterval(delayedFilesInterval)
      }
    }, 200)
  }

  // files queue ]

  scanwatch.setup(options, function (type, file) {
    if (isLogging('watch.'+type))
      console.log(type, file)
    if (type != 'skip' && fs.existsSync(file) && !fs.lstatSync(file).isDirectory()) {
//      analyze(file)
//      analyzeQueue.push(file)
      addDelayedFile(file)
    }
  })

  // SCANWATCH ]
  // dbgbrk [

  ObjectExecutor.prototype.dbgbrk = function(s) {
    console.log('dbgbrk', s)
  }

  // dbgbrk ]

};

// LiveComment ]

module.exports = LiveComment
