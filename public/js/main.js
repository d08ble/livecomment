// EXE [

console.log('main initialized');

// EXE ]

// CONFIG [

var ws_port = $("meta[name='ws_port']").attr('content') || 8980;

// CONFIG ]

// TREE [

function Tree() {

  // NODE STRUCTURE [
  this.root = {
    name: null,
    _children: []
  };
  // NODE STRUCTURE ]
};

// TOOL [

function createNode(node, name) {
  var n = {
    name: name,
    lines: [0, 0],
    _children: []
  };

  node._children.push(n);

  return n;
}

function childByName(node, name) {
  var children = node._children;
  for (var i = 0; i < children.length; i++)
    if (children[i].name == name)
      return children[i];
  return null;
}

// TOOL ]

Tree.prototype.getNodeForParents = function getNodeForParents(parents) {
  var node = this.root;

  for (var i = 0; i < parents.length; i++) {
    var parent = parents[i];
    var c = childByName(node, parent);
    if (!c)
      return null;
    node = c;
  }
  return node;
};

Tree.prototype.createNodeForParents = function createNodeForParents(parents) {
  var node = this.root;
  var path = null;
  var P0 = '///!@#~~';

  for (var i = 0; i < parents.length; i++) {
    var parent = parents[i];
    path = path ? path+P0+parent : parent;
    var c = childByName(node, parent);
    if (!c) {
      c = createNode(node, parent);
      c.uid = calcMD5(path);
    }
    node = c;
  }
  return node;
};

// SORT [
// not used: wrong sort [
sortRecursive = function (node, compare) {
  node._children = node._children.sort(compare);

  var children = node._children;
  for (var i = 0; i < children.length; i++) {
    sortRecursive(children[i], compare);
//    console.log(children[i].name);
  }
  return this;
};

Tree.prototype.sortByLineNumber = function sortByLineNumber() {
  sortRecursive(this.root, function compare(a, b) {
//    console.log(a.lines[0], b.lines[0]);
    return a.lines[0] < b.lines[0] ? 0 : 1;
  });
};
// not used: wrong sort ]

// SORT ]

// TREE ]

// HIDE-SHOW [
function hideshow($n, v) {
  if (v == 'hide') {
    $n.hide();
  } else {
    $n.show();
  }
}
function hideShowNodes($n, v) {
  hideshow($n, v);
  $n.each(function(i, el) {
    var $el = $(el);
    var uid = $el.attr('id');
    $el.attr('data-nodes', v);

    var key = uid+'.'+'nodes';
    localStorage.setItem(key, v);
//    console.log(key, v);
  });
}

function hideShowCode($n, v) {
  hideshow($n, v);
  $n.each(function(i, el) {
    var $el = $(el).parent();
    var uid = $el.attr('id');
    $el.attr('data-code', v);

    var key = uid+'.'+'code';
    localStorage.setItem(key, v);
//    console.log(key, v);
  });
}

function restoreHideShow($n, v) {
  $n.each(function(i, el) {
    var uid = $(el).attr('id');
    var keyNodes = uid+'.'+'nodes';
    var keyCode = uid+'.'+'code';
    var nodesState = localStorage.getItem(keyNodes);
    var codeState = localStorage.getItem(keyCode);

    if (nodesState != null) {
      $(el).attr('data-nodes', nodesState);
//      var $childNodes = $(el).children('node');
      // hack for n-s-* node uid [
      if (uid.indexOf('n-s-') != 0)
        hideshow($(el), nodesState);
      // hack for n-s-* node uid ]
    }
    if (codeState != null) {
      $(el).attr('data-code', codeState);
      var $childCode = $(el).children('pre');
      hideshow($childCode, codeState);
    }
  });
}

// HIDE-SHOW ]

// MAIN VIEW [

function MainView() {
  this.$el = $('#main-view');

  // STATE [
  this.state = {
    recursive: true,
    mode: 'code',
//    mode: 'childs',
//    mode: 'code childs',
    applyChilds: true
  };
  // STATE ]

};

function transformObjectToTree(tree, path, object) {
  var P0 = '///!@#~~';
  var parents = path.split(P0);

  var o = tree.getNodeForParents(parents);
  if (!o) {
    o = tree.createNodeForParents(parents);
  }
  o.lines = object.lines;
  o.hash = object.hash;
}

// delegateEvents [

MainView.prototype.delegateEvents = function delegateEvents($el) {

  var self = this;

  // DOM UPDATE STATE [

  function modifyState($n) {
    var state = self.state;

    function selectByStateRecursive(name) {
      if (state.recursive) {
        return $n.find(name);
      } else {
        return $n.children(name)
      }
    }

    var a;
    var b;
    if (state.mode == 'code') {
      a = selectByStateRecursive('pre:visible');
      if (a.length > 0)
//        a.hide();
        hideShowCode(a, 'hide');
      else {
        a = selectByStateRecursive('pre');
//        a.show();
        hideShowCode(a, 'show');
      }
    }
    if (state.mode == 'childs') {
      a = selectByStateRecursive('.node:visible');
      if (a.length > 0)
        hideShowNodes(a, 'hide');
//        a.hide();
      else {
        a = selectByStateRecursive('.node');
//        a.show();
        hideShowNodes(a, 'show');
      }
    }
    if (state.mode == 'code childs') {
      a = selectByStateRecursive('.node:hidden');
      b = selectByStateRecursive('pre:hidden');

      if (a.length > 0 || b.length > 0) {
        hideShowNodes(a, 'show');
        hideShowCode(b, 'show');
//        a.show();
//        b.show();
      } else {
        a = selectByStateRecursive('.node');
        b = selectByStateRecursive('pre');
        hideShowNodes(a, 'hide');
        hideShowCode(b, 'hide');
//        a.hide();
//        b.hide();
      }
    }
  }

  // DOM UPDATE STATE ]

  var a = $el.find('.scope-name');
  a.click(function(e) {
    var a = $(e.currentTarget).parent().children('.node');
    modifyState(a);
  });

  var b = $el.find('.node-name');
  b.click(function(e) {
    var a = $(e.currentTarget).parent();
    modifyState(a);
  });
};

// delegateEvents ]

// htmlString [
// scope [
function htmlStringScopeHeader(scope) {
  return '<div class="scope" id="s-'+scope.uid+'" data-nodes="show" data-code="hide">' +
    '<div class="scope-name">'+scope.name+'</div>'
}
// scope ]
// node [
function htmlStringNodeHeader(scope, node, k) {
  var nodeName = node.uid || 's-'+scope.uid
  var s = '<div class="node" id="n-'+nodeName+'" data-nodes="show" data-code="hide">'
  if (k != 0)
    s += '<div class="node-name" style="padding-left: '+k*10+'px;">'+node.name+' '+node.lines[0]+','+node.lines[1]+'</div>'
  return s
}
// node ]
// htmlString ]

// UPDATE STATE [

MainView.prototype.updateState = function updateState($el, objects, sources) {
//  console.log(objects, sources);
  var s = '';

  _.each(objects, function(scope) {
    var tree = new Tree();

    // MAKE TREE [
    _.each(scope.objects, function(object, name) {
      transformObjectToTree(tree, name, object);
    });
    // MAKE TREE ]

    scope.uid = calcMD5(scope.name);

//    s += '<div class="scope" id="s-'+scope.uid+'" data-nodes="show" data-code="hide">';
//    s += '<div class="scope-name">'+scope.name+'</div>';
    s += htmlStringScopeHeader(scope)
//    console.log(tree);

    function processLines(begin, end) {
      var s = '';
      end -= 1;
      if (begin < end) {
//        console.log(begin, end);
        var src = sources[scope.name];
        var lines = src.slice(begin, end);
        while (lines.length > 0 && lines[0] == '')
          lines = lines.slice(1, lines.length);
        if (lines.length > 0) // && !(lines.length == 1 && lines[0] == ''))
        {
          var s1 = lines.join('\n');
          s1 = s1.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
          s += '<pre style="padding-left: 50px; display: none;"><code  class="language-'+scope.extlang+'" data-nodes="show" data-code="hide">'+s1+'</code></pre>' //prism
        }
//          s += '<pre style="padding-left: 50px;"><code>'+lines.join('\n')+'</code></pre>'
      }
      return s;
    }

    function processNode(node, k) {
      var s = htmlStringNodeHeader(scope, node, k)

      var begin = 0,
          end = sources[scope.name].length;

      if (node.lines) {
        begin = node.lines[0];
        end = node.lines[1];
      }
      _.each(node._children, function(child, i) {
        var beginC = child.lines[0],
            endC = child.lines[1];

        s += processLines(begin, beginC);

        s += processNode(child, k+1);

        begin = endC;
      });

      s += processLines(begin, end);

      s += '</div>';
      return s;
    }

    s += processNode(tree.root, 0);
    s += '</div>';

  });

/*  _.each(objects, function(scope) {
    s += scope.name+'<br>';
    _.each(scope.objects, function(object, name) {
//      s += name+'<br>';
    });
  });*/
  $el.html(s);

  restoreHideShow($el.find('.node'));
/*
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
*/
//  Prism.highlightAll();
  var $codes = $el.find('code')
  _.each($codes, function ($code) {
    Prism.highlightElement($code);
  })
//  Prism.highlightElement($els);

  this.delegateEvents($el);
};

// UPDATE STATE ]

// UPDATE STATE OBJECT [

MainView.prototype.updateStateObject = function updateStateObject(object, source) {
//  console.log(object, source)
  object.uid = calcMD5(object.name);
  var a = $('[id="s-'+object.uid+'"]');

  if (a.length == 0) {
    this.$el.append(htmlStringScopeHeader(object))
    a = $('[id="s-'+object.uid+'"]');
  }
  var file = {}
  file[object.name] = source.split('\n')
  this.updateState(a, [object], file)
};

// UPDATE STATE OBJECT ]

// MAIN VIEW ]

$(document).ready(function onReady() {

  var mainView = new MainView();

  // WS CLIENT [
  socket = io.connect(window.location.hostname+':'+ws_port);

  socket.on('connect', function () {
//  io.sockets.on('connection', function (socket) {
    console.log('io.connected');

    socket.on('message', function (msg) {
//      console.log('msg:', msg);
      if (msg.event == 'state') {
        mainView.updateState(mainView.$el, msg.objects, msg.files);
      } else if (msg.event == 'object.updated') {
//        console.log(msg);
        mainView.updateStateObject(msg.object, msg.file);
      }
    });
  });
  // WS CLIENT ]

  // MENU [

  $('#menu #btnmm').click(function(e) {
    var a = $('.scope').find('.node:first').find('.node');
    hideShowNodes(a, 'hide');
  });
  $('#menu #btnpp').click(function(e) {
    var a = $('.scope').find('.node:first').find('.node');
    hideShowNodes(a, 'show');
  });
  $('#menu #btnmc').click(function(e) {
    var a = $('pre');
    hideShowCode(a, 'hide');
//    a.hide();
  });
  $('#menu #btnpc').click(function(e) {
    var a = $('pre');
    hideShowCode(a, 'show');
//    a.show();
  });

  // MODE SELECTION [
  function mainViewStateSet(mode, recursive) {
    mainView.state.mode = mode;
    mainView.state.recursive = recursive;
  }
  $('#menu #radio1').click(function() {
    mainViewStateSet('code', false);
  });
  $('#menu #radio2').click(function() {
    mainViewStateSet('childs', false);
  });
  $('#menu #radio3').click(function() {
    mainViewStateSet('code childs', false);
  });
  $('#menu #radio4').click(function() {
    mainViewStateSet('code', true);
  });
  $('#menu #radio5').click(function() {
    mainViewStateSet('childs', true);
  });
  $('#menu #radio6').click(function() {
    mainViewStateSet('code childs', true);
  });
  // MODE SELECTION ]

  // MENU ]
});

// iPad label click bugfix [
if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i)) {
  $(document).ready(function () {
    $('label[for]').click(function () {
      var el = $(this).attr('for');
      if ($('#' + el + '[type=radio], #' + el + '[type=checkbox]').attr('selected', !$('#' + el).attr('selected'))) {
        return;
      } else {
        $('#' + el)[0].focus();
      }
    });
  });
}
// iPad label click bugfix ]

// LIB ESCAPE [
/*** not tested
 (function() {
  var objGlobal = this;
  if(!(objGlobal.escape && objGlobal.unescape)) {
    var escapeHash = {
      _ : function(input) {
        var ret = escapeHash[input];
        if(!ret) {
          if(input.length - 1) {
            ret = String.fromCharCode(input.substring(input.length - 3 ? 2 : 1));
          }
          else {
            var code = input.charCodeAt(0);
            ret = code < 256
              ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase()
              : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
          }
          escapeHash[ret] = input;
          escapeHash[input] = ret;
        }
        return ret;
      }
    };
    objGlobal.escape = objGlobal.escape || function(str) {
      return str.replace(/[^\w @\*\-\+\.\/]/g, function(aChar) {
        return escapeHash._(aChar);
      });
 };
 objGlobal.unescape = objGlobal.unescape || function(str) {
      return str.replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, function(seq) {
        return escapeHash._(seq);
      });
    };
 }
 })();
 */
// LIB ESCAPE ]

