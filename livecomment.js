// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** [
//
//  by d08ble
//
// *** LIVE COMMENT FOR 80/20 DEVELOPERS *** ]

// URL NPM [
// https://www.npmjs.org/package/livecomment
// URL NPM ]

// TODO [
// [ ] add onLoaded event at startup -> send event:'state'
// [ ] shell scripts highlight
// [ ] fix crash out of memory while scan binary files (add async logic)
// TODO ]


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
// 0.2.9 [
// [+] type 'skip' bugfix
// 0.2.9 ]
// 0.2.8 [
// [+] require scanwatch. config changed (see bin/livecomment)
// 0.2.8 ]
// 0.2.7 [
// [+] added sh pro
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

  // IGNORE PATH [
  var ignoreWatch = [];
  var ignoreScan = [];

  _.each(config, function(s, param) {
    var keywords = param.split(' ');
    if (keywords[0] == 'ignore')
      for (var i = 1; i < keywords.length; i++) {

        function addPath(dst, s) {
          _.each(config.dirs, function(dir) {
            var p = path.resolve(__dirname, dir, s);
            dst.push(p);
          });
        }

        if (keywords[i] == 'watch')
          addPath(ignoreWatch, s);
        if (keywords[i] == 'scan')
          addPath(ignoreScan, s);
      }
  });
  // IGNORE PATH ]

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

  console.log("✔ socket.io server listening on port %d", 8080);

  var io = require('socket.io').listen(8080);
  io.sockets.on('connection', function (socket) {

    console.log('socket');

    var time = (new Date).toLocaleTimeString();
    socket.json.send({'event': 'connected', 'time': time});

    function sendState(socket) {
      var files = {};
      _.each(storage.objects, function(o) {
        buf = fs.readFileSync(o.name, "utf8");
        files[o.name] = buf.split('\n');;
      });
      socket.json.send({'event': 'state', 'objects': storage.objects, 'files': files});
    };

    sendState(socket);

    socket.on('message', function (msg) {
      conslole.log('msg:', msg);
    });

    // NOTIFY CLIENTS [
    storage.on('object.updated', function(obj) {

      io.sockets.sockets.forEach(function (socket) {
//        console.log('send object', obj.name, 'to', socket.id);

        var file = fs.readFileSync(obj.name, "utf8");
        socket.json.send({'event': 'object.updated', 'object': obj, 'file': file});
      });

    })
    // NOTIFY CLIENTS ]

  });

  // WS SERVER ]

  // LIB READ LINES [

  var fs = require('fs');

  function readLines(input, func) {
    var remaining = '';

    input.on('data', function(data) {
      remaining += data;
      var index = remaining.indexOf('\n');
      while (index > -1) {
        var line = remaining.substring(0, index);
        remaining = remaining.substring(index + 1);
        var res = func(line, false);
        if (!res)
          break;
        index = remaining.indexOf('\n');
      }
    });

    input.on('end', function() {
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

  DataStorage.prototype.set = function set(object) {
    this.objects[object.name] = object;

    this.emit('object.updated', object);
  }

  // DataObject [

  function DataObject(options) {
    if (!(this instanceof DataObject)) return new DataObject(options);

    this.name = options.name;
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
        // TODO: really bad code. also refactor (for custom comment format) [
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
        // TODO: really bad code. also refactor (for custom comment format) ]

        var tag = extractCommentTagFromLine(fileext, line);
        if (tag === null)
          return false;
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

      if (complete)
      {
        mergeChanges(filename, extlang, lines, objects);
        return true;
      }

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
