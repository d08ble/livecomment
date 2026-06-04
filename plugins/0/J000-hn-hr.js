// plugin: hn hiring reload (HR) [
//: = this.frame('client.exec')

// pungg10kk@gmail.com


this.dbgbrk('J000 Hacker News Reader')
var self = this

if (!window.__lcHnHr) {
  window.__lcHnHr = true

  var HN_ITEM_URL = 'https://news.ycombinator.com/item?id=48357725'
  var HN_RELOAD_MS = 10000
  var HN_CORS_PROXY = 'https://api.allorigins.win/raw?url='

  var seen = {}

  function htmlToText(html) {
    if (!html) return ''
    var el = document.createElement('div')
    el.innerHTML = html
    return (el.textContent || el.innerText || '').replace(/\s+\n/g, '\n').trim()
  }

  function parseHnHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html')
    var out = []
    var titleEl = doc.querySelector('.titleline')
    var title = titleEl ? htmlToText(titleEl.innerHTML) : ''
    var topEl = doc.querySelector('.toptext')
    var top = topEl ? htmlToText(topEl.innerHTML) : ''
    var postSource = (title + (top ? '\n\n' + top : '')).trim()
    if (postSource) {
      out.push({ name: HN_ITEM_URL, source: postSource })
    }

    var rows = doc.querySelectorAll('tr.athing.comtr')
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i]
      var id = tr.id
      if (!id) continue
      var userEl = tr.querySelector('a.hnuser')
      var user = userEl ? userEl.textContent.trim() : 'unknown'
      var comm = tr.querySelector('.commtext')
      if (!comm) continue
      var text = htmlToText(comm.innerHTML)
      if (!text) continue
      out.push({ name: 'user/' + user + '/' + id, source: text })
    }
    return out
  }

  function fetchHnHtml() {
    self.dbgbrk('J000 fetchHnHtml')
    return fetch(HN_ITEM_URL, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('hn http ' + r.status)
        return r.text()
      })
      .catch(function (err) {
          console.error(err)
          return fetch(HN_CORS_PROXY + encodeURIComponent(HN_ITEM_URL), { cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('proxy http ' + r.status)
            return r.text()
          })
      })
  }

  function pushParsed(objects) {
    var mv = window.__lcMainView
    if (!mv || typeof mv.updateStateObject !== 'function') return false
    for (var i = 0; i < objects.length; i++) {
      var o = objects[i]
      if (seen[o.name] === o.source) continue
      seen[o.name] = o.source
      mv.updateStateObject({ name: o.name }, o.source)
    }
    return true
  }

  function scan() {
    return fetchHnHtml()
      .then(function (html) {
        return pushParsed(parseHnHtml(html))
      })
      .catch(function (e) {
        console.warn('HN HR scan failed:', e)
        return false
      })
  }

  var autoOn = false
  var timer = null
  var scanning = false

  function syncHrButton() {
    var $b = $('#btnHR')
    $b.toggleClass('lc-hr-on', autoOn)
    $b.attr('aria-pressed', autoOn ? 'true' : 'false')
    $b.attr('title', autoOn ? 'HN Hiring: auto-reload every 10s (on)' : 'HN Hiring: auto-reload every 10s (off)')
  }

  function setAuto(on) {
    self.dbgbrk('J000 setAuto')
    autoOn = !!on
    console.log('J000 setAuto', autoOn)
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (autoOn) {
      runScan()
      timer = setInterval(runScan, HN_RELOAD_MS)
    }
    syncHrButton()
  }

  function runScan() {
    console.log('J000 runScan')
    if (scanning) return
    scanning = true
    scan().then(
      function () { scanning = false },
      function () { scanning = false }
    )
  }

  function initMenu() {
    if ($('#btnHR').length) return
    $('#menu').prepend("<button id='btnHR' type='button'><span class='lc-hr-icon' aria-hidden='true'></span>HR</button>")
    $('#btnHR').click(function () {
      setAuto(!autoOn)
      runScan()
    })
    syncHrButton()
  }

  function waitForMainView(cb) {
    var tries = 0
    var t = setInterval(function () {
      if (window.__lcMainView) {
        clearInterval(t)
        cb()
      } else if (++tries > 150) {
        clearInterval(t)
        console.warn('HN HR: MainView not ready')
      }
    }, 100)
  }

  $(function () {
    initMenu()
    waitForMainView(runScan)
  })
}

// plugin: hn hiring reload (HR) ]
// ./hn-hr.css [
//:= this.frame('client.css')
#btnHR {
  background-color: #ff6600;
  color: #000;
  border: none;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
  font-weight: 700;
}
#btnHR:hover {
  background-color: #e65c00;
}
#btnHR .lc-hr-icon {
  display: none;
  margin-right: 4px;
  font-size: 14px;
  line-height: 1;
  vertical-align: middle;
}
#btnHR .lc-hr-icon::before {
  content: '\21BB';
}
#btnHR.lc-hr-on .lc-hr-icon {
  display: inline-block;
  animation: lc-hr-spin 1s linear infinite;
}
@keyframes lc-hr-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
// ./hn-hr.css ]
