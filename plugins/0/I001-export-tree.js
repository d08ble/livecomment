// plugin: export MainView tree (I001) [
//:= this.frame('client.exec')

this.dbgbrk('I001 export MainView tree')

if (!window.__lcExportTree) {
  window.__lcExportTree = true

  // comment style from scope name / code language [
  function commentStyleForScope($scope, scopeName) {
    var ext = ''
    var dot = scopeName.lastIndexOf('.')
    if (dot > 0) ext = scopeName.slice(dot + 1).toLowerCase()

    var lang = ''
    var $code = $scope.find('pre code').first()
    if ($code.length) {
      var m = ($code.attr('class') || '').match(/language-(\S+)/)
      lang = m ? m[1].toLowerCase() : ''
    }

    if (ext === 'txt' || ext === 'log' || lang === 'text') {
      return {
        begin: function (name) { return name + ' [' },
        end: function (name) { return name + ' ]' }
      }
    }
    if (ext === 'css' || ext === 'less' || lang === 'css') {
      return {
        begin: function (name) { return '/* ' + name + ' [\n*/' },
        end: function (name) { return '/* ' + name + ' ]\n*/' }
      }
    }
    if (
      ext === 'py' || ext === 'sh' || ext === 'toml' || ext === 'pro' || ext === 'acpul' ||
      lang === 'python' || lang === 'shell' || lang === 'bash'
    ) {
      return {
        begin: function (name) { return '# ' + name + ' [' },
        end: function (name) { return '# ' + name + ' ]' }
      }
    }
    return {
      begin: function (name) { return '// ' + name + ' [' },
      end: function (name) { return '// ' + name + ' ]' }
    }
  }
  // comment style from scope name / code language ]

  // node block name from DOM [
  function nodeBlockName($node) {
    var $nm = $node.children('.node-name').first()
    if (!$nm.length) return null
    var $label = $nm.children('.lc-node-name-label').first()
    var raw = ($label.length ? $label.text() : $nm.text()).trim()
    return raw.replace(/\s+\d+,\d+$/, '') || null
  }
  // node block name from DOM ]

  // code text from pre [
  function codeFromPre($pre) {
    var $code = $pre.children('code').first()
    if (!$code.length) $code = $pre.find('code').first()
    return $code.length ? $code.text() : $pre.text()
  }
  // code text from pre ]

  // export one node recursively [
  function exportNode($node, style, lines) {
    var name = nodeBlockName($node)
    if (name) lines.push(style.begin(name))

    $node.children().each(function () {
      var $el = $(this)
      if ($el.hasClass('node-name')) return
      if ($el.is('pre')) {
        var text = codeFromPre($el)
        if (text) {
          if (lines.length && lines[lines.length - 1] !== '') lines.push('')
          lines.push(text)
        }
      } else if ($el.hasClass('node')) {
        exportNode($el, style, lines)
      }
    })

    if (name) lines.push(style.end(name))
  }
  // export one node recursively ]

  // export one scope [
  function exportScope($scope) {
    var scopeName = $scope.children('.scope-name').first().text().trim()
    var style = commentStyleForScope($scope, scopeName)
    var lines = []
    var $root = $scope.children('.node').first()
    if ($root.length) exportNode($root, style, lines)
    return {
      name: scopeName || 'scope',
      style: style,
      text: lines.join('\n')
    }
  }
  // export one scope ]

  // scan MainView [
  window.__lcExportTreeScan = function exportTreeScan() {
    var scopes = []
    $('#main-view .scope').each(function () {
      scopes.push(exportScope($(this)))
    })
    return scopes
  }
  // scan MainView ]

  // format scope as file section for combined export [
  function formatScopeExport(scope) {
    var style = scope.style
    var parts = [style.begin(scope.name), scope.text, style.end(scope.name)]
    return parts.filter(function (s) { return s }).join('\n\n')
  }
  // format scope as file section for combined export ]

  // download helper [
  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadText(filename, text) {
    downloadBlob(filename, new Blob([text], { type: 'text/plain;charset=utf-8' }))
  }

  var _crc32Table = (function () {
    var table = new Uint32Array(256)
    for (var i = 0; i < 256; i++) {
      var c = i
      for (var j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      table[i] = c >>> 0
    }
    return table
  })()

  function crc32Bytes(u8) {
    var crc = 0xFFFFFFFF
    for (var i = 0; i < u8.length; i++) crc = _crc32Table[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function u32le(n, out, off) {
    out[off] = n & 255
    out[off + 1] = (n >>> 8) & 255
    out[off + 2] = (n >>> 16) & 255
    out[off + 3] = (n >>> 24) & 255
  }

  function u16le(n, out, off) {
    out[off] = n & 255
    out[off + 1] = (n >>> 8) & 255
  }

  function pathSegments(fullPath) {
    return String(fullPath || '').replace(/\\/g, '/').split('/').filter(function (s) {
      return s && s !== '.'
    })
  }

  function zipRelativePaths(fullPaths) {
    var lists = fullPaths.map(pathSegments)
    if (lists.length === 1) {
      var one = lists[0]
      return [one.length ? one[one.length - 1] : 'file']
    }
    var minLen = lists[0].length
    for (var i = 1; i < lists.length; i++) minLen = Math.min(minLen, lists[i].length)
    var prefix = 0
    outer: for (var p = 0; p < minLen; p++) {
      var seg = lists[0][p]
      for (var j = 1; j < lists.length; j++) {
        if (lists[j][p] !== seg) break outer
      }
      prefix = p + 1
    }
    return lists.map(function (segs) {
      var rel = segs.slice(prefix)
      return rel.length ? rel.join('/') : (segs[segs.length - 1] || 'file')
    })
  }

  function scopeZipPaths(scopeList) {
    return zipRelativePaths(scopeList.map(function (s) { return s.name }))
  }

  function exportEntriesForScopes(scopeList) {
    var relPaths = scopeZipPaths(scopeList)
    return scopeList.map(function (s, i) {
      return { path: relPaths[i], text: formatScopeExport(s) }
    })
  }

  function zipEntryParts(fileName, text, localOffset) {
    var enc = new TextEncoder()
    var name = enc.encode(fileName)
    var data = enc.encode(text)
    var crc = crc32Bytes(data)
    var size = data.length

    var local = new Uint8Array(30 + name.length + size)
    u32le(0x04034b50, local, 0)
    u16le(20, local, 4)
    u16le(0, local, 6)
    u16le(0, local, 8)
    u16le(0, local, 10)
    u16le(0, local, 12)
    u32le(crc, local, 14)
    u32le(size, local, 18)
    u32le(size, local, 22)
    u16le(name.length, local, 26)
    u16le(0, local, 28)
    local.set(name, 30)
    local.set(data, 30 + name.length)

    var central = new Uint8Array(46 + name.length)
    u32le(0x02014b50, central, 0)
    u16le(20, central, 4)
    u16le(20, central, 6)
    u16le(0, central, 8)
    u16le(0, central, 10)
    u16le(0, central, 12)
    u16le(0, central, 14)
    u32le(crc, central, 16)
    u32le(size, central, 20)
    u32le(size, central, 24)
    u16le(name.length, central, 28)
    u16le(0, central, 30)
    u16le(0, central, 32)
    u16le(0, central, 34)
    u16le(0, central, 36)
    u32le(0, central, 38)
    u32le(localOffset || 0, central, 42)
    central.set(name, 46)

    return { local: local, central: central, size: local.length }
  }

  function buildZipStore(fileName, text) {
    var part = zipEntryParts(fileName, text)
    var end = new Uint8Array(22)
    u32le(0x06054b50, end, 0)
    u16le(0, end, 4)
    u16le(0, end, 6)
    u16le(1, end, 8)
    u16le(1, end, 10)
    u32le(part.central.length, end, 12)
    u32le(part.local.length, end, 16)
    u16le(0, end, 20)
    return new Blob([part.local, part.central, end], { type: 'application/zip' })
  }

  function buildZipStoreMulti(entries) {
    var locals = []
    var centrals = []
    var localSize = 0
    var localOffset = 0
    for (var i = 0; i < entries.length; i++) {
      var part = zipEntryParts(entries[i].path, entries[i].text, localOffset)
      locals.push(part.local)
      centrals.push(part.central)
      localOffset += part.size
      localSize += part.size
    }
    var centralSize = 0
    for (var j = 0; j < centrals.length; j++) centralSize += centrals[j].length
    var end = new Uint8Array(22)
    u32le(0x06054b50, end, 0)
    u16le(0, end, 4)
    u16le(0, end, 6)
    u16le(entries.length, end, 8)
    u16le(entries.length, end, 10)
    u32le(centralSize, end, 12)
    u32le(localSize, end, 16)
    u16le(0, end, 20)
    return new Blob(locals.concat(centrals, [end]), { type: 'application/zip' })
  }

  function downloadZip(zipName, fileName, text) {
    downloadBlob(zipName, buildZipStore(fileName, text))
  }

  function downloadZipMulti(zipName, entries) {
    downloadBlob(zipName, buildZipStoreMulti(entries))
  }
  // download helper ]

  // modal with textarea: copy + download [
  function showExportModal(scopes) {
    if (!scopes.length) {
      window.alert('No scopes in MainView to export.')
      return
    }

    var $m = $(
      '<div id="lc-export-modal">' +
        '<div class="lc-export-box">' +
          '<div class="lc-export-title">Export LiveComment tree</div>' +
          '<div class="lc-export-files-wrap">' +
            '<label class="lc-export-file lc-export-file-all">' +
              '<input type="checkbox" id="lc-export-all" checked>' +
              '<span class="lc-export-file-name">All files</span>' +
            '</label>' +
            '<div class="lc-export-files"></div>' +
          '</div>' +
          '<textarea class="lc-export-view" spellcheck="false"></textarea>' +
          '<label class="lc-export-zip"><input type="checkbox" id="lc-export-zip" checked> download.zip</label>' +
          '<div class="lc-export-btns">' +
            '<button type="button" id="lc-export-copy">Copy</button>' +
            '<button type="button" id="lc-export-download">Download</button>' +
            '<button type="button" id="lc-export-close">Close</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    )

    var $files = $m.find('.lc-export-files')
    var $view = $m.find('.lc-export-view')
    var $all = $m.find('#lc-export-all')
    var previewIndex = null

    if (scopes.length === 1) {
      $m.find('.lc-export-file-all').hide()
    }

    var zipPaths = scopeZipPaths(scopes)

    for (var i = 0; i < scopes.length; i++) {
      var s = scopes[i]
      var zipPath = zipPaths[i]
      var $row = $(
        '<label class="lc-export-file">' +
          '<input type="checkbox" class="lc-export-file-cb" checked>' +
          '<span class="lc-export-file-name"></span>' +
        '</label>'
      )
      $row.find('.lc-export-file-cb').data('index', i)
      $row.find('.lc-export-file-name').text(zipPath).attr('title', s.name)
      $files.append($row)
    }

    function refreshZipLabels() {
      var picked = selectedScopes()
      var paths = scopeZipPaths(picked.length ? picked : scopes)
      var list = picked.length ? picked : scopes
      var pathByName = {}
      for (var k = 0; k < list.length; k++) pathByName[list[k].name] = paths[k]
      $files.find('.lc-export-file-cb').each(function () {
        var idx = $(this).data('index')
        var scope = scopes[idx]
        var label = pathByName[scope.name] || zipPaths[idx]
        $(this).closest('.lc-export-file').find('.lc-export-file-name').text(label)
      })
    }

    function selectedScopes() {
      var out = []
      $files.find('.lc-export-file-cb:checked').each(function () {
        out.push(scopes[$(this).data('index')])
      })
      return out
    }

    function combinedText(list) {
      return list.map(formatScopeExport).join('\n\n')
    }

    function syncAllCheckbox() {
      var $cbs = $files.find('.lc-export-file-cb')
      var n = $cbs.length
      var checked = $cbs.filter(':checked').length
      $all.prop('checked', n > 0 && checked === n)
      $all.prop('indeterminate', checked > 0 && checked < n)
    }

    function updateView() {
      if (previewIndex !== null && scopes[previewIndex]) {
        $view.val(formatScopeExport(scopes[previewIndex]))
        return
      }
      var picked = selectedScopes()
      $view.val(picked.length ? combinedText(picked) : '')
    }

    syncAllCheckbox()
    updateView()
    $('body').append($m)

    $all.on('change', function () {
      var on = $all.is(':checked')
      $files.find('.lc-export-file-cb').prop('checked', on)
      $all.prop('indeterminate', false)
      previewIndex = null
      $files.find('.lc-export-file').removeClass('preview')
      refreshZipLabels()
      updateView()
    })

    $files.on('change', '.lc-export-file-cb', function () {
      syncAllCheckbox()
      previewIndex = null
      $files.find('.lc-export-file').removeClass('preview')
      refreshZipLabels()
      updateView()
    })

    $files.on('click', '.lc-export-file-name', function (e) {
      e.preventDefault()
      var idx = $(this).closest('.lc-export-file').find('.lc-export-file-cb').data('index')
      if (previewIndex === idx) {
        previewIndex = null
        $files.find('.lc-export-file').removeClass('preview')
      } else {
        previewIndex = idx
        $files.find('.lc-export-file').removeClass('preview')
        $(this).closest('.lc-export-file').addClass('preview')
      }
      updateView()
    })

    $('#lc-export-copy').on('click', function () {
      var text = $view.val()
      var selStart = $view[0].selectionStart
      var selEnd = $view[0].selectionEnd
      if (selEnd > selStart) text = text.slice(selStart, selEnd)
      function done() {
        $('#lc-export-copy').text('Copied')
        setTimeout(function () { $('#lc-export-copy').text('Copy') }, 1500)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          $view[0].select()
          document.execCommand('copy')
          done()
        })
      } else {
        $view[0].select()
        document.execCommand('copy')
        done()
      }
    })

    $('#lc-export-download').on('click', function () {
      var picked = selectedScopes()
      if (!picked.length) {
        window.alert('Select at least one file to export.')
        return
      }
      var text = $view.val()
      if ($('#lc-export-zip').is(':checked')) {
        var fresh = window.__lcExportTreeScan()
        var freshByName = {}
        for (var fi = 0; fi < fresh.length; fi++) freshByName[fresh[fi].name] = fresh[fi]
        var exportScopes = picked.map(function (s) { return freshByName[s.name] || s })
        var entries = exportEntriesForScopes(exportScopes)
        if (entries.length > 1) {
          downloadZipMulti('livecomment-export.zip', entries)
        } else {
          downloadZip('livecomment-export.zip', entries[0].path, entries[0].text)
        }
      } else {
        var dlName = picked.length === 1
          ? scopeZipPaths(picked)[0]
          : 'livecomment-export.txt'
        downloadText(dlName, text)
      }
    })

    $('#lc-export-close').on('click', function () {
      $m.remove()
    })
    setTimeout(function () { $view.focus() }, 0)
  }
  // modal with textarea: copy + download ]

  // menu button [
  if (!$('#btnExportTree').length) {
    $('#menu').append("<button id='btnExportTree' title='Export MainView tree'>⬇ Export</button>")
    $('#btnExportTree').on('click', function () {
      showExportModal(window.__lcExportTreeScan())
    })
  }
  // menu button ]
}

// plugin: export MainView tree (I001) ]
// export-tree.css [
//:= this.frame('client.css')
#btnExportTree {
  background-color: #00897b;
  color: #fff;
  border: none;
  padding: 5px 10px;
  margin-left: 5px;
  cursor: pointer;
}
#btnExportTree:hover {
  background-color: #00695c;
}
#lc-export-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lc-export-box {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  width: min(920px, 92vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
.lc-export-title {
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 15px;
}
.lc-export-files-wrap {
  margin-bottom: 8px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
}
.lc-export-files {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 140px;
  overflow: auto;
}
.lc-export-file {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  padding: 2px 4px;
  border-radius: 3px;
}
.lc-export-file-all {
  font-weight: 600;
  border-bottom: 1px solid #ddd;
  margin-bottom: 4px;
  padding-bottom: 6px;
}
.lc-export-file.preview {
  background: #e8f5e9;
}
.lc-export-file input {
  cursor: pointer;
  flex-shrink: 0;
}
.lc-export-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}
.lc-export-file-name:hover {
  text-decoration: underline;
}
.lc-export-view {
  flex: 1;
  min-height: 240px;
  max-height: 55vh;
  width: 100%;
  box-sizing: border-box;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  background: #fafafa;
}
.lc-export-zip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.lc-export-zip input {
  cursor: pointer;
}
.lc-export-btns {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
#lc-export-copy,
#lc-export-download {
  background: #00897b;
  color: #fff;
  border: none;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}
#lc-export-download {
  background: #1976d2;
}
#lc-export-close {
  background: #757575;
  color: #fff;
  border: none;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
}
// export-tree.css ]
