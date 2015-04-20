// OBJECT EXECUTOR - CLIENT [

var events = {EventEmitter: EventEmitter}

// constructor [
function ObjectExecutor(options) {
  if (!(this instanceof ObjectExecutor)) return new ObjectExecutor(options);
  events.EventEmitter.call(this);

  this.objects = {}
  this.startup()
  this.IsLivecomment = true
  this.IsLivecommentServer = false
  this.IsLivecommentClient = true
}
ObjectExecutor.prototype.__proto__ = events.EventEmitter.prototype;
// constructor ]

// startup [
ObjectExecutor.prototype.startup = function startup() {
  var self = this

  // boostrap [

  // set object for onFrame exectuion [
  this.object = {name:'CLI:::~~~23o4jwerfowe', events:[]}
  // set object for onFrame exectuion ]

  // hook frame('client.exec') [
  this.onFrame('client.exec', '', 'frame', function() {
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

// onEvent - PLUGIN SHARED [
ObjectExecutor.prototype.onEvent = function onEvent(name, cb) {
  this.on(name, cb)
  this.object.events.push([name, cb])
}
// onEvent - PLUGIN SHARED ]

// FRAME [

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
    console.log('EXE.ONFRAME', s, typeof cb)
  })
}
// onFrame - PLUGIN SHARED ]

// frame - PLUGIN SHARED [
ObjectExecutor.prototype.frame = function frame(type, id, options) {
  var frame = [type, id, options]
  console.log('EXE.FRAME', frame)
  this.object.frames.push(frame)
  this.emitFrame(frame, 'frame')
}
// frame - PLUGIN SHARED ]

// emitFrame [
ObjectExecutor.prototype.emitFrame = function emitFrame(frame, event, mode) {
  var self = this
  function emit(a, b, c) {
    var evname = '['+a+']['+b+']['+event+']'
// CONSOLE EXE.EMIT [
//    console.log('EXE.EMIT', evname, c, self.object.name)
// CONSOLE EXE.EMIT ]
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

// FRAME ]

// callbacks [

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
ObjectExecutor.prototype.process = function process(object, sources) {
  var self = this
  var comment = '//'
  var commentLen = comment.length
  var prefix = comment + ':='
  var prefixLen = prefix.length

  var src = sources[object.name];
  // object.objects -> [
  _.each(object.objects, function (o, key) {
    // 1. split to code:data [
    var mode = 0
    var code = ''
    var data = ''
    var begin = o.lines[0];
    var end = o.lines[1]-1;
    if (begin < end) {
      var ss = src.slice(begin, end);
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
  // object.objects -> ]
}
// process ]

var executor = new ObjectExecutor()

// OBJECT EXECUTOR - CLIENT ]

// ---- ---- ---- ---- [
// ---- ---- ---- ---- ]

// hook a=fn(a) [
ObjectExecutor.prototype.hook = function hook(name, object, params) {
  var handler = this._events[name];
  if (!handler)
    return object

  var listeners = (typeof handler == 'function') ? [handler] : handler.slice()

  _.each(listeners, function (l) {
    object = l(object, params)
  })
  return object
}
// hook a=fn(a) ]

// ---- ---- ---- ---- - [
// ---- ---- ---- ---- - ]

// FORMAT 1 - as comments, can't highlight (any language)
//: 1. client/server code exectuion [
//:= this.frame('client.exec')
//:= this.frame('server.exec')
//
// console.log('<LIVECOMMENT NOTYIFY> this FRAME executed on '+(this.IsLivecommentServer?"server":"client"))
//
//: 1. client/server code exectuion ]

/* FORMAT 2 - as multiline comments with highlight (language depence)
//: 2. client hooks [
//: = this.frame('client.exec')

  console.log("<LIVECOMMENT NOTYIFY> setup hooks")

  this.onEvent('afterScopeHeader', function (o, params) {
    console.log('<LIVECOMMENT NOTYIFY> afterScopeHeader')
    return o
  })
  this.onEvent('afterNodeHeader', function (o, params) {
    console.log('<LIVECOMMENT NOTYIFY> afterNodeHeader')
    return o
  })
  this.onEvent('afterProcessLines', function (o, params) {
    console.log('<LIVECOMMENT NOTYIFY> afterProcessLines')
    return o
  })
  this.onEvent('afterProcessObjects', function (o, params) {
    console.log('<LIVECOMMENT NOTYIFY> afterProcessObjects')
    return o
  })
  this.onEvent('afterElementUpdate', function (o, params) {
    console.log('<LIVECOMMENT NOTYIFY> afterElementUpdate')
    return o
  })
//: 2. client hooks ]
*/

/*
//: 3. test css [
//:= this.frame('client.exec')
$("<style type='text/css'> #menu { background-color:#36E;} </style>").appendTo("head");
//: 3. test css ]
*/

/*
//: 4. test editor [
//:= this.frame('client.exec')

$("<style type='text/css' media='screen' id='ace-editor-css'> #ace-editor-view {"+
"        margin: 70px;"+
"        position: fixed;"+
"        top: 0;"+
"        bottom: 0;"+
"        left: 0;"+
"        right: 0;"+
//"background-color: #212;"+
"background-color: #fff;"+
"z-index: 10;"+
//" box-shadow: 0 0 10px rgba(0,0,0,0.5); "+
"-webkit-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);"+
"-moz-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);"+
"box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);"+
"    }"+
"#ace-editor {width:100%;height:calc(100% - 50px);}"+
"#ace-editor-menu {"+
"background-color:#36E;"+
"}"+
"#ace-button-cancel {"+
"  margin: 10px;"+
"  color: #333;"+
"  background-color: #c24;"+
"  border: 0.1em solid #545454;"+
"  border-radius: 4px;"+
"  padding: 6px 12px;"+
"}"+
"#ace-button-apply {"+
"  margin: 10px;"+
"  color: #333;"+
"  background-color: #2c4;"+
"  border: 0.1em solid #545454;"+
"  border-radius: 4px;"+
"  padding: 6px 12px;"+
"float:right;"+
"}"+
"</style>").appendTo('head')

if (1 || !window.__ace_loaded) {
  window.__ace_loaded = true

  $("#ace-editor-view").remove()

  window.__ace_onClose = function () {
    $('#ace-editor-view').hide()
  }

  $("<div id='ace-editor-view'>"+
    "<div id='ace-editor-menu'>"+
    "<button id='ace-button-cancel' onclick='window.__ace_onClose()'>X</button>"+
    "<button id='ace-button-apply'>Apply</button></div>"+
    "<pre id='ace-editor'>TEXT</pre><div>"
  ).appendTo('body')

//  var editor

  $.ajax({
    url: "https://cdn.rawgit.com/ajaxorg/ace-builds/master/src-noconflict/ace.js",
  //  url: "https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-noconflict/ace.js",
  //  url: "https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.17/require.js",
    dataType: "script",
    success: function () {
      editor = ace.edit("ace-editor")
      editor.setTheme("ace/theme/twilight")
      editor.getSession().setMode("ace/mode/javascript")
    }
  });

  window.__ace_onEdit = function (a) {
    $('#ace-editor-view').show()
    editor.setValue($(a).html())
//    console.log($(a).html())
  }

if (0) {
  var $mw = $('#main-view')
  var $ps = $('pre') //$.find('pre')
  console.log($ps)
  $('pre').click(function(){
    alert('a')
//    window.__ace_editor
//    $('#ace-editor-view').show()
  })
}


  this.onEvent('afterProcessLines', function (o, params) {
    var msg = 'qwerty'
    o = o.replace("<pre ", "<pre onclick='window.__ace_onEdit(this)'")
//    console.log('<LIVECOMMENT NOTYIFY> afterProcessLines 1', o)
    return o
  })

  $('#ace-editor-view').hide()
}

//: 4. test editor ]
*/
