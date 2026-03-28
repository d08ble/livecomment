// plugin: VSCode/monaco editor [
//:= this.frame('client.exec')

this.dbgbrk('D000 VSCode/monaco editor')

;(function () {
  if (window.__lcMonacoPlugin) return
  window.__lcMonacoPlugin = true

  var MONACO_VERSION = '0.52.2'
  var MONACO_BASE =
    'https://cdn.jsdelivr.net/npm/monaco-editor@' + MONACO_VERSION + '/min/vs'

  var monacoLoadCallbacks = []
  var monacoLoading = false

  function mapLanguage(className) {
    var m = String(className || '').match(/language-([\w-]+)/)
    var lang = m ? m[1] : 'plaintext'
    var map = {
      js: 'javascript',
      javascript: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      typescript: 'typescript',
      tsx: 'typescript',
      json: 'json',
      py: 'python',
      python: 'python',
      rb: 'ruby',
      ruby: 'ruby',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      markdown: 'markdown',
      objc: 'objective-c',
      objectivec: 'objective-c',
      objectiveivec: 'objective-c',
      mm: 'objective-c',
      h: 'cpp',
      hpp: 'cpp',
      cpp: 'cpp',
      cxx: 'cpp',
      cc: 'cpp',
      c: 'c',
      cs: 'csharp',
      rs: 'rust',
      go: 'go',
      java: 'java',
      kt: 'kotlin',
      swift: 'swift',
      php: 'php',
      sql: 'sql',
      xml: 'xml',
      html: 'html',
      css: 'css',
      less: 'less',
      scss: 'scss',
      vue: 'html',
      acpul: 'c',
      pro: 'c'
    }
    return map[lang] || lang
  }

  function lineCount(text) {
    if (!text) return 1
    var n = text.split(/\r\n|\r|\n/).length
    return Math.max(1, n)
  }

  function editorHeightPx(text) {
    var lines = lineCount(text)
    var lineH = 19
    var pad = 0//24
    var h = lines * lineH + pad
    return Math.min(1120, Math.max(20, h))
  }

  function ensureMonacoEnvironment() {
    if (window.MonacoEnvironment && window.MonacoEnvironment.getWorkerUrl) return
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId, label) {
        var workers = {
          json: MONACO_BASE + '/language/json/json.worker.js',
          css: MONACO_BASE + '/language/css/css.worker.js',
          scss: MONACO_BASE + '/language/css/css.worker.js',
          less: MONACO_BASE + '/language/css/css.worker.js',
          html: MONACO_BASE + '/language/html/html.worker.js',
          handlebars: MONACO_BASE + '/language/html/html.worker.js',
          razor: MONACO_BASE + '/language/html/html.worker.js',
          typescript: MONACO_BASE + '/language/typescript/ts.worker.js',
          javascript: MONACO_BASE + '/language/typescript/ts.worker.js'
        }
        var path = workers[label] || MONACO_BASE + '/editor/editor.worker.js'
        var blob = "importScripts('" + path + "');"
        return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(blob)
      }
    }
  }

  function loadMonaco(done) {
    if (window.monaco && window.monaco.editor) {
      done()
      return
    }
    monacoLoadCallbacks.push(done)
    if (monacoLoading) return
    monacoLoading = true
    ensureMonacoEnvironment()

    var s = document.createElement('script')
    s.src = MONACO_BASE + '/loader.js'
    s.setAttribute('data-lc-monaco-loader', '1')
    s.onload = function () {
      var req = window.require
      if (!req || !req.config) {
        console.error('VSCode/monaco loader: require not available')
        monacoLoading = false
        return
      }
      req.config({ paths: { vs: MONACO_BASE } })
      req(['vs/editor/editor.main'], function () {
        monacoLoading = false
        ensureLcMonacoThemes()
        applyLcMonacoTheme(getLcMonacoGlobalTheme())
        var cbs = monacoLoadCallbacks.slice()
        monacoLoadCallbacks.length = 0
        for (var i = 0; i < cbs.length; i++) cbs[i]()
      })
    }
    s.onerror = function () {
      monacoLoading = false
      monacoLoadCallbacks.length = 0
      console.error('VSCode/monaco loader: failed to load', s.src)
    }
    document.head.appendChild(s)
  }

  function readSource($code) {
    var el = $code[0] || $code
    if (el && el.textContent != null) return el.textContent
    return $($code).text()
  }

  function inferFileLineStart($code) {
    var $c = $($code)
    var raw = $c.attr('data-lc-line-start')
    if (raw != null && /^\d+$/.test(String(raw).trim())) {
      return parseInt(String(raw).trim(), 10)
    }
    var $pre = $c.parent('pre')
    var $nm = $pre.prev('.node-name')
    if ($nm.length) {
      var m = String($nm.text() || '').match(/(\d+)\s*,\s*(\d+)\s*$/)
      if (m) return parseInt(m[1], 10)
    }
    return 1
  }

  function lineNumbersMonacoOption(useFileLines, fileStart) {
    if (!useFileLines || fileStart < 1) return 'on'
    return function (lineNumber) {
      return String(fileStart + lineNumber - 1)
    }
  }

  function scrollScrollableChain(fromEl, deltaY) {
    var el = fromEl
    while (el) {
      el = el.parentElement
      if (!el) break
      var st = window.getComputedStyle(el)
      var oy = st.overflowY
      if (
        (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        el.scrollTop += deltaY
        return
      }
    }
    var root = document.scrollingElement || document.documentElement
    if (root) root.scrollTop += deltaY
  }

  var LC_THEME_SPECS = [
    { id: 'vs-dark', label: 'Dark (vs-dark)' },
    { id: 'vs', label: 'Light (vs)' },
    { id: 'hc-black', label: 'High contrast' },
    { id: 'lc-ocean', label: 'Ocean' },
    { id: 'lc-amber', label: 'Amber' },
    { id: 'lc-forest', label: 'Forest' },
    { id: 'lc-midnight', label: 'Violet' },
    { id: 'lc-dawn', label: 'Dawn' },
    { id: 'lc-slate', label: 'Slate' },
    { id: 'lc-rose', label: 'Rose' },
    { id: 'lc-crimson', label: 'Crimson' },
    { id: 'lc-teal', label: 'Teal' },
    { id: 'lc-ink', label: 'Ink' },
    { id: 'lc-sand', label: 'Sand' },
    { id: 'lc-lavender', label: 'Lavender' },
    { id: 'lc-coffee', label: 'Coffee' },
    { id: 'lc-nord', label: 'Nord' }
  ]

  var LC_THEME_STORAGE_KEY = 'lcMonacoEditorTheme'
  var LC_FILE_LINES_STORAGE_KEY = 'lcMonacoFileLineNumbers'
  var LC_FIT_HEIGHT_STORAGE_KEY = 'lcMonacoFitHeightToLines'

  var LC_THEME_BY_ID = {}
  for (var li = 0; li < LC_THEME_SPECS.length; li++) {
    LC_THEME_BY_ID[LC_THEME_SPECS[li].id] = LC_THEME_SPECS[li]
  }

  function getLcMonacoGlobalTheme() {
    if (window.__lcMonacoThemeId && LC_THEME_BY_ID[window.__lcMonacoThemeId])
      return window.__lcMonacoThemeId
    try {
      var s = localStorage.getItem(LC_THEME_STORAGE_KEY)
      if (s && LC_THEME_BY_ID[s]) {
        window.__lcMonacoThemeId = s
        return s
      }
    } catch (e) {}
    return 'vs-dark'
  }

  function applyLcMonacoTheme(themeId) {
    if (!LC_THEME_BY_ID[themeId]) themeId = 'vs-dark'
    window.__lcMonacoThemeId = themeId
    try {
      localStorage.setItem(LC_THEME_STORAGE_KEY, themeId)
    } catch (e) {}
    if (window.monaco && monaco.editor) monaco.editor.setTheme(themeId)
    var sel = document.getElementById('lc-monaco-theme-select')
    if (sel && sel.value !== themeId) sel.value = themeId
  }

  function nextLcMonacoTheme() {
    var cur = getLcMonacoGlobalTheme()
    var idx = 0
    for (var ni = 0; ni < LC_THEME_SPECS.length; ni++) {
      if (LC_THEME_SPECS[ni].id === cur) {
        idx = ni
        break
      }
    }
    var nextSpec = LC_THEME_SPECS[(idx + 1) % LC_THEME_SPECS.length]
    applyLcMonacoTheme(nextSpec.id)
  }

  function getLcMonacoFileLinePreference() {
    if (typeof window.__lcMonacoFileLineMode === 'boolean')
      return window.__lcMonacoFileLineMode
    try {
      var v = localStorage.getItem(LC_FILE_LINES_STORAGE_KEY)
      if (v === '0') {
        window.__lcMonacoFileLineMode = false
        return false
      }
      if (v === '1') {
        window.__lcMonacoFileLineMode = true
        return true
      }
    } catch (e) {}
    window.__lcMonacoFileLineMode = true
    return true
  }

  function refreshAllMonacoEditorsLineNumbers() {
    var pref = getLcMonacoFileLinePreference()
    $('#main-view code').each(function () {
      var $code = $(this)
      var ed = $code.data('lcMonacoEditor')
      if (!ed) return
      var fs = inferFileLineStart(this)
      if (fs < 1) fs = 1
      var use = pref && fs > 1
      ed.updateOptions({
        lineNumbers: lineNumbersMonacoOption(use, fs)
      })
    })
  }

  function syncLcMonacoHeaderLineModeButton() {
    var $b = $('#lc-monaco-line-mode-btn')
    if (!$b.length) return
    var pref = getLcMonacoFileLinePreference()
    $b.attr('aria-pressed', pref ? 'true' : 'false')
    if (pref) {
      $b.text('Lines: file #')
      $b.attr(
        'title',
        'Gutter uses file line numbers when the snippet does not start at line 1. Click for 1, 2, 3…'
      )
    } else {
      $b.text('Lines: 1…')
      $b.attr(
        'title',
        'Gutter counts from 1 in each snippet. Click to use file line numbers where applicable'
      )
    }
  }

  function applyLcMonacoFileLineModeGlobal(useFileLines) {
    window.__lcMonacoFileLineMode = !!useFileLines
    try {
      localStorage.setItem(
        LC_FILE_LINES_STORAGE_KEY,
        useFileLines ? '1' : '0'
      )
    } catch (e) {}
    refreshAllMonacoEditorsLineNumbers()
    syncLcMonacoHeaderLineModeButton()
  }

  function getLcMonacoFitHeightPreference() {
    if (typeof window.__lcMonacoFitHeight === 'boolean')
      return window.__lcMonacoFitHeight
    try {
      var v = localStorage.getItem(LC_FIT_HEIGHT_STORAGE_KEY)
      if (v === '0') {
        window.__lcMonacoFitHeight = false
        return false
      }
      if (v === '1') {
        window.__lcMonacoFitHeight = true
        return true
      }
    } catch (e) {}
    window.__lcMonacoFitHeight = false
    return false
  }

  function updateMonacoHostHeightForPreference(codeEl) {
    var $c = $(codeEl)
    var ed = $c.data('lcMonacoEditor')
    var $wrap = $c.data('lcMonacoHost')
    if (!ed || !$wrap || !$wrap.length) return
    var $host = $wrap.find('.lc-monaco-host').first()
    if (!$host.length) return
    if (getLcMonacoFitHeightPreference()) {
      var h = Math.max(20, ed.getContentHeight())
      $host.css({ height: h + 'px', minHeight: h + 'px' })
    } else {
      var text = readSource($c)
      var minH = editorHeightPx(text)
      $host.css({ height: '', minHeight: minH + 'px' })
    }
    try {
      ed.layout()
    } catch (e) {}
  }

  function refreshAllMonacoEditorsFitHeight() {
    $('#main-view code').each(function () {
      updateMonacoHostHeightForPreference(this)
    })
  }

  function syncLcMonacoHeaderFitHeightButton() {
    var $b = $('#lc-monaco-fit-height-btn')
    if (!$b.length) return
    var on = getLcMonacoFitHeightPreference()
    $b.attr('aria-pressed', on ? 'true' : 'false')
    if (on) {
      $b.text('Height: fit lines')
      $b.attr(
        'title',
        'Editor height matches full content. Click for default capped height'
      )
    } else {
      $b.text('Height: default')
      $b.attr(
        'title',
        'Click to set editor height to all lines (no inner vertical scroll)'
      )
    }
  }

  function applyLcMonacoFitHeightGlobal(enabled) {
    window.__lcMonacoFitHeight = !!enabled
    try {
      localStorage.setItem(LC_FIT_HEIGHT_STORAGE_KEY, enabled ? '1' : '0')
    } catch (e) {}
    refreshAllMonacoEditorsFitHeight()
    syncLcMonacoHeaderFitHeightButton()
  }

  function installLcMonacoHeaderThemeControl() {
    if (window.__lcMonacoHeaderThemeInstalled) return
    var $menu = $('#menu')
    if (!$menu.length) return
    window.__lcMonacoHeaderThemeInstalled = true
    var $wrap = $('<span class="lc-monaco-header-theme-wrap" />')
    $wrap.append(
      $('<label for="lc-monaco-theme-select" />').text('Code theme ')
    )
    var $sel = $(
      '<select id="lc-monaco-theme-select" class="lc-monaco-theme-select" />'
    )
    $sel.attr('title', 'VSCode/monaco viewer theme (all code blocks)')
    for (var hi = 0; hi < LC_THEME_SPECS.length; hi++) {
      var t = LC_THEME_SPECS[hi]
      $sel.append($('<option/>').val(t.id).text(t.label))
    }
    $sel.val(getLcMonacoGlobalTheme())
    $sel.on('change', function () {
      applyLcMonacoTheme(String($(this).val()))
    })
    $wrap.append($sel)
    var $nextBtn = $(
      '<button type="button" class="lc-monaco-theme-next-btn" />'
    )
    $nextBtn.attr({
      title: 'Next theme',
      'aria-label': 'Next code theme'
    })
    $nextBtn.html(
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zm10 0V6h2v12h-2z"/></svg>'
    )
    $nextBtn.on('click', function (e) {
      e.preventDefault()
      nextLcMonacoTheme()
    })
    $wrap.append($nextBtn)

    var $lineBar = $('<span class="lc-monaco-header-lines-wrap" />')
    var $lineBtn = $(
      '<button type="button" id="lc-monaco-line-mode-btn" class="lc-monaco-line-mode-header-btn" />'
    )
    $lineBtn.on('click', function (e) {
      e.preventDefault()
      applyLcMonacoFileLineModeGlobal(!getLcMonacoFileLinePreference())
    })
    $lineBar.append($lineBtn)

    var $fitBar = $('<span class="lc-monaco-header-fit-wrap" />')
    var $fitBtn = $(
      '<button type="button" id="lc-monaco-fit-height-btn" class="lc-monaco-fit-height-header-btn" />'
    )
    $fitBtn.on('click', function (e) {
      e.preventDefault()
      applyLcMonacoFitHeightGlobal(!getLcMonacoFitHeightPreference())
    })
    $fitBar.append($fitBtn)

    var $hb = $menu.find('.heartbeat').first()
    if ($hb.length) {
      $hb.before($wrap)
      $hb.before($fitBar)
      $hb.before($lineBar)
    } else {
      $menu.append($lineBar)
      $menu.append($fitBar)
      $menu.append($wrap)
    }
    syncLcMonacoHeaderLineModeButton()
    syncLcMonacoHeaderFitHeightButton()
  }

  function ensureLcMonacoThemes() {
    if (!window.monaco || !monaco.editor || window.__lcMonacoThemesDefined) return
    window.__lcMonacoThemesDefined = true
    try {
      monaco.editor.defineTheme('lc-ocean', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d1117',
          'editorGutter.background': '#0d1117',
          'editorLineNumber.foreground': '#484f58',
          'editorLineNumber.activeForeground': '#58a6ff'
        }
      })
      monaco.editor.defineTheme('lc-amber', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1c1610',
          'editorGutter.background': '#1c1610',
          'editor.foreground': '#e8dcc4',
          'editorLineNumber.foreground': '#8b7355',
          'editorLineNumber.activeForeground': '#f0a020'
        }
      })
      monaco.editor.defineTheme('lc-forest', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d1f14',
          'editorGutter.background': '#0d1f14',
          'editorLineNumber.foreground': '#2d5a3d',
          'editorLineNumber.activeForeground': '#6ecf8f'
        }
      })
      monaco.editor.defineTheme('lc-midnight', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1a1025',
          'editorGutter.background': '#1a1025',
          'editorLineNumber.foreground': '#4a3566',
          'editorLineNumber.activeForeground': '#c4a7ff'
        }
      })
      monaco.editor.defineTheme('lc-dawn', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#faf6f1',
          'editorGutter.background': '#faf6f1',
          'editor.foreground': '#3d3833',
          'editorLineNumber.foreground': '#b8a99a',
          'editorLineNumber.activeForeground': '#8b6914'
        }
      })
      monaco.editor.defineTheme('lc-slate', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e2428',
          'editorGutter.background': '#1e2428',
          'editorLineNumber.foreground': '#3d4f5f',
          'editorLineNumber.activeForeground': '#9bb4c8'
        }
      })
      monaco.editor.defineTheme('lc-rose', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#221418',
          'editorGutter.background': '#221418',
          'editorLineNumber.foreground': '#5c3038',
          'editorLineNumber.activeForeground': '#f4a6b5'
        }
      })
      monaco.editor.defineTheme('lc-crimson', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1a0a0c',
          'editorGutter.background': '#1a0a0c',
          'editorLineNumber.foreground': '#6b3038',
          'editorLineNumber.activeForeground': '#ff6b7a'
        }
      })
      monaco.editor.defineTheme('lc-teal', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0a1614',
          'editorGutter.background': '#0a1614',
          'editorLineNumber.foreground': '#2a5c52',
          'editorLineNumber.activeForeground': '#5eead4'
        }
      })
      monaco.editor.defineTheme('lc-ink', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0e1116',
          'editorGutter.background': '#0e1116',
          'editorLineNumber.foreground': '#4a5568',
          'editorLineNumber.activeForeground': '#90cdf4'
        }
      })
      monaco.editor.defineTheme('lc-sand', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#f5f0e6',
          'editorGutter.background': '#f5f0e6',
          'editor.foreground': '#3d3428',
          'editorLineNumber.foreground': '#a89880',
          'editorLineNumber.activeForeground': '#6b5344'
        }
      })
      monaco.editor.defineTheme('lc-lavender', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#f3f0fa',
          'editorGutter.background': '#f3f0fa',
          'editor.foreground': '#2d2640',
          'editorLineNumber.foreground': '#9b8fb8',
          'editorLineNumber.activeForeground': '#5b4b8a'
        }
      })
      monaco.editor.defineTheme('lc-coffee', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1f1814',
          'editorGutter.background': '#1f1814',
          'editor.foreground': '#e8ddd4',
          'editorLineNumber.foreground': '#7d6a58',
          'editorLineNumber.activeForeground': '#d4a574'
        }
      })
      monaco.editor.defineTheme('lc-nord', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#2e3440',
          'editorGutter.background': '#2e3440',
          'editorLineNumber.foreground': '#4c566a',
          'editorLineNumber.activeForeground': '#88c0d0'
        }
      })
    } catch (e) {}
  }

  function attachMonacoWheelScrollChain($wrap, $c) {
    var wheelOpts = { passive: false, capture: true }
    function onWheelCapture(e) {
      var ed = $c.data('lcMonacoEditor')
      if (!ed) return
      var layout = ed.getLayoutInfo()
      if (!layout || layout.height < 1) return
      var contentH = ed.getContentHeight()
      var scrollTop = ed.getScrollTop()
      var viewH = layout.height
      var maxTop = Math.max(0, contentH - viewH)
      var deltaY = e.deltaY
      if (e.deltaMode === 1) deltaY *= 16
      else if (e.deltaMode === 2) deltaY *= viewH
      var eps = 3
      var atTop = scrollTop <= eps
      var atBottom = maxTop <= eps || scrollTop >= maxTop - eps
      var chain = false
      if (atTop && atBottom) chain = true
      else if (atTop && deltaY < 0) chain = true
      else if (atBottom && deltaY > 0) chain = true
      if (!chain) return
      e.preventDefault()
      e.stopPropagation()
      scrollScrollableChain($wrap[0], deltaY)
    }
    $wrap[0].addEventListener('wheel', onWheelCapture, wheelOpts)
    return function cleanupWheel() {
      if ($wrap && $wrap[0])
        $wrap[0].removeEventListener('wheel', onWheelCapture, wheelOpts)
    }
  }

  function mountEditor($code) {
    var $c = $($code)
    if ($c.data('lcMonacoEditor')) return

    ensureLcMonacoThemes()

    var $pre = $c.parent('pre')
    if (!$pre.length) return

    var text = readSource($c)
    var lang = mapLanguage($c.attr('class'))
    var fileStart = inferFileLineStart($code)
    if (fileStart < 1) fileStart = 1
    var useFileLines = getLcMonacoFileLinePreference() && fileStart > 1

    $c.css({
      display: 'none',
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      'white-space': 'pre'
    })

    var $wrap = $('<div class="lc-monaco-wrap" />')
    $wrap.css({ width: '100%', margin: '4px 0' })

    $wrap.css({
      border: 'none',
      'border-radius': '0',
      overflow: 'hidden'
    })

    var $host = $('<div class="lc-monaco-host" />')
    $host.css({
      width: '100%',
      minHeight: editorHeightPx(text) + 'px',
      overflow: 'hidden'
    })
    $wrap.append($host)
    $wrap.insertAfter($c)

    var editor = monaco.editor.create($host[0], {
      value: text,
      language: lang,
      readOnly: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 13,
      lineNumbers: lineNumbersMonacoOption(useFileLines, fileStart),
      wordWrap: 'on',
      renderWhitespace: 'selection',
      folding: true,
      theme: getLcMonacoGlobalTheme(),
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
    })

    var lcMonacoWheelCleanup = attachMonacoWheelScrollChain($wrap, $c)

    var contentSizeDisposable = editor.onDidContentSizeChange(function () {
      if (getLcMonacoFitHeightPreference())
        updateMonacoHostHeightForPreference($c[0])
    })

    $c.data('lcMonacoEditor', editor)
    $c.data('lcMonacoHost', $wrap)
    $c.data('lcMonacoWheelCleanup', lcMonacoWheelCleanup)
    $c.data('lcMonacoContentSizeDisposable', contentSizeDisposable)
    updateMonacoHostHeightForPreference($c[0])
  }

  function unmountEditor($code) {
    var $c = $($code)
    var wheelCleanup = $c.data('lcMonacoWheelCleanup')
    if (typeof wheelCleanup === 'function') {
      try {
        wheelCleanup()
      } catch (e) {}
      $c.removeData('lcMonacoWheelCleanup')
    }
    var contentDisp = $c.data('lcMonacoContentSizeDisposable')
    if (contentDisp && typeof contentDisp.dispose === 'function') {
      try {
        contentDisp.dispose()
      } catch (e) {}
      $c.removeData('lcMonacoContentSizeDisposable')
    }
    var ed = $c.data('lcMonacoEditor')
    var $wrap = $c.data('lcMonacoHost')
    if (ed) {
      try {
        ed.dispose()
      } catch (e) {}
      $c.removeData('lcMonacoEditor')
    }
    if ($wrap && $wrap.length) {
      $wrap.remove()
      $c.removeData('lcMonacoHost')
    }
    $c.css({
      display: '',
      position: '',
      width: '',
      height: '',
      overflow: '',
      clip: '',
      'white-space': ''
    })
  }

  codeOnShow = function ($code) {
    var $c = $($code)
    if ($c.data('lcMonacoEditor')) return

    loadMonaco(function () {
      if (!$c.closest('pre').is(':visible')) return
      if (!$c.parent().length) return
      mountEditor($code)
      $c.attr('highlighted', true)
    })
  }

  codeOnHide = function ($code) {
    unmountEditor($code)
    $($code).removeAttr('highlighted')
  }

  $(function () {
    installLcMonacoHeaderThemeControl()
  })
})()

// plugin: VSCode/monaco editor ]

// monaco host tweaks [
//:= this.frame('client.css')

.lc-monaco-header-lines-wrap {
  display: inline-block;
  margin: 0 10px 0 8px;
  vertical-align: middle;
}

.lc-monaco-header-fit-wrap {
  display: inline-block;
  margin: 0 8px 0 0;
  vertical-align: middle;
}

.lc-monaco-line-mode-header-btn {
  font-size: 12px;
  padding: 3px 10px;
  cursor: pointer;
  border-radius: 3px;
  border: 1px solid rgba(120, 130, 160, 0.6);
  background: rgba(50, 54, 68, 0.9);
  color: #e0e4f0;
}

.lc-monaco-line-mode-header-btn:hover {
  background: rgba(70, 74, 92, 0.95);
}

.lc-monaco-line-mode-header-btn[aria-pressed='true'] {
  border-color: #6ae;
  background: rgba(40, 70, 110, 0.85);
}

.lc-monaco-fit-height-header-btn {
  font-size: 12px;
  padding: 3px 10px;
  cursor: pointer;
  border-radius: 3px;
  border: 1px solid rgba(120, 130, 160, 0.6);
  background: rgba(50, 54, 68, 0.9);
  color: #e0e4f0;
}

.lc-monaco-fit-height-header-btn:hover {
  background: rgba(70, 74, 92, 0.95);
}

.lc-monaco-fit-height-header-btn[aria-pressed='true'] {
  border-color: #6ae;
  background: rgba(40, 70, 110, 0.85);
}

.lc-monaco-header-theme-wrap {
  display: inline-block;
  margin: 0 12px 0 0;
  vertical-align: middle;
  font-size: 13px;
}

.lc-monaco-header-theme-wrap label {
  margin-right: 6px;
  cursor: pointer;
}

.lc-monaco-theme-select {
  font-size: 12px;
  padding: 2px 6px;
  max-width: 200px;
  vertical-align: middle;
}

.lc-monaco-theme-next-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 2px 6px;
  vertical-align: middle;
  border: 1px solid rgba(120, 130, 160, 0.55);
  border-radius: 3px;
  background: rgba(50, 54, 68, 0.85);
  color: #c8d0e0;
  cursor: pointer;
  line-height: 1;
}

.lc-monaco-theme-next-btn:hover {
  background: rgba(70, 74, 92, 0.95);
  color: #fff;
}

/* editor background comes from VSCode/monaco theme (vs / vs-dark / …) */

.monaco-editor .minimap {
  z-index: 0 !important; 
}

.scope .lc-monaco-wrap {
  max-width: calc(100vw - 48px);
  border: none;
  box-shadow: none;
}

// monaco host tweaks ]
