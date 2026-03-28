// drag-drop content [
//:= this.frame('client.exec')

this.dbgbrk('C000 drag-drop content')

if (!window.__lcDragDrop) {
  window.__lcDragDrop = true

  var LC_DD_MIME = 'application/x-livecomment-scope-node'

  document.addEventListener(
    'dragstart',
    function (e) {
      var dt = e.dataTransfer
      if (!dt) return
      var el = e.target
      if (el && el.nodeType === 3) el = el.parentElement
      if (!el || !el.closest) return
      var $t = $(el)
      var $nm = $t.closest('.node-name')
      if ($nm.length) {
        var $scope = $nm.closest('.scope')
        if (!$scope.length) return
        var scopePath = $scope.children('.scope-name').first().text().trim()
        var raw = $nm.text().trim().replace(/\s+\d+,\d+$/, '')
        dt.setData(LC_DD_MIME, JSON.stringify({ scope: scopePath, node: raw }))
        dt.setData('text/plain', scopePath ? scopePath + '\n' + raw : raw)
        dt.effectAllowed = 'copy'
        return
      }
      var $sn = $t.closest('.scope-name')
      if ($sn.length) {
        var path = $sn.text().trim()
        if (!path) return
        dt.setData(LC_DD_MIME, JSON.stringify({ scope: path, node: '' }))
        dt.setData('text/plain', path)
        dt.effectAllowed = 'copy'
      }
    },
    true
  )

  function lcDdMarkDraggable() {
    $('#main-view .node-name, #main-view .scope-name').attr('draggable', 'true')
  }
  lcDdMarkDraggable()
  if (typeof executor !== 'undefined' && executor.on) {
    executor.on('afterElementUpdate', lcDdMarkDraggable)
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Clipboard: basenames only for local paths (miner.py), never /home/... or file:///...
  function clipBasename(s) {
    s = String(s || '').trim()
    if (!s) return ''
    if (/^https?:\/\//i.test(s)) return s
    if (/^file:\/\//i.test(s)) {
      var p = s.replace(/^file:\/\//i, '')
      try {
        p = decodeURIComponent(p.split('#')[0].split('?')[0])
      } catch (err) {
        p = p.split('#')[0].split('?')[0]
      }
      p = p.replace(/^\/+([A-Za-z]:)/i, '$1')
      var segs = p.split(/[/\\]+/).filter(Boolean)
      return segs.length ? segs[segs.length - 1] : s
    }
    if (s.charAt(0) === '/' && s.length > 1) {
      var a = s.split('/').filter(Boolean)
      return a.length ? a[a.length - 1] : s
    }
    if (/^[A-Za-z]:[\\/]/.test(s)) {
      var w = s.split(/[/\\]+/).filter(Boolean)
      return w.length ? w[w.length - 1] : s
    }
    if (s.indexOf('/') >= 0 || s.indexOf('\\') >= 0) {
      var norm = s.replace(/\\/g, '/')
      var parts = norm.split('/').filter(Boolean)
      return parts.length ? parts[parts.length - 1] : s
    }
    return s
  }

  function buildClipboardCopyString(dt) {
    if (!dt) return ''
    var internal = dt.getData(LC_DD_MIME)
    if (internal) {
      try {
        var o = JSON.parse(internal)
        if (o && typeof o === 'object') {
          var sc = (o.scope || '').trim()
          var nd = (o.node || '').trim()
          if (sc && nd) return sc + '\n' + nd
          if (sc) return sc
          if (nd) return nd
        }
      } catch (err) {}
    }
    var lines = []
    var files = dt.files
    if (files && files.length) {
      for (var i = 0; i < files.length; i++) {
        var f = files[i]
        var rel = f.webkitRelativePath || f.name
        lines.push(clipBasename(rel))
      }
      return lines.join('\n')
    }
    var uri = dt.getData('text/uri-list')
    if (uri) {
      uri.split(/\r?\n/).forEach(function (line) {
        line = line.trim()
        if (line && line.charAt(0) !== '#') lines.push(clipBasename(line))
      })
      if (lines.length) return lines.join('\n')
    }
    var plain = dt.getData('text/plain')
    if (plain) {
      var block = plain.replace(/\r\n/g, '\n').trim()
      if (!block) return ''
      return block
        .split('\n')
        .map(function (ln) {
          return clipBasename(ln.trim())
        })
        .filter(Boolean)
        .join('\n')
    }
    return ''
  }

  function writeClipboard(text) {
    if (!text) return
    function fallback() {
      var ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch (err) {}
      document.body.removeChild(ta)
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(fallback)
    } else {
      fallback()
    }
  }

  function showLcDdToast(msg) {
    $('#lc-dd-toast').remove()
    var $t = $('<div id="lc-dd-toast"></div>').text(msg)
    $('body').append($t)
    setTimeout(function () {
      $t.addClass('lc-dd-toast-out')
    }, 2000)
    setTimeout(function () {
      $t.remove()
    }, 2600)
  }

  function showDropModal(title, htmlBody) {
    $('#lc-dd-modal').remove()
    var $m = $(
      '<div id="lc-dd-modal">' +
        '<div class="lc-dd-box">' +
          '<div class="lc-dd-head"><span class="lc-dd-title"></span><button type="button" class="lc-dd-close" aria-label="Close">✕</button></div>' +
          '<div class="lc-dd-body"></div>' +
        '</div>' +
      '</div>'
    )
    $m.find('.lc-dd-title').text(title)
    $m.find('.lc-dd-body').html(htmlBody)
    $('body').append($m)
    $m.on('click', function (ev) {
      if (ev.target.id === 'lc-dd-modal') $m.remove()
    })
    $m.find('.lc-dd-close').on('click', function () {
      $m.remove()
    })
  }

  function textishName(name) {
    return /\.(txt|md|json|js|ts|jsx|tsx|mjs|cjs|css|html|htm|xml|svg|pug|vue|svelte|py|rb|go|rs|java|kt|swift|c|h|cpp|hpp|cc|hh|m|mm|sh|bash|zsh|yaml|yml|toml|ini|cfg|log|gitignore|dockerfile|makefile)$/i.test(
      name
    )
  }

  function readOneFile(file, done) {
    var label = file.name + ' (' + (file.type || 'unknown') + ', ' + file.size + ' bytes)'
    if (!textishName(file.name) && file.type && file.type.indexOf('text/') !== 0) {
      done(null, '<h4>' + escapeHtml(label) + '</h4><pre class="lc-dd-note">[Skipped as likely binary — extend textishName if needed.]</pre>')
      return
    }
    var r = new FileReader()
    r.onload = function () {
      var text = r.result
      if (typeof text !== 'string') text = String(text)
      done(
        null,
        '<h4>' + escapeHtml(label) + '</h4><pre class="lc-dd-pre">' + escapeHtml(text) + '</pre>'
      )
    }
    r.onerror = function () {
      done(null, '<h4>' + escapeHtml(label) + '</h4><pre class="lc-dd-note">[Read error]</pre>')
    }
    r.readAsText(file)
  }

  function readFilesSequential(files, i, parts, cb) {
    if (i >= files.length) {
      cb(parts.join('<hr class="lc-dd-hr"/>') || '<p class="lc-dd-note">No file payload.</p>')
      return
    }
    readOneFile(files[i], function (err, html) {
      parts.push(html)
      readFilesSequential(files, i + 1, parts, cb)
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    $('#lc-dd-zone').removeClass('lc-dd-hover')

    var dt = e.dataTransfer
    var clipboardText = buildClipboardCopyString(dt)
    var fromLcTree = !!(dt && dt.getData(LC_DD_MIME))
    if (clipboardText) {
      writeClipboard(clipboardText)
      var toastMsg
      if (fromLcTree) {
        toastMsg = clipboardText.indexOf('\n') >= 0 ? 'Copied scope + node' : 'Copied scope path'
      } else {
        toastMsg =
          clipboardText.indexOf('\n') >= 0
            ? 'Copied ' + clipboardText.split('\n').filter(Boolean).length + ' names'
            : 'Copied name'
      }
      showLcDdToast(toastMsg)
    }

    var files = dt && dt.files
    var sections = []
    if (clipboardText) {
      var clipNote = fromLcTree
        ? 'From LiveComment tree: file path (.scope-name) and node title (.node-name, line numbers stripped).'
        : 'External drop: basenames only (e.g. miner.py), not full /home/… paths. https? URLs stay full.'
      sections.push(
        '<section><h3>Clipboard</h3><pre class="lc-dd-pre lc-dd-clipboard">' +
          escapeHtml(clipboardText) +
          '</pre><p class="lc-dd-note">' +
          clipNote +
          '</p></section>'
      )
    }

    if (files && files.length) {
      readFilesSequential(files, 0, [], function (filesHtml) {
        sections.push('<section><h3>Files</h3>' + filesHtml + '</section>')
        finishModal()
      })
    } else {
      finishModal()
    }

    function finishModal() {
      var plain = dt.getData('text/plain') || ''
      var plainNorm = plain.replace(/\r\n/g, '\n').trim()
      var plainClipped = plainNorm
        ? plainNorm
            .split('\n')
            .map(function (ln) {
              return clipBasename(ln.trim())
            })
            .filter(Boolean)
            .join('\n')
        : ''
      var uri = dt.getData('text/uri-list') || ''
      var html = dt.getData('text/html') || ''
      if (plain && plainNorm !== clipboardText && plainClipped !== clipboardText) {
        sections.push(
          '<section><h3>text/plain</h3><pre class="lc-dd-pre">' + escapeHtml(plain) + '</pre></section>'
        )
      }
      if (uri && uri !== plain) {
        sections.push(
          '<section><h3>text/uri-list</h3><pre class="lc-dd-pre">' + escapeHtml(uri) + '</pre></section>'
        )
      }
      if (html) {
        sections.push(
          '<section><h3>text/html (escaped)</h3><pre class="lc-dd-pre">' + escapeHtml(html) + '</pre></section>'
        )
      }
      if (!sections.length) {
        sections.push('<p class="lc-dd-note">Drop had no readable text or files.</p>')
      }
      showDropModal('Dropped content', sections.join(''))
    }
  }
/*
  $('body').append(
    '<div id="lc-dd-wrap">' +
      '<div id="lc-dd-zone" title="Drop files or selected text here">' +
      '<span class="lc-dd-icon">⬇</span> <span class="lc-dd-label">Drop content</span>' +
      '</div></div>'
  )
*/
  var $zone = $('#lc-dd-zone')
  $zone.on('dragenter dragover', function (e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    $zone.addClass('lc-dd-hover')
  })
  $zone.on('dragleave', function (e) {
    if (!$(e.currentTarget).has(e.relatedTarget).length) $zone.removeClass('lc-dd-hover')
  })
  $zone.on('drop', handleDrop)
}

// drag-drop content ]
// drag-drop.css [
//:= this.frame('client.css')
#lc-dd-wrap{position:fixed;right:12px;bottom:48px;z-index:9998;font-family:system-ui,sans-serif}
#lc-dd-zone{
  min-width:140px;padding:10px 14px;border-radius:8px;
  background:rgba(33,150,243,.92);color:#fff;font-size:13px;cursor:copy;
  box-shadow:0 2px 10px rgba(0,0,0,.25);text-align:center;
  border:2px dashed transparent;transition:border-color .15s,background .15s
}
#lc-dd-zone.lc-dd-hover{border-color:#fff;background:rgba(25,118,210,.98)}
#lc-dd-zone .lc-dd-icon{font-size:16px;vertical-align:middle}
#lc-dd-modal{
  position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:10001;
  display:flex;align-items:center;justify-content:center;padding:16px
}
#lc-dd-modal .lc-dd-box{
  background:#1e1e1e;color:#e0e0e0;max-width:min(920px,96vw);max-height:85vh;
  width:100%;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 8px 32px rgba(0,0,0,.4)
}
#lc-dd-modal .lc-dd-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px;background:#252526;border-bottom:1px solid #333
}
#lc-dd-modal .lc-dd-title{font-weight:600;font-size:15px}
#lc-dd-modal .lc-dd-close{
  background:#c62828;color:#fff;border:none;width:32px;height:32px;
  border-radius:4px;cursor:pointer;font-size:16px;line-height:1
}
#lc-dd-modal .lc-dd-body{padding:12px 14px;overflow:auto;flex:1}
#lc-dd-modal .lc-dd-body h3{margin:12px 0 6px;font-size:13px;color:#90caf9}
#lc-dd-modal .lc-dd-body h3:first-child{margin-top:0}
#lc-dd-modal .lc-dd-body h4{margin:0 0 8px;font-size:12px;color:#b0bec5}
#lc-dd-modal .lc-dd-pre{
  margin:0;white-space:pre-wrap;word-break:break-word;
  background:#121212;padding:10px;border-radius:4px;font-size:12px;line-height:1.45;
  border:1px solid #333;max-height:40vh;overflow:auto
}
#lc-dd-modal .lc-dd-note{color:#888;font-size:13px}
#lc-dd-modal .lc-dd-hr{border:none;border-top:1px solid #444;margin:16px 0}
#lc-dd-modal .lc-dd-clipboard{max-height:20vh;border-color:#2e7d32}
#lc-dd-toast{
  position:fixed;right:12px;bottom:120px;z-index:10002;max-width:min(360px,90vw);
  padding:10px 14px;border-radius:8px;background:#2e7d32;color:#fff;font-size:13px;
  box-shadow:0 4px 16px rgba(0,0,0,.35);opacity:1;transition:opacity .35s ease
}
#lc-dd-toast.lc-dd-toast-out{opacity:0}
// drag-drop.css ]
