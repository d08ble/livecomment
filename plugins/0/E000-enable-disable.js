// enable-disable [
//:= this.frame('client.exec')
console.log('E000 enable-disable');
if (!window.__ed) {
  window.__ed = JSON.parse(localStorage.getItem('ed') || '{}');
  window.__edUndo = [];
  window.__edRedo = [];

  // build path [
  window.__edPath = function($node) {
    var p = [];
    var $c = $node;
    while ($c.length) {
      if ($c.hasClass('scope')) {
        p.unshift('scope:' + $c.children('.scope-name').first().text().trim());
        break;
      }
      if ($c.hasClass('node')) {
        var $nm = $c.children('.node-name').first();
        if ($nm.length) p.unshift('node:' + $nm.text().trim().replace(/\s+\d+,\d+$/, ''));
      }
      $c = $c.parent().closest('.node, .scope');
    }
    return p.join('/');
  };
  // build path ]

  // save [
  window.__edSave = function() { localStorage.setItem('ed', JSON.stringify(window.__ed)); };
  // save ]

  // restore [
  window.__edRestore = function() {
    $('.ed-off').removeClass('ed-off');
    var ed = window.__ed;
    $('.node').each(function() {
      var $n = $(this);
      var $nm = $n.children('.node-name').first();
      if (!$nm.length) return; // skip k=0 root
      var path = window.__edPath($n);
      if (path && ed[path]) $n.addClass('ed-off');
    });
  };
  // restore ]

  // undo/redo button state [
  window.__edBtnState = function() {
    $('#edUndo').prop('disabled', !window.__edUndo.length);
    $('#edRedo').prop('disabled', !window.__edRedo.length);
  };
  // undo/redo button state ]

  // menu buttons [
  if (!$('#edToggle').length) {
    $('#menu').prepend(
      "<span class='ed-sep'>|</span>" +
      "<button id='edToggle' title='Enable/Disable Mode'>☑</button>" +
      "<button id='edUndo' title='Undo' disabled>↶</button>" +
      "<button id='edRedo' title='Redo' disabled>↷</button>" +
      "<button id='edExport' title='Export enabled'>↗</button>" +
      "<span class='ed-sep'>|</span>" 
    );
    $('#edToggle').click(function() { $(this).toggleClass('active'); $('body').toggleClass('ed-mode'); });
    $('#edUndo').click(function() {
      if (!window.__edUndo.length) return;
      window.__edRedo.push(JSON.stringify(window.__ed));
      window.__ed = JSON.parse(window.__edUndo.pop());
      window.__edSave(); window.__edRestore(); window.__edBtnState();
    });
    $('#edRedo').click(function() {
      if (!window.__edRedo.length) return;
      window.__edUndo.push(JSON.stringify(window.__ed));
      window.__ed = JSON.parse(window.__edRedo.pop());
      window.__edSave(); window.__edRestore(); window.__edBtnState();
    });
    $('#edExport').click(function() {
      // collect enabled items [
      var enabledLines = [];
      function walkEnabled($parent, depth) {
        $parent.children('.node').each(function() {
          var $n = $(this);
          if ($n.hasClass('ed-off')) return;
          var $nm = $n.children('.node-name').first();
          if ($nm.length) {
            var name = $nm.text().trim().replace(/\s+\d+,\d+$/, '');
            if (name) {
              var indent = '';
              for (var i = 0; i < depth; i++) indent += ' ';
              enabledLines.push(indent + name);
            }
          }
          walkEnabled($n, $nm.length ? depth + 1 : depth);
        });
      }
      $('.scope').each(function() {
        var $s = $(this);
        var sname = $s.children('.scope-name').first().text().trim();
        var before = enabledLines.length;
        walkEnabled($s, sname ? 1 : 0);
        if (enabledLines.length > before && sname) enabledLines.splice(before, 0, sname);
      });
      // collect enabled items ]
      // collect disabled items [
      var disabledLines = [];
      function walkAllChildren($parent, depth) {
        $parent.children('.node').each(function() {
          var $n = $(this);
          var $nm = $n.children('.node-name').first();
          if ($nm.length) {
            var name = $nm.text().trim().replace(/\s+\d+,\d+$/, '');
            if (name) {
              var indent = '';
              for (var i = 0; i < depth; i++) indent += ' ';
              disabledLines.push(indent + name);
            }
          }
          walkAllChildren($n, $nm.length ? depth + 1 : depth);
        });
      }
      function walkDisabled($parent, depth) {
        $parent.children('.node').each(function() {
          var $n = $(this);
          var $nm = $n.children('.node-name').first();
          if ($n.hasClass('ed-off')) {
            if ($nm.length) {
              var name = $nm.text().trim().replace(/\s+\d+,\d+$/, '');
              if (name) {
                var indent = '';
                for (var i = 0; i < depth; i++) indent += ' ';
                disabledLines.push(indent + name);
              }
            }
            walkAllChildren($n, $nm.length ? depth + 1 : depth);
            return;
          }
          walkDisabled($n, $nm.length ? depth + 1 : depth);
        });
      }
      $('.scope').each(function() {
        var $s = $(this);
        var sname = $s.children('.scope-name').first().text().trim();
        var before = disabledLines.length;
        walkDisabled($s, sname ? 1 : 0);
        if (disabledLines.length > before && sname) disabledLines.splice(before, 0, sname);
      });
      // collect disabled items ]
      var enabledTxt = enabledLines.join('\n');
      var disabledTxt = disabledLines.join('\n');
      var $m = $('<div id="ed-modal"><div class="ed-box">' +
        '<div class="ed-tabs"><button class="ed-tab active" data-tab="enabled">Enabled (' + enabledLines.length + ')</button><button class="ed-tab" data-tab="disabled">Disabled (' + disabledLines.length + ')</button></div>' +
        '<pre class="ed-tab-content" data-tab="enabled"></pre>' +
        '<pre class="ed-tab-content" data-tab="disabled" style="display:none"></pre>' +
        '<div class="ed-btns"><button id="ed-copy">📋 Copy</button><button id="ed-close">✕</button></div>' +
        '</div></div>');
      $m.find('pre[data-tab="enabled"]').text(enabledTxt);
      $m.find('pre[data-tab="disabled"]').text(disabledTxt);
      $('body').append($m);
      var currentTab = 'enabled';
      $m.on('click', '.ed-tab', function() {
        var tab = $(this).data('tab');
        currentTab = tab;
        $m.find('.ed-tab').removeClass('active');
        $(this).addClass('active');
        $m.find('.ed-tab-content').hide();
        $m.find('.ed-tab-content[data-tab="' + tab + '"]').show();
      });
      $('#ed-copy').click(function() {
        var $pre = $m.find('.ed-tab-content[data-tab="' + currentTab + '"]');
        var fullTxt = currentTab === 'enabled' ? enabledTxt : disabledTxt;
        var sel = window.getSelection();
        var range = sel.rangeCount && sel.getRangeAt(0);
        var selected = range && !range.collapsed && $pre[0].contains(range.startContainer);
        var text = selected ? sel.toString() : fullTxt;
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        $(this).text('✓ Copied');
        setTimeout(function() { $('#ed-copy').text('📋 Copy'); }, 1500);
      });
      $('#ed-close,#ed-modal').click(function(ev) { if (ev.target.id==='ed-close'||ev.target.id==='ed-modal') $m.remove(); });
    });
  }
  // menu buttons ]

  // click [
  document.addEventListener('click', function(e) {
    if (!$('body').hasClass('ed-mode')) return;
    var $t = $(e.target);

    // click scope-name: toggle all child nodes [
    var $sn = $t.hasClass('scope-name') ? $t : $t.closest('.scope-name');
    if ($sn.length) {
      e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
      var $scope = $sn.closest('.scope');
      if (!$scope.length) return;
      // collect child nodes that have a node-name [
      var $nodes = $scope.find('.node').filter(function() {
        return $(this).children('.node-name').length > 0;
      });
      if (!$nodes.length) return;
      // collect child nodes that have a node-name ]
      // determine direction: if any enabled -> disable all, else enable all [
      var anyEnabled = false;
      $nodes.each(function() {
        var p = window.__edPath($(this));
        if (p && !window.__ed[p]) { anyEnabled = true; return false; }
      });
      // determine direction: if any enabled -> disable all, else enable all ]
      window.__edUndo.push(JSON.stringify(window.__ed));
      window.__edRedo = [];
      $nodes.each(function() {
        var $node = $(this);
        var path = window.__edPath($node);
        if (!path) return;
        if (anyEnabled) { window.__ed[path] = 1; $node.addClass('ed-off'); }
        else { delete window.__ed[path]; $node.removeClass('ed-off'); }
      });
      window.__edSave(); window.__edBtnState();
      return;
    }
    // click scope-name: toggle all child nodes ]

    var $nm = $t.hasClass('node-name') ? $t : $t.closest('.node-name');
    if (!$nm.length) return;
    e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
    var $node = $nm.closest('.node');
    if (!$node.length) return;
    var path = window.__edPath($node);
    if (!path) return;
    window.__edUndo.push(JSON.stringify(window.__ed));
    window.__edRedo = [];
    if (window.__ed[path]) { delete window.__ed[path]; $node.removeClass('ed-off'); }
    else { window.__ed[path] = 1; $node.addClass('ed-off'); }
    window.__edSave(); window.__edBtnState();
  }, true);
  // click ]

  // register restore [
  executor.on('afterElementUpdate', function() { window.__edRestore(); });
  // register restore ]
}

// enable-disable ]
// enable-disable.css [
//:= this.frame('client.css')
#edToggle,#edUndo,#edRedo,#edExport{color:#fff;border:none;padding:4px 8px;margin:0 1px;cursor:pointer;font-size:14px}
#edToggle{background:#607d8b}
#edToggle.active{background:#ff9800;box-shadow:0 0 6px rgba(255,152,0,.5)}
#edUndo,#edRedo{background:#2196f3}
#edExport{background:#4caf50}
#edUndo:disabled,#edRedo:disabled{background:#999;cursor:not-allowed;opacity:.5}
.ed-sep{color:#666;margin:0 4px;font-size:14px}
body.ed-mode .node-name,body.ed-mode .scope-name{cursor:pointer !important}
body.ed-mode .node-name:hover,body.ed-mode .scope-name:hover{background:rgba(255,152,0,.15);outline:1px solid #ff9800}
.ed-off{opacity:.35}
.ed-off>.node-name{text-decoration:line-through;color:#999 !important}
#ed-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:10000;display:flex;align-items:center;justify-content:center}
.ed-box{background:#fff;padding:16px;border-radius:6px;max-width:600px;width:90%}
.ed-tabs{display:flex;gap:0;margin-bottom:0}
.ed-tab{background:#e0e0e0;color:#333;border:none;padding:6px 16px;cursor:pointer;font-size:13px;border-radius:4px 4px 0 0;margin-right:2px}
.ed-tab.active{background:#f5f5f5;font-weight:bold;color:#000}
.ed-tab[data-tab="disabled"].active{background:#fff3e0;color:#e65100}
.ed-box pre{background:#f5f5f5;padding:10px;font-size:12px;overflow:auto;max-height:300px;margin-bottom:10px;margin-top:0;border-radius:0 4px 4px 4px}
pre.ed-tab-content[data-tab="disabled"]{background:#fff3e0}
.ed-btns{display:flex;gap:8px}
#ed-copy{background:#4caf50;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;flex:1}
#ed-close{background:#f44336;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer}
// enable-disable.css ]
