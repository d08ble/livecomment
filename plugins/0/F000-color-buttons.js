// color buttons — per-node tags; menu strip toggles node-name or code under tag [
//:= this.frame('client.exec')

this.dbgbrk('F000 color buttons')

if (!window.__lcColorButtons) {
  window.__lcColorButtons = true

  var LC_COLOR_STORE = 'lcColorSelections'
  var LC_HIDE_BY_COLOR_STORE = 'lcColorHideByColorMode'
  var LC_FILTER_CI_STORE = 'lcColorFilterLastIndex'
  var LC_NUM_COLORS = 12
  var LC_BIT_MASK = (1 << LC_NUM_COLORS) - 1
  var LC_COLORS = [
    '#e53935',
    '#fb8c00',
    '#fdd835',
    '#43a047',
    '#1e88e5',
    '#8e24aa',
    '#546e7a',
    '#00897b',
    '#c2185b',
    '#6d4c41',
    '#f4511e',
    '#7cb342'
  ]

  /** Viewport Y offset below fixed #menu for “reading line” (page scroll only; not VSCode/monaco inner scroll). */
  var LC_READING_LINE_INSET = 28

  function loadColorMap() {
    try {
      var raw = localStorage.getItem(LC_COLOR_STORE)
      if (!raw) return {}
      var o = JSON.parse(raw)
      return o && typeof o === 'object' ? o : {}
    } catch (e) {
      return {}
    }
  }

  function saveColorMap(map) {
    try {
      localStorage.setItem(LC_COLOR_STORE, JSON.stringify(map))
    } catch (e) {}
  }

  function bitsFromStored(v) {
    if (v == null || v === '') return 0
    if (typeof v === 'number' && !isNaN(v)) return v & LC_BIT_MASK
    if (typeof v === 'string' && v.length >= 1) {
      var b = 0
      var slen = Math.min(v.length, LC_NUM_COLORS)
      for (var i = 0; i < slen; i++) {
        if (v.charAt(i) === '1') b |= 1 << i
      }
      return b
    }
    if (Object.prototype.toString.call(v) === '[object Array]') {
      var b2 = 0
      for (var j = 0; j < LC_NUM_COLORS && j < v.length; j++) {
        if (v[j]) b2 |= 1 << j
      }
      return b2
    }
    return 0
  }

  function bitsToStoredString(bits) {
    var s = ''
    for (var i = 0; i < LC_NUM_COLORS; i++) {
      s += bits & (1 << i) ? '1' : '0'
    }
    return s
  }

  function setBitsForNodeId(id, bits) {
    var map = loadColorMap()
    bits = bits & LC_BIT_MASK
    if (bits === 0) {
      delete map[id]
    } else {
      map[id] = bitsToStoredString(bits)
    }
    saveColorMap(map)
  }

  function ensureColorButtonStyles() {
    var css =
      '.lc-node-name{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}' +
      '.lc-node-name-label{flex:1;min-width:0;cursor:inherit}' +
      '.lc-color-btns{display:inline-flex;gap:3px;flex-shrink:0;align-items:center}' +
      '.lc-color-btn{width:14px;height:14px;border-radius:50%;border:0;padding:0;margin:0;cursor:pointer;flex-shrink:0;opacity:.2;transition:opacity .12s ease;outline:none;-webkit-appearance:none;appearance:none}' +
      '.lc-color-btn.lc-on{opacity:1}' +
      '#menu .lc-menu-color-wrap{float:right;display:flex;flex-direction:row;align-items:center;justify-content:space-between;direction:ltr;box-sizing:border-box;min-width:200px;gap:9px;margin:5px 8px 0 6px;vertical-align:middle}' +
      '#menu .lc-menu-color-strip{display:inline-flex;flex:0 0 auto;flex-direction:row;gap:3px;align-items:center}' +
      '#menu .lc-menu-color-strip .lc-menu-color-btn{width:13.5px;height:13.5px;border-radius:50%;border:0;padding:0;cursor:pointer;vertical-align:middle;outline:none;-webkit-appearance:none;appearance:none;transition:transform .12s ease,opacity .12s ease}' +
      '#menu .lc-menu-color-strip .lc-menu-color-btn:hover{transform:scale(1.08)}' +
      '#menu .lc-menu-color-strip .lc-menu-color-btn.lc-filter-picked{transform:scale(1.12);opacity:1}' +
      '#menu #lc-menu-color-hide-toggle{flex:0 0 auto;width:13.5px;height:13.5px;min-width:13.5px;padding:0;margin:0;border-radius:50%;border:2px solid rgba(0,0,0,.45);cursor:pointer;vertical-align:middle;background:#fff;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;font-size:9.75px;font-weight:700;line-height:1;color:#000;font-family:system-ui,Segoe UI,sans-serif}' +
      '#menu #lc-menu-color-hide-toggle:hover{border-color:#000;box-shadow:0 0 0 1px rgba(0,0,0,.25)}' +
      '#menu #lc-menu-color-hide-toggle.lc-on{border-color:#1976d2;box-shadow:0 0 0 2px rgba(25,118,210,.35)}'
    var el = document.getElementById('lc-color-buttons-style')
    if (el) {
      el.textContent = css
      return
    }
    $('<style type="text/css" id="lc-color-buttons-style" />').text(css).appendTo('head')
  }

  function allPresLikeMenu() {
    return $('pre')
  }

  function hideAllCodeLikeBtnmc() {
    var $p = allPresLikeMenu()
    if (!$p.length) return
    // Prefer hideShowCode so we always hide all pres without toggling #btnmc.
    // Clicking #btnmc twice would show code again and breaks hide-by-color strip clicks.
    if (typeof hideShowCode === 'function') {
      hideShowCode($p, 'hide')
      return
    }
    var $mc = $('#menu #btnmc')
    if ($mc.length) {
      $mc.trigger('click')
      return
    }
    $p.hide()
  }

  function showAllCodeLikeBtnpc() {
    var $p = allPresLikeMenu()
    if (!$p.length) return
    if (typeof hideShowCode === 'function') {
      hideShowCode($p, 'show')
      return
    }
    var $pc = $('#menu #btnpc')
    if ($pc.length) {
      $pc.trigger('click')
      return
    }
    $p.show()
  }

  function filterColorIndexGet() {
    try {
      var s = localStorage.getItem(LC_FILTER_CI_STORE)
      if (s == null || s === '') return null
      var n = parseInt(s, 10)
      if (isNaN(n) || n < 0 || n >= LC_NUM_COLORS) return null
      return n
    } catch (e) {
      return null
    }
  }

  function filterColorIndexSet(ci) {
    try {
      if (ci == null || ci === '') localStorage.removeItem(LC_FILTER_CI_STORE)
      else localStorage.setItem(LC_FILTER_CI_STORE, String(ci))
    } catch (e) {}
  }

  function isHideByColorMode() {
    return localStorage.getItem(LC_HIDE_BY_COLOR_STORE) === '1'
  }

  function pageScrollY() {
    var se = document.scrollingElement
    if (se && typeof se.scrollTop === 'number') return se.scrollTop
    if (window.scrollY != null) return window.scrollY
    if (window.pageYOffset != null) return window.pageYOffset
    var d = document.documentElement
    return (d && d.scrollTop) || (document.body && document.body.scrollTop) || 0
  }

  function menuViewportBottom() {
    var m = document.getElementById('menu')
    if (!m) return 0
    return m.getBoundingClientRect().bottom
  }

  function firstDirectNodeName(nodeEl) {
    if (!nodeEl || !nodeEl.children) return null
    var ch = nodeEl.children
    for (var j = 0; j < ch.length; j++) {
      if (ch[j].classList && ch[j].classList.contains('node-name')) return ch[j]
    }
    return null
  }

  function nodeHasVisibleCode(nodeEl) {
    if (!nodeEl || !nodeEl.querySelectorAll) return false
    var pres = nodeEl.querySelectorAll('pre')
    for (var i = 0; i < pres.length; i++) {
      if ($(pres[i]).is(':visible')) return true
    }
    return false
  }

  function readingLineViewportY() {
    return menuViewportBottom() + LC_READING_LINE_INSET
  }

  function clampDeltaNodeNameOnly(deltaRaw, nnHeight) {
    return Math.max(0, Math.min(deltaRaw, nnHeight))
  }

  /**
   * Heading that should stay fixed on screen: among .node-name with top <= menu line, pick the one
   * with the largest top (closest under the menu).
   */
  function findAnchorNodeNameEl() {
    var names = document.querySelectorAll('#main-view .node-name')
    var line = menuViewportBottom() + 2
    var best = null
    var bestTop = -Infinity
    var i
    for (i = 0; i < names.length; i++) {
      var el = names[i]
      var t = el.getBoundingClientRect().top
      if (t <= line && t > bestTop) {
        bestTop = t
        best = el
      }
    }
    if (best) return best
    var x = Math.min(Math.max(8, Math.floor(window.innerWidth / 2)), window.innerWidth - 8)
    var y = Math.min(Math.max(line + 32, 8), window.innerHeight - 8)
    var hit = null
    try {
      hit = document.elementFromPoint(x, y)
    } catch (e) {
      hit = null
    }
    while (hit && hit !== document.body && hit !== document.documentElement) {
      if (hit.classList && hit.classList.contains('node-name')) return hit
      if (hit.classList && hit.classList.contains('node')) {
        var nn = firstDirectNodeName(hit)
        return nn || hit
      }
      if (hit.classList && hit.classList.contains('scope')) break
      hit = hit.parentElement
    }
    for (i = 0; i < names.length; i++) {
      var r = names[i].getBoundingClientRect()
      if (r.bottom > 0 && r.top < window.innerHeight) return names[i]
    }
    return names.length ? names[0] : null
  }

  function contextFromNodeNameEl(nnEl) {
    if (!nnEl || !nnEl.getBoundingClientRect) return null
    var node = nnEl.parentElement
    while (node && (!node.classList || !node.classList.contains('node'))) node = node.parentElement
    if (!node) return null
    var refY = readingLineViewportY()
    var nnRect = nnEl.getBoundingClientRect()
    return {
      node: node,
      nn: nnEl,
      anchorTop: nnRect.top,
      codeOpen: nodeHasVisibleCode(node),
      nnH: nnRect.height,
      refY: refY
    }
  }

  /** Resolve .node under reading line; page-level offset from node-name top (not VSCode/monaco editor internals). */
  function findNodeContextFromViewport() {
    var line = menuViewportBottom()
    var refY = readingLineViewportY()
    var cx = Math.min(Math.max(8, Math.floor(window.innerWidth / 2)), window.innerWidth - 8)
    var cy = Math.min(Math.max(refY, line + 4), window.innerHeight - 8)
    var hit = null
    try {
      hit = document.elementFromPoint(cx, cy)
    } catch (e) {
      hit = null
    }
    var tries = 0
    while (!hit && tries < 4) {
      cy = Math.min(cy + 24, window.innerHeight - 8)
      try {
        hit = document.elementFromPoint(cx, cy)
      } catch (e2) {
        hit = null
      }
      tries++
    }
    while (hit && hit !== document.body && hit !== document.documentElement) {
      if (hit.closest && hit.closest('#menu')) {
        hit = null
        break
      }
      if (hit.classList && hit.classList.contains('node')) {
        var nn = firstDirectNodeName(hit)
        var anchorTop = nn ? nn.getBoundingClientRect().top : hit.getBoundingClientRect().top
        var nnH = nn ? nn.getBoundingClientRect().height : 0
        return {
          node: hit,
          nn: nn,
          anchorTop: anchorTop,
          codeOpen: nodeHasVisibleCode(hit),
          nnH: nnH,
          refY: refY
        }
      }
      hit = hit.parentElement
    }
    return null
  }

  function captureNodeNameScrollAnchor() {
    var y0 = pageScrollY()
    var ctx = findNodeContextFromViewport()
    if (!ctx) {
      var nnFallback = findAnchorNodeNameEl()
      ctx = nnFallback ? contextFromNodeNameEl(nnFallback) : null
    }
    if (!ctx || !ctx.node) {
      return { y0: y0, r0: null, nodeId: null, deltaRaw: 0 }
    }
    var deltaRaw = ctx.refY - ctx.anchorTop
    var delta0 = ctx.codeOpen ? deltaRaw : clampDeltaNodeNameOnly(deltaRaw, ctx.nnH)
    var r0 = ctx.anchorTop + delta0
    var nid = ctx.node.id
    return {
      y0: y0,
      r0: r0,
      nodeId: nid && nid.length ? nid : null,
      deltaRaw: deltaRaw
    }
  }

  /**
   * Align the captured node-name to the reading line using current layout.
   * Uses scrollBy from the current scroll position so repeated calls stay correct
   * when VSCode/monaco (or other) async layout shifts the DOM after the first frame.
   * The old y0+r1-r0 formula assumed r1 was measured at the pre-restore scroll offset,
   * which breaks once layout changes between capture and restore.
   */
  function applyNodeNameScrollAlignOnce(anchor) {
    if (!anchor) return
    if (anchor.nodeId == null || anchor.nodeId === '') {
      if (anchor.y0 != null) window.scrollTo(0, anchor.y0)
      return
    }
    var node = document.getElementById(anchor.nodeId)
    if (!node || !document.body.contains(node)) {
      if (anchor.y0 != null) window.scrollTo(0, anchor.y0)
      return
    }
    var nn = firstDirectNodeName(node)
    var elTop = nn || node
    var refY = readingLineViewportY()
    var deltaRaw = typeof anchor.deltaRaw === 'number' ? anchor.deltaRaw : 0
    var codeOpen = nodeHasVisibleCode(node)
    var nnH = nn ? nn.getBoundingClientRect().height : 0
    var delta1 = codeOpen ? deltaRaw : clampDeltaNodeNameOnly(deltaRaw, nnH)
    var targetTop = refY - delta1
    var curTop = elTop.getBoundingClientRect().top
    var dy = curTop - targetTop
    if (Math.abs(dy) < 0.5) return
    window.scrollBy(0, dy)
  }

  function restoreNodeNameScrollAnchor(anchor) {
    function run() {
      applyNodeNameScrollAlignOnce(anchor)
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          run()
          setTimeout(run, 0)
          setTimeout(run, 50)
          setTimeout(run, 120)
          setTimeout(run, 280)
        })
      })
    } else {
      setTimeout(run, 0)
      setTimeout(run, 50)
      setTimeout(run, 120)
    }
  }

  function syncMenuColorStripFilterHighlight() {
    var $btns = $('#lc-menu-color-strip .lc-menu-color-btn')
    $btns.removeClass('lc-filter-picked')
    if (!isHideByColorMode()) return
    var ci = filterColorIndexGet()
    if (ci == null) return
    $btns.filter('[data-lc-ci="' + ci + '"]').addClass('lc-filter-picked')
  }

  function syncHideModeToggleUi() {
    var on = isHideByColorMode()
    var $t = $('#lc-menu-color-hide-toggle')
    $t.toggleClass('lc-on', on)
    $t.attr('aria-pressed', on ? 'true' : 'false')
    $t.attr(
      'title',
      on
        ? '0 on: same as -[] then pick one color to show only tagged code. 0 off: show all code (-[] +[]).'
        : '0 off: color dots act like node-name click. 0 on: uses -[] (hide all pre) then pick a color.'
    )
    $('#lc-menu-color-strip').attr(
      'title',
      on
        ? 'Runs -[] (hide all code) then shows only code under nodes with this color'
        : 'Same as clicking each tagged node-name'
    )
    syncMenuColorStripFilterHighlight()
  }

  function ensureMenuStrip() {
    ensureColorButtonStyles()
    var $hb = $('#menu .heartbeat')
    var $wrap = $('#lc-menu-color-wrap')
    if (!$wrap.length) {
      $wrap = $('<span>', { id: 'lc-menu-color-wrap', class: 'lc-menu-color-wrap' })
      var $strip = $('<span>', { id: 'lc-menu-color-strip', class: 'lc-menu-color-strip' })
      for (var c = 0; c < LC_NUM_COLORS; c++) {
        $strip.append(
          $('<button>', {
            type: 'button',
            class: 'lc-menu-color-btn',
            'data-lc-ci': String(c),
            title: 'Color ' + (c + 1)
          }).css('background-color', LC_COLORS[c])
        )
      }
      var $toggle = $('<button>', {
        id: 'lc-menu-color-hide-toggle',
        type: 'button',
        class: 'lc-menu-color-hide-toggle',
        text: '0',
        'aria-label':
          'Filter by color: 0 on runs -[] hide all pre, then pick a color. 0 off shows all code like +[].'
      })
      $wrap.append($strip)
      $wrap.append($toggle)
      if ($hb.length) {
        $wrap.insertAfter($hb)
      } else {
        $('#menu').append($wrap)
      }
    } else {
      var $toggle = $('#lc-menu-color-hide-toggle')
      if ($toggle.length) {
        $toggle.text('0')
        $toggle.appendTo($wrap)
      }
      var $stripSync = $('#lc-menu-color-strip')
      var nHave = $stripSync.find('.lc-menu-color-btn').length
      for (var cSync = nHave; cSync < LC_NUM_COLORS; cSync++) {
        $stripSync.append(
          $('<button>', {
            type: 'button',
            class: 'lc-menu-color-btn',
            'data-lc-ci': String(cSync),
            title: 'Color ' + (cSync + 1)
          }).css('background-color', LC_COLORS[cSync])
        )
      }
      var $hb2 = $('#menu .heartbeat')
      if ($hb2.length) {
        $wrap.insertAfter($hb2)
      }
    }
    var $stripEl = $('#lc-menu-color-strip')
    var $togEl = $('#lc-menu-color-hide-toggle')
    if ($stripEl.length && $togEl.length) {
      $stripEl.appendTo($wrap)
      $togEl.appendTo($wrap)
    }
    syncHideModeToggleUi()
  }

  $(document).on('click', '#lc-menu-color-hide-toggle', function (ev) {
    ev.preventDefault()
    var next = !isHideByColorMode()
    try {
      localStorage.setItem(LC_HIDE_BY_COLOR_STORE, next ? '1' : '0')
    } catch (e) {}
    if (!next) {
      filterColorIndexSet(null)
      showAllCodeLikeBtnpc()
    } else {
      filterColorIndexSet(null)
      hideAllCodeLikeBtnmc()
    }
    syncHideModeToggleUi()
  })

  function enhanceNodeNames($el) {
    var $root = $el && $el.length ? $el : $('#main-view')
    ensureColorButtonStyles()
    ensureMenuStrip()

    var map = loadColorMap()
    $root.find('.node-name').each(function () {
      var $nm = $(this)
      if ($nm.data('lcColorEnhanced')) return
      var $node = $nm.parent('.node')
      if (!$node.length) return

      var id = $node.attr('id')
      if (!id) return

      var labelText = $nm.text()
      var bits = bitsFromStored(map[id])

      $nm.data('lcColorEnhanced', true)
      $nm.addClass('lc-node-name')
      $nm.empty()
      var $label = $('<span>', { class: 'lc-node-name-label', text: labelText })
      $nm.append($label)

      var $btns = $('<span>', { class: 'lc-color-btns' })
      for (var i = 0; i < LC_NUM_COLORS; i++) {
        var on = !!(bits & (1 << i))
        var $b = $('<button>', {
          type: 'button',
          class: 'lc-color-btn' + (on ? ' lc-on' : ''),
          'data-lc-ci': String(i),
          title: 'Color ' + (i + 1)
        })
        $b.css('background-color', LC_COLORS[i])
        $btns.append($b)
      }
      $nm.append($btns)

      $btns.on('click', '.lc-color-btn', function (ev) {
        ev.stopPropagation()
        ev.preventDefault()
        var $btn = $(this)
        var ci = parseInt($btn.attr('data-lc-ci'), 10)
        if (isNaN(ci)) return
        var cur = bitsFromStored(loadColorMap()[id])
        var next = cur ^ (1 << ci)
        setBitsForNodeId(id, next)
        if (next & (1 << ci)) {
          $btn.addClass('lc-on')
        } else {
          $btn.removeClass('lc-on')
        }
      })
    })
    applyFilterModeView()
    return $root
  }

  function collectNodesWithColorBit(map, bit) {
    var $set = $()
    $('#main-view .node').each(function () {
      var $node = $(this)
      var nid = $node.attr('id')
      if (!nid) return
      if (!(bitsFromStored(map[nid]) & bit)) return
      if ($node.children('.node-name').length) {
        $set = $set.add($node)
      }
    })
    return $set
  }

  function applyFilterModeView() {
    if (!isHideByColorMode()) return
    hideAllCodeLikeBtnmc()
    var ci = filterColorIndexGet()
    if (ci == null) {
      syncMenuColorStripFilterHighlight()
      return
    }
    var map = loadColorMap()
    var bit = 1 << ci
    var $set = collectNodesWithColorBit(map, bit)
    if (!$set.length) {
      syncMenuColorStripFilterHighlight()
      return
    }
    var $pres = $set.find('pre')
    if ($pres.length && typeof hideShowCode === 'function') {
      hideShowCode($pres, 'show')
    }
    syncMenuColorStripFilterHighlight()
  }

  $(document).on('click', '#lc-menu-color-strip .lc-menu-color-btn', function () {
    var ci = parseInt($(this).attr('data-lc-ci'), 10)
    if (isNaN(ci)) return
    var scrollAnchor = captureNodeNameScrollAnchor()
    var map = loadColorMap()
    var bit = 1 << ci
    if (isHideByColorMode()) {
      filterColorIndexSet(ci)
      hideAllCodeLikeBtnmc()
      var $set = collectNodesWithColorBit(map, bit)
      if ($set.length) {
        var $pres = $set.find('pre')
        if ($pres.length && typeof hideShowCode === 'function') {
          hideShowCode($pres, 'show')
        }
      }
      syncMenuColorStripFilterHighlight()
      restoreNodeNameScrollAnchor(scrollAnchor)
      return
    }
    $('#main-view .node').each(function () {
      var $node = $(this)
      var nid = $node.attr('id')
      if (!nid) return
      if (!(bitsFromStored(map[nid]) & bit)) return
      var $nn = $node.children('.node-name').first()
      if ($nn.length) {
        $nn.trigger('click')
      }
    })
    restoreNodeNameScrollAnchor(scrollAnchor)
  })

  if (typeof executor !== 'undefined' && executor.on) {
    executor.on('afterElementUpdate', enhanceNodeNames)
  }
  ensureColorButtonStyles()
  ensureMenuStrip()
}

// color buttons — per-node tags; menu strip toggles node-name or code under tag ]
