// EXE [

console.log('main initialized');

// EXE ]
// CONFIG [

var ws_port = $("meta[name='ws_port']").attr('content') || 8980;
var codeExecution = $("meta[name='code_execution']").attr('content');
var queryHash = $("meta[name='queryHash']").attr('content');

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
  highlightCodeProcess(v, $n, false)
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

  this.scopes = {}

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
// htmlEscape [

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// htmlEscape ]
// scope [

function htmlStringScopeHeader(scope) {
  return '<div class="scope" id="s-'+scope.uid+'" data-nodes="show" data-code="hide">' +
    '<div class="scope-name">'+scope.name+'</div>'
}

// scope ]
// node [

function htmlStringNodeHeader(scope, node, k) {
  var nodeName = node.uid || 's-'+scope.uid
  var s = '<div class="node" id="n-'+htmlEscape(nodeName)+'" data-nodes="show" data-code="hide">'
  if (k != 0)
    s += '<div class="node-name" style="padding-left: '+k*10+'px;">'+htmlEscape(node.name)+' '+node.lines[0]+','+node.lines[1]+'</div>'
  return s
}

// node ]
// htmlString ]
// highlight on show/hide event [

var codeOnShow = function ($code) {
  //if ([highlighted!='true']) {
  if (!$($code).attr('highlighted')) {
//    Prism.highlightElement($code)
    $($code).attr('highlighted', true)
  }
}
var codeOnHide = function ($code) {

}

var highlightCodeProcess = function (mode, $el, subnode) {
  var $nodes = subnode ? $el.find("div[data-code='"+mode+"']") : $el
  var $codes = $nodes.find("code")
  _.each($codes, function ($code) {
    if (mode == 'show') {
      codeOnShow($code)
    }
    else {
      codeOnHide($code)
    }
  });
}

// highlight on show/hide event ]
// UPDATE STATE [

MainView.prototype.updateState = function updateState($el, objects, sources) {
  return this.updateStateJQuery($el, objects, sources)

  // TODO: REMOVE

//  console.log(objects, sources);
  var s = ''
  var s_
  var self = this

  // objects -> [
  _.each(objects, function(scope) {

    if (codeExecution == "true") {
      // 1. unmount prev scope [
      var prev = self.scopes[scope.name]
      prev && _.each(prev, function (o, key) {
        executor.unmount(key)
      })
      // 1. unmount prev scope ]

      // 2. process [
      executor.process(scope, sources)
      // 2. process ]
    }

    // update scope keys [
    var keys = {}
    _.each(scope.objects, function(object, name) {
      keys[name] = true
    })
    self.scopes[scope.name] = keys
    // update scope keys ]

//  }
    var tree = new Tree();

    // MAKE TREE [
    _.each(scope.objects, function(object, name) {
      transformObjectToTree(tree, name, object);
    });
    // MAKE TREE ]

    scope.uid = calcMD5(scope.name);

    // EXECUTOR.HOOK: afterScopeHeader [
    s_ = htmlStringScopeHeader(scope)
    s_ = executor.hook('afterScopeHeader', s_, scope)
    s += s_
    // EXECUTOR.HOOK: afterScopeHeader ]

//    console.log(tree);

    function processLines(begin, end) {
      var lines = ''
      var s = '';
      end -= 1;
      if (begin < end) {
//        console.log(begin, end);
        var src = sources[scope.name];
        lines = src.slice(begin, end);
        while (lines.length > 0 && lines[0] == '')
          lines = lines.slice(1, lines.length);
        if (lines.length > 0) // && !(lines.length == 1 && lines[0] == ''))
        {
          var s1 = lines.join('\n');
//          s1 = s1.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
          s += '<pre style="padding-left: 50px; display: none;"><code  class="language-'+scope.extlang+'" data-nodes="show" data-code="hide">'+htmlEscape(s1)+'</code></pre>' //prism
        }
//          s += '<pre style="padding-left: 50px;"><code>'+lines.join('\n')+'</code></pre>'
      }
      // EXECUTOR.HOOK: afterProcessLines [
      s = executor.hook('afterProcessLines', s, [sources, scope, begin, end, lines])
      // EXECUTOR.HOOK: afterProcessLines ]

      return s;
    }

    function processNode(node, k) {
      var s
      // EXECUTOR.HOOK: afterNodeHeader [
      s_ = htmlStringNodeHeader(scope, node, k)
      s_ = executor.hook('afterNodeHeader', s_, [scope, node, k])
      s = s_
      // EXECUTOR.HOOK: afterNodeHeader ]

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
  // objects -> ]

  // EXECUTOR.HOOK: afterProcessObjects [
  s = executor.hook('afterProcessObjects', s, objects)
  // EXECUTOR.HOOK: afterProcessObjects ]

  $el.html(s);

  //restoreHideShow($el.find('.node'))

  //highlightCodeProcess('show', $el, true)

  this.delegateEvents($el);

  // EXECUTOR.HOOK: afterElementUpdate [
  executor.hook('afterElementUpdate', $el)
  // EXECUTOR.HOOK: afterElementUpdate ]
};

MainView.prototype.updateStateJQuery = function updateStateJQuery($el, objects, sources) {
  var self = this;

  // Clear existing content
  $el.empty();

  // Process each scope
  _.each(objects, function(scope) {
    if (codeExecution == "true") {
      // 1. unmount prev scope
      var prev = self.scopes[scope.name];
      prev && _.each(prev, function (o, key) {
        executor.unmount(key);
      });

      // 2. process
      executor.process(scope, sources);
    }

    // Update scope keys
    var keys = {};
    _.each(scope.objects, function(object, name) {
      keys[name] = true;
    });
    self.scopes[scope.name] = keys;

    var tree = new Tree();
    _.each(scope.objects, function(object, name) {
      transformObjectToTree(tree, name, object);
    });

    scope.uid = calcMD5(scope.name);

    // Create scope container
    var $scope = $('<div>', {
      class: 'scope',
      id: 's-' + scope.uid,
      'data-nodes': 'show',
      'data-code': 'hide'
    });

    // Add scope name
    $scope.append($('<div>', {
      class: 'scope-name',
      text: scope.name
    }));

    // Process nodes recursively
    function processNode(node, k) {
      // Equivalent to htmlStringNodeHeader:
      // Original: '<div class="node" id="n-'+htmlEscape(nodeName)+'" data-nodes="show" data-code="hide">'
      // Original: '<div class="node-name" style="padding-left: '+k*10+'px;">'+htmlEscape(node.name)+' '+node.lines[0]+','+node.lines[1]+'</div>'
      var $node = $('<div>', {
        class: 'node',
        id: 'n-' + (node.uid || 's-' + scope.uid),
        'data-nodes': 'show',
        'data-code': 'hide'
      });

      if (k !== 0) {
        $node.append($('<div>', {
          class: 'node-name',
          style: 'padding-left: ' + (k * 10) + 'px',
          text: node.name + ' ' + node.lines[0] + ',' + node.lines[1]
        }));
      }

      var begin = 0;
      var end = sources[scope.name].length;

      if (node.lines) {
        begin = node.lines[0];
        end = node.lines[1];
      }

      // Process children
      _.each(node._children, function(child, i) {
        var beginC = child.lines[0];
        var endC = child.lines[1];

        // Add code block between nodes
        if (begin < beginC) {
          var lines = sources[scope.name].slice(begin, beginC - 1);
          while (lines.length > 0 && lines[0] === '') {
            lines = lines.slice(1);
          }
          if (lines.length > 0) {
            var $pre = $('<pre>', {
              style: 'padding-left: 50px; display: none;'
            });
            $pre.append($('<code>', {
              class: 'language-' + scope.extlang,
              'data-nodes': 'show',
              'data-code': 'hide',
              text: lines.join('\n')
            }));
            $node.append($pre);
          }
        }

        // Add child node
        $node.append(processNode(child, k + 1));
        begin = endC;
      });

      // Add final code block
      if (begin < end) {
        var lines = sources[scope.name].slice(begin, end - 1);
        while (lines.length > 0 && lines[0] === '') {
          lines = lines.slice(1);
        }
        if (lines.length > 0) {
          var $pre = $('<pre>', {
            style: 'padding-left: 50px; display: none;'
          });
          $pre.append($('<code>', {
            class: 'language-' + scope.extlang,
            'data-nodes': 'show',
            'data-code': 'hide',
            text: lines.join('\n')
          }));
          $node.append($pre);
        }
      }

      return $node;
    }

    // Add root node
    $scope.append(processNode(tree.root, 0));
    $el.append($scope);
  });

  restoreHideShow($el.find('.node'))

  highlightCodeProcess('show', $el, true)

  // Delegate events
  this.delegateEvents($el);

  // Execute hooks
  executor.hook('afterElementUpdate', $el);
};

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
  class LiveCommentSocket extends SocketIOClient {
    onConnect() {
      console.log('io.connected');
      // Send initial query
      this.send({
        event: 'queryAll',
        queryHash: queryHash,
        location: {
          host: window.location.host,
          origin: window.location.origin,
          hostname: window.location.hostname,
          port: window.location.port,
          protocol: window.location.protocol,
          pathname: window.location.pathname
        }
      });
    }

    onMessage(msg) {
      if (msg.event == 'state') {
        mainView.updateState(mainView.$el, msg.objects, msg.files);
      } else if (msg.event == 'object.updated') {
        mainView.updateStateObject(msg.object, msg.file);
      }
    }
  }

  const socket = new LiveCommentSocket(window.location.hostname, ws_port);
  socket.connect();
  // WS CLIENT ]

  // MENU [
  // CLICK [

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

  // CLICK ]
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

