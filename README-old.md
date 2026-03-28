
### LiveComment information tool for Node

LiveComment is the missing link in the Evolution of the Web.

#### Features

* Impossible simple & minimalistic quine
* Powerfull multilanguage plugin system with live reload
* Single code for Frontend/Backend, just set like //:=frame('client.exec')

#### Live demo:

[http://acpul.org/livecomment](http://acpul.org/livecomment)

#### Info

![alt text]( https://cdn.rawgit.com/d08ble/media/master/screen0.png "LiveComment inside")
![alt text]( http://41.media.tumblr.com/d84b3498f829138b0742429bf9841e2e/tumblr_nn08gkQe8v1ut3bxko1_1280.jpg "LightTable+LiveComment")

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

#### Donate BTC

18Bth1u3pSJzPrCf21tx1F6iSzA2fgKdfU

#### License

[MIT](https://github.com/d08ble/livecomment/blob/master/LICENSE)
