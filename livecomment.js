// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** [
//
//  by d08ble
//
// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** ]

// URL NPM [
// https://www.npmjs.org/package/livecomment
// URL NPM ]


// KNOWN BUGS [
// [ ] experiment code. code review required
// [ ] multiple tags split, demo:
//     * TAG [
//     *  one
//     * TAG ]
//     * TAG [
//     *  two
//     * TAG ]
// [ ] multiple node instanses not configure ws 8080 port
// KNOWN BUGS ]

// SOLVED [
// 0.2.10 [
// [ ] configure ws port
// [ ] code execution client
// [+] code execution server
// [+] reconnect on each message bugfix: socket.io 1.2.0 updated
// [+] tested: add onLoaded event at startup -> send event:'state'
// [+] bugfix: add new object client updateState is wrong
// [+] bugfix: optimized Prism.highlightAll
// [+] bugfix: client scope to end (from begin) fixed
// [+] bugfix: fix crash out of memory while scan binary files (add async logic)
// 0.2.10 ]
// 0.2.9 [
// [+] type 'skip' bugfix
// 0.2.9 ]
// 0.2.8 [
// [+] require scanwatch. config changed (see bin/livecomment)
// 0.2.8 ]
// 0.2.7 [
// [+] added sh pro
// [+] shell scripts highlight
// 0.2.7 ]
// 0.2.6 [
// [+] added acpu heartbeat animation
// 0.2.6 ]
// 0.2.5 [
// [+] added acpul
// 0.2.5 ]
// 0.2.4 [
// [+] fixed objc m mm
// 0.2.4 ]
// 0.2.3 [
// [+] bugfixing - expand on reload page
// 0.2.3 ]
// [+] added state save/restore
// [+] send broadcast event update. livecomment heartbeat
// [+] notify client onChange event
// [+] show source on click
// [+] menu base (on/off ui components, change form)
// [+] add language type to <code...>
// [+] add file filter by ext/type
// [+] prism: fixed escape
// [-] hljs: disabled, using prism (faster)
// [+] client: click $.toggle scope
// [+] show code with hljs
// [+] fixed connectAsset pwd path setup
// [+] added script bin/livecomment
// [+] client view tree base
// [+] code as node_module updated
// [+] "ignore watch scan" paths config
// SOLVED ]

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

  // CONFIG ]

  // HTTP SERVER [

  var app = express();

  app.set('port', process.env.PORT || config.port);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  app.use(connectAssets({
    paths: [__dirname+'/public/css', __dirname+'/public/js'],
    helperContext: app.locals
  }));
  app.use(function(req, res, next){
    res.locals.config = config;
    next();
  });
  function homeIndex(req, res) {
    res.render('home', {
      title: 'Home'
    });
  };

  app.get('/', homeIndex);

  app.use('/img', express.static(__dirname+'/public/img'));

  app.listen(app.get('port'), function() {
    console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
  });

  // HTTP SERVER ]

  var storage;

  // WS SERVER [

  console.log("✔ socket.io server listening on port %d", config.ws_port);

  var io = require('socket.io').listen(config.ws_port);
  io.sockets.on('connection', function (socket) {

    console.log('socket');

    var time = (new Date).toLocaleTimeString();
    socket.json.send({'event': 'connected', 'time': time});

    function sendState(socket) {
      var files = {};
      var objects = {}
      _.each(storage.objects, function(o) {
        buf = fs.readFileSync(o.filename, "utf8");
        objects[o.name] = {
          name: o.name,
          extlang: o.extlang,
          objects: o.objects
        }
        files[o.name] = buf.split('\n');
      });
      socket.json.send({'event': 'state', 'objects': objects, 'files': files});
    };

    sendState(socket);

    socket.on('message', function (msg) {
      conslole.log('msg:', msg);
    });

    // NOTIFY CLIENTS [
    storage.on('object.updated', function(o) {

      io.sockets.sockets.forEach(function (socket) {
        var file = fs.readFileSync(o.filename, "utf8");
        var obj = {
          name: o.name,
          extlang: o.extlang,
          objects: o.objects
        }
        socket.json.send({'event': 'object.updated', 'object': obj, 'file': file});
      });

    })
    // NOTIFY CLIENTS ]

  });

  // WS SERVER ]

  // OBJECT EXECUTOR [
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

  // startup [
  ObjectExecutor.prototype.startup = function startup() {
    var self = this
    this.test()
    // boostrap [
    this.object = {name:'SYS:::~~~23o4jwerfowe', events:[]}
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
    // boostrap ]
  }
  // startup ]

  // callbacks [
  ObjectExecutor.prototype.beforeSet = function beforeSet(object) {
    // 3. return object
    var listeners = this.listeners('beforeSet')
    _.each(listeners, function (l) {
      object = l(object)
    })
    return object
  }
  ObjectExecutor.prototype.mount = function mount(name) {
    var o = this.objects[name]
    if (o)
      this.emitFrames(o.frames, 'mount', true)
  }
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
  // callbacks ]

  //
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

  // frame [
  ObjectExecutor.prototype.frame = function frame(type, id, options) {
    var frame = [type, id, options]
    console.log('EXE.FRAME', frame)
    this.object.frames.push(frame)
    this.emitFrame(frame, 'frame')
  }

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
      console.log('EXE.ONFRAME', s, typeof cb)
    })
  }
  // frame ]

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
    console.log('EVAL [');
    console.log('CODE [');
    console.log(code);
    console.log('CODE ]');
    console.log('DATA [');
    console.log(data);
    console.log('DATA ]');
    console.log('EVAL ]');
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
    // 1. split to code:data
    // 2. execute(code, data)
    var comment = '//'
    var commentLen = comment.length
    var prefix = comment + ':='
    var prefixLen = prefix.length
    _.each(object.objects, function (o, key) {
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
      executor.setObject(key)
      if (code !== '')
        self.run(code, data)
      // mount [
      executor.mount(key)
      // mount ]
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
      // unmount [
      var prev = this.objects[object.name]
      prev && _.each(prev.objects, function (o, key) {
        executor.unmount(key)
      })
      // unmount ]
      // process [
      executor.process(object)
      // process ]

      // beforeSet [
      object = executor.beforeSet(object)
      // beforeSet ]
    }
    // code execution ]

    this.objects[object.name] = object;

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

      console.log(s);
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

  //  var prev = get(filename);
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

  function analyze(filename) {

    var stack = [];
    var input = fs.createReadStream(filename);
    var fileext = path.extname(filename);
    var lineN = 0;
    var objects = [];
    var lines = []

    function _configGetExtLang(filext) {
      var fileext1 = filext.indexOf('.') == 0 ? fileext.substring(1, filext.length) : fileext;
      if (!config.extlangs.hasOwnProperty(fileext1))
        return null;

      return config.extlangs[fileext1];
    };

    var extlang = _configGetExtLang(fileext);
    if (!extlang) {
      return;
    }

    // READ LINES/LINE [
    readLines(input, function readLine(line, complete) {
  //    console.log(line);
      lines.push(line);
      lineN += 1;

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

      // complete [
      if (complete)
      {
        mergeChanges(filename, extlang, lines, objects);
        return true;
      }
      // complete ]

      var res = checkCommentLine(stack, fileext, line, lineN, {
        begin: function(stack, c) {
        },
        end: function(stack, c) {
  //        udb.add(c);
          console.log(c);
          objects.push(c);
        },
        error: function(msg) {
          console.log('ERROR:', msg);
        }
      });

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

  scanwatch.setup(options, function (type, file) {
    console.log(type, file)
    if (type != 'skip' && fs.existsSync(file) && !fs.lstatSync(file).isDirectory()) {
      analyze(file)
    }
  })

  // SCANWATCH ]

};

// LiveComment ]

module.exports = LiveComment
