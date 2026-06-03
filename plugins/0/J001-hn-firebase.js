// plugin: hn firebase api (J001) [
//:= this.frame('client.exec')

this.dbgbrk('J001 Hacker News Firebase')
var self = this

if (!window.__lcHnFb) {
  window.__lcHnFb = true

  var HN_FB_BASE = 'https://hacker-news.firebaseio.com/v0/'
  var HN_ITEM_ID = 48357725
  var HN_ITEM_URL = 'https://news.ycombinator.com/item?id=' + HN_ITEM_ID
  var HN_RELOAD_MS = 10000

  var seen = {}
  var P1 = '///!@#~~'

  function decodeHtmlEntities(s) {
    return s
      .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
        return String.fromCharCode(parseInt(hex, 16))
      })
      .replace(/&#(\d+);/g, function (_, num) {
        return String.fromCharCode(parseInt(num, 10))
      })
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
  }

  function htmlChunkToText(chunk) {
    var s = chunk
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?p>/gi, '')
      .replace(/<[^>]+>/g, '')
    return decodeHtmlEntities(s).trim()
  }

  function htmlToText(html) {
    if (!html) return ''
    var parts = html.split(/<p>/i)
    var lines = []
    for (var i = 0; i < parts.length; i++) {
      var line = htmlChunkToText(parts[i])
      if (line) lines.push(line)
    }
    return lines.join('\n')
  }

  function fetchJson(path) {
    return fetch(HN_FB_BASE + path, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('hn fb http ' + r.status + ' ' + path)
        return r.json()
      })
  }

  function fetchItem(id, progress) {
    progress.schedule(id)
    return fetchJson('item/' + id + '.json').then(function (item) {
      progress.complete(item || { id: id })
      return item
    })
  }

  function objectPath(parentPath, segmentName) {
    return parentPath ? parentPath + P1 + segmentName : segmentName
  }

  function firstLine(text) {
    if (!text) return ''
    var lines = text.split('\n')
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim()
      if (line) return line
    }
    return ''
  }

  function storySegmentName(item) {
    var title = (item && item.title) || 'post'
    if (/who is hiring/i.test(title)) return 'Who is hiring?'
    return title.replace(/^Ask HN:\s*/i, '').trim() || 'post'
  }

  function commentSegmentName(item, usedNames) {
    var user = item.by || 'unknown'
    var line = firstLine(htmlToText(item.text || ''))
    var name = line ? user + ' - ' + line : user + '/' + item.id
    if (name.length > 160) name = name.slice(0, 157) + '...'
    if (usedNames && usedNames[name]) name = name + '/' + item.id
    if (usedNames) usedNames[name] = true
    return name
  }

  function itemText(item) {
    if (!item || !item.id) return ''
    if (item.type === 'comment') {
      var text = htmlToText(item.text || '')
//      var line = firstLine(text)
//      if (line.indexOf('|') !== -1) return line
      return text
    }
    if (item.type === 'story' || item.type === 'job' || item.type === 'poll') {
      var parts = []
      if (item.title) parts.push(item.title)
      if (item.text) parts.push(htmlToText(item.text))
      return parts.join('\n\n').trim()
    }
    return ''
  }

  function segmentNameForItem(item, usedNames) {
    if (item.type === 'comment') return commentSegmentName(item, usedNames)
    if (item.type === 'story' || item.type === 'job' || item.type === 'poll') {
      return storySegmentName(item)
    }
    return 'item/' + item.id
  }

  function buildThreadScope(rootItem, progress) {
    var lines = []
    var objects = {}

    function buildTreeNode(item, usedNames, progress) {
      if (!item || !item.id) return Promise.resolve(null)
      var text = itemText(item)
      var seg = segmentNameForItem(item, usedNames)
      var node = { segmentName: seg, text: text, children: [] }
      var kids = item.kids
      if (!kids || !kids.length) return Promise.resolve(node)
      var childUsed = {}
      return Promise.all(
        kids.map(function (kidId) {
          return fetchItem(kidId, progress).then(function (kid) {
            return buildTreeNode(kid, childUsed, progress)
          })
        })
      ).then(function (childNodes) {
        for (var i = 0; i < childNodes.length; i++) {
          if (childNodes[i]) node.children.push(childNodes[i])
        }
        return node
      })
    }

    function layoutNode(node, parentPath) {
      if (!node) return parentPath
      if (node.text) {
        var start = lines.length
        var textLines = node.text.split('\n')
        for (var i = 0; i < textLines.length; i++) lines.push(textLines[i])
        var path = objectPath(parentPath, node.segmentName)
        for (var j = 0; j < node.children.length; j++) {
          layoutNode(node.children[j], path)
        }
        lines.push('')
        var end = lines.length
        var slice = lines.slice(start, end).join('\n')
        objects[path] = {
          lines: [start, end],
          hash: calcMD5(slice),
          uid: calcMD5(path)
        }
        return path
      }
      for (var k = 0; k < node.children.length; k++) {
        layoutNode(node.children[k], parentPath)
      }
      return parentPath
    }

    return buildTreeNode(rootItem, null, progress).then(function (root) {
      layoutNode(root, '')
      var source = lines.join('\n')
      return {
        name: storySegmentName(rootItem),
        extlang: 'text',
        uid: calcMD5(HN_ITEM_URL),
        objects: objects,
        source: source
      }
    })
  }

  function fetchThreadScope(id, progress) {
    return fetchItem(id, progress).then(function (item) {
      if (!item) return null
      return buildThreadScope(item, progress)
    })
  }

  function menuViewportBottom() {
    var m = document.getElementById('menu')
    if (!m) return 0
    return m.getBoundingClientRect().bottom
  }
  function scrollToScopeEl(el) {
    if (!el || !el.length) return
    var dom = el[0]
    if (!dom || typeof dom.scrollIntoView !== 'function') return
    if (!dom || !dom.getBoundingClientRect) return
    function run() {
      dom.scrollIntoView({ block: 'start' })
      if (typeof dom.scrollIntoView === 'function') {
        dom.scrollIntoView({ block: 'start' })
      }
      var refY = menuViewportBottom()
      var dy = dom.getBoundingClientRect().top - refY
      if (Math.abs(dy) < 0.5) return
      window.scrollBy(0, dy)
    }
    run()
  }

  function pushParsed(scope) {
    var mv = window.__lcMainView
    if (!mv || typeof mv.updateStateObject !== 'function') return false
    if (!scope || !scope.source) return false
    if (seen[scope.name] === scope.source) return false
    seen[scope.name] = scope.source
    var el = mv.updateStateObject(
      {
        name: scope.name,
        extlang: scope.extlang,
        objects: scope.objects,
        uid: scope.uid
      },
      scope.source
    )
    scrollToScopeEl(el)
    return true
  }

  function scan() {
    self.dbgbrk('J001 scan item ' + HN_ITEM_ID)
    resetFetchProgress()
    syncFbButton()
    return fetchThreadScope(HN_ITEM_ID, fetchProgress)
      .then(function (scope) {
        return pushParsed(scope)
      })
      .catch(function (e) {
        console.warn('HN Firebase scan failed:', e)
        return false
      })
  }

  var autoOn = false
  var timer = null
  var scanning = false
  var fetchProgress = null
  var lastFetchTotal = 0

  function resetFetchProgress() {
    fetchProgress = {
      fetched: 0,
      total: 0,
      known: {},
      schedule: function (id) {
        if (this.known[id]) return
        this.known[id] = true
        this.total++
        syncFbButton()
      },
      complete: function (item) {
        this.fetched++
        var kids = item && item.kids
        if (kids) {
          for (var i = 0; i < kids.length; i++) this.schedule(kids[i])
        }
        syncFbButton()
      }
    }
  }

  function syncFbButton() {
    var $b = $('#btnHNFB')
    var busy = autoOn || scanning
    $b.toggleClass('lc-hnfb-on', busy)
    $b.prop('disabled', scanning)
    $b.attr('aria-pressed', autoOn ? 'true' : 'false')
    $b.attr('aria-busy', scanning ? 'true' : 'false')
    var label = 'Hiring HN'
    if (scanning) {
      if (fetchProgress && fetchProgress.total) {
        label =
          'Hiring HN (' +
          fetchProgress.fetched +
          '/' +
          fetchProgress.total +
          ') Please wait until loading is complete. Don\'t scroll'
      } else {
        label = 'Please wait until loading…'
      }
    } else if (lastFetchTotal) {
      label = 'Hiring HN (' + lastFetchTotal + ')'
    }
    $b.find('.lc-hnfb-label').text(label)
    var title = autoOn
      ? 'HN Firebase: auto-reload every 10s (on)'
      : 'HN Firebase: auto-reload every 10s (off)'
    if (scanning) {
      title =
        fetchProgress && fetchProgress.total
          ? 'Please wait until loading — ' +
            fetchProgress.fetched +
            '/' +
            fetchProgress.total +
            ' items'
          : 'Please wait until loading…'
    } else if (lastFetchTotal) {
      title = 'HN Firebase: ' + lastFetchTotal + ' items loaded'
    }
    $b.attr('title', title)
  }

  function setAuto(on) {
    self.dbgbrk(`J001 setAuto ${on}`)
    autoOn = !!on
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (autoOn) {
      runScan()
//      timer = setInterval(runScan, HN_RELOAD_MS)
    }
    syncFbButton()
  }

  function runScan() {
    if (scanning) return
    scanning = true
    syncFbButton()
    scan().then(
      function () {
        if (fetchProgress && fetchProgress.total) {
          lastFetchTotal = fetchProgress.total
        }
        scanning = false
        setAuto(false) // disable auto-reload
      },
      function () {
        scanning = false
        setAuto(false) // disable auto-reload
      }
    )
  }

  function initMenu() {
    if ($('#btnHNFB').length) return
    $('#menu').prepend(
      "<button id='btnHNFB' type='button'><span class='lc-hnfb-icon' aria-hidden='true'></span><span class='lc-hnfb-label'>Hiring HN</span></button>"
    )
    $('#btnHNFB').click(function () {
      setAuto(!autoOn)
      runScan()
    })
    syncFbButton()
  }

  function waitForMainView(cb) {
    var tries = 0
    var t = setInterval(function () {
      if (window.__lcMainView) {
        clearInterval(t)
        cb()
      } else if (++tries > 150) {
        clearInterval(t)
        console.warn('HN Firebase: MainView not ready')
      }
    }, 100)
  }

  $(function () {
    initMenu()
//    waitForMainView(runScan)
  })
}

// plugin: hn firebase api (J001) ]
// ./hn-fb.css [
//:= this.frame('client.css')
#menu #btnHNFB {
  background-color: rgb(255, 102, 0);
  color: #000;
  border: none;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
  font-weight: 700;
}
#menu #btnHNFB:hover,
#menu #btnHNFB:active {
  background-color: rgb(230, 92, 0);
}
#menu #btnHNFB:disabled {
  cursor: wait;
  opacity: 0.92;
}
#menu #btnHNFB:disabled:hover,
#menu #btnHNFB:disabled:active {
  background-color: rgb(255, 102, 0);
}
#menu #btnHNFB .lc-hnfb-icon {
  display: none;
  margin-right: 4px;
  font-size: 14px;
  line-height: 1;
  vertical-align: middle;
}
#menu #btnHNFB .lc-hnfb-icon::before {
  content: '\21BB';
}
#menu #btnHNFB.lc-hnfb-on .lc-hnfb-icon {
  display: inline-block;
  animation: lc-hnfb-spin 1s linear infinite;
}
@keyframes lc-hnfb-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
// ./hn-fb.css ]
