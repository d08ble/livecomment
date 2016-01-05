
### LiveComment information tool for Node

* LiveComment for 80/20 developers
* -1'000'000+ miles for your target
* Code navigator
* Code refactroing
* Local cloud IDE extension
* Your digital memory implant, brain helper
* Copy of your main

#### Install

```
$ npm install livecomment --save
```

#### Run Demo

```
$ node bin/livecomment
```

#### Open URL

[http://localhost:3070/](http://localhost:3070/)

#### Usage sample 

```javascript

// Import LiveComment module

var LiveComment = require('livecomment');

// Define options (default options location livecomment/config/config.js)

var options = {
  port: 3070,
  ws_port: 3071,
  dangerousCodeExecution: ['client', 'server'], // for plugins
  debug: 1,
  common: {
    ignore: [
      /^node_modules.*/,
      /^\.idea.*/,
      /^\.svn.*/,
      /^\.git.*/
    ]
  },
  paths: [
    '/path/to/dir/',
    // === or ===
    {
      '/path/to/dir1': {
        ignore: [
          /.*dist.*/
        ]
      }
    }
  ]
};

// Start server

var livecomment = new LiveComment(options);

```
#### Console output sample
See on console like that:
```
✔ socket.io server listening on port 8980
EXE.ONFRAME [server.exec][][frame] function
Scan files [
/path/to/dir/livecomment [
/path/to/dir/livecomment ]
Scan files ]
Watch for changes [
 /path/to/dir/livecomment
 /path/to/dir/livecomment/bin
 /path/to/dir/livecomment/config
 /path/to/dir/livecomment/plugins
 /path/to/dir/livecomment/public/css
 /path/to/dir/livecomment/public/js
 /path/to/dir/livecomment/views
Watch for changes ]
✔ Express server listening on port 3070 in development mode
/path/to/dir/livecomment/bin/index-debug.js javascript
EXE.EMIT [this][CHECK FORMAT][mount] undefined CHECK FORMAT
EXE.EMIT [this][SUPPORT FORMATS][mount] undefined SUPPORT FORMATS
/path/to/dir/livecomment/config/config.js javascript
EXE.EMIT [this][DEFAULT CONFIG][mount] undefined DEFAULT CONFIG
/path/to/dir/livecomment/livecomment.js javascript
...
```

#### ChangeLog
```
// 0.2.11 [
// [+] plugins/0/A000.js localhost:3000/plugins
// [+] main view overwrite - config homeIndex: function (req, res)
// [+] queryHash - unique page id for routing
// [+] routing - config filterRoute: function(name, filter) :: bool
// 0.2.11 ]
// 0.2.10 [
// [+] bugfix objname __lcFileCS hash checking
// [+] client htmlEscape fix
// [+] plugins/0 added
// [+] fix analyze sequence queue
// [+] hook beforeSet
// [+] noLogging server watch.skip, watch.scan, object.parsed, exe.emit, exe.frame, exe.onframe, run.eval
// [+] config.noLogging watch.<type> added
// [+] disable process.PORT, use config.port
// [+] speed up networking
// [+] bugfix: scan break when remaining+'\n' > 0
// [+] configure ws port
// [+] code execution client
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
// <0.2.2 [
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
// <0.2.2 ]
```
