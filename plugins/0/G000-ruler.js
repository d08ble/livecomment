// ruler plugin [
//:= this.frame('client.exec')

this.dbgbrk('G000 ruler plugin')

if (!window.__lcRuler) {
  window.__lcRuler = true
  window.__lcRulerInstances = []
  window.__lcRulerPending = {}

  var _LS_PFX = 'lcRuler_'
  var _P0 = '///!@#~~'

  window.LcRuler = function LcRuler(container, config) {
    var self = this
    this.config = config
    this.id = config.id || 'ruler_' + Math.random().toString(36).substr(2, 9)
    this.title = config.title || ''
    this.unit = config.unit || ''
    this.cursor = config.cursor != null ? config.cursor : null
    this.prevCursor = this.cursor
    this.cursorExtra = null
    this.prevCursorExtra = null
    this.markers = config.markers || []

    var dataMin = config.min != null ? config.min : 0
    var dataMax = config.max != null ? config.max : 1000
    this.dataMin = dataMin
    this.dataMax = dataMax
    this.hasZero = dataMin <= 0 && dataMax >= 0

    var posMin = dataMin > 0 ? dataMin : 1
    var posMax = dataMax > 0 ? dataMax : 1
    this.minPow = Math.floor(Math.log10(posMin))
    this.maxPow = Math.ceil(Math.log10(posMax))
    if (this.maxPow <= this.minPow) this.maxPow = this.minPow + 1
    this.totalSegments = this.maxPow - this.minPow + (this.hasZero ? 1 : 0)

    this.rulerH = 114
    this.markerH = 18

    this.viewOffset = 0
    this.viewSegments = Math.min(this.totalSegments, 5)
    this.selectedMarker = -1
    this.hoverMarker = -1

    try {
      var saved = JSON.parse(localStorage.getItem(_LS_PFX + this.id))
      if (saved) {
        if (saved.vo != null) this.viewOffset = saved.vo
        if (saved.sm != null) this.selectedMarker = saved.sm
      }
    } catch (e) {}

    this.$el = $('<div class="lc-ruler" data-ruler-id="' + this.id + '"></div>')
    this.$titleBar = $('<div class="lc-ruler-titlebar"></div>').text(this.title)
    this.$flagL = $('<div class="lc-ruler-flag lc-ruler-flag-l">&lt;</div>')
    this.$flagR = $('<div class="lc-ruler-flag lc-ruler-flag-r">&gt;</div>')
    this.$canvasWrap = $('<div class="lc-ruler-canvas-wrap"></div>')
    this.$canvas = $('<canvas class="lc-ruler-canvas"></canvas>')
    this.$note = $('<div class="lc-ruler-note">\u00a0</div>')
    this.$midRow = $('<div class="lc-ruler-mid"></div>')

    this.$midRow.append(this.$flagL).append(this.$canvasWrap).append(this.$flagR)
    this.$canvasWrap.append(this.$canvas)
    this.$el.append(this.$titleBar).append(this.$midRow).append(this.$note)
    $(container).append(this.$el)

    this.canvas = this.$canvas[0]
    this.ctx = this.canvas.getContext('2d')
    this.canvasW = 800
    this.hoverX = null
    this.dragging = false
    this.dragStartX = 0
    this.dragStartOffset = 0
    this.animFrame = null

    this._onWheel = function (e) { self.onWheel(e) }
    this._onMouseDown = function (e) { self.onMouseDown(e) }
    this._onMouseMove = function (e) { self.onMouseMove(e) }
    this._onMouseUp = function (e) { self.onMouseUp(e) }
    this._onClick = function (e) { self.onClick(e) }
    this._onMouseLeave = function () { self.onMouseLeave() }
    this._onResize = function () { self.resize(); self.render() }

    this.canvas.addEventListener('wheel', this._onWheel, { passive: false })
    this.canvas.addEventListener('mousedown', this._onMouseDown)
    this.canvas.addEventListener('mousemove', this._onMouseMove)
    this.canvas.addEventListener('mouseleave', this._onMouseLeave)
    this.canvas.addEventListener('click', this._onClick)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('resize', this._onResize)

    this.$flagL.css('visibility', 'hidden')
    this.$flagR.css('visibility', 'hidden')

    this.resize()
    this.render()
    this.updateNote()

    window.__lcRulerInstances.push(this)
  }

  var P = window.LcRuler.prototype

  P.destroy = function () {
    this.canvas.removeEventListener('wheel', this._onWheel)
    this.canvas.removeEventListener('mousedown', this._onMouseDown)
    this.canvas.removeEventListener('mousemove', this._onMouseMove)
    this.canvas.removeEventListener('mouseleave', this._onMouseLeave)
    this.canvas.removeEventListener('click', this._onClick)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('resize', this._onResize)
    if (this.animFrame) cancelAnimationFrame(this.animFrame)
    this.$el.remove()
  }

  P.save = function () {
    try {
      localStorage.setItem(_LS_PFX + this.id, JSON.stringify({
        vo: this.viewOffset, sm: this.selectedMarker
      }))
    } catch (e) {}
  }

  P.resize = function () {
    var w = this.$canvasWrap.width() || 800
    var dpr = window.devicePixelRatio || 1
    this.canvas.width = w * dpr
    this.canvas.height = this.rulerH * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = this.rulerH + 'px'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.canvasW = w
  }

  P.valueToX = function (v) {
    var seg, frac
    var minBase = Math.pow(10, this.minPow)
    if (v <= 0) {
      seg = 0; frac = 0
    } else if (this.hasZero && v < minBase) {
      seg = 0; frac = v / minBase
    } else {
      var n = Math.floor(Math.log10(v))
      if (n < this.minPow) n = this.minPow
      if (n >= this.maxPow) n = this.maxPow - 1
      var base = Math.pow(10, n)
      frac = (v - base) / (base * 9)
      if (frac < 0) frac = 0
      if (frac > 1) frac = 1
      seg = n - this.minPow + (this.hasZero ? 1 : 0)
    }
    return (seg + frac - this.viewOffset) / this.viewSegments * this.canvasW
  }

  P.xToValue = function (x) {
    var pos = (x / this.canvasW) * this.viewSegments + this.viewOffset
    if (pos < 0) pos = 0
    if (pos > this.totalSegments) pos = this.totalSegments
    var si = Math.floor(pos)
    var frac = pos - si
    if (this.hasZero) {
      if (si === 0) return frac * Math.pow(10, this.minPow)
      si -= 1
    }
    var base = Math.pow(10, this.minPow + si)
    return base + frac * base * 9
  }

  P.clampOffset = function (off) {
    var mx = this.totalSegments - this.viewSegments
    if (mx < 0) mx = 0
    return Math.max(0, Math.min(mx, off))
  }

  function _fmtVal(v, unit) {
    var a = Math.abs(v), s = ''
    if (a === 0) s = '0'
    else if (a >= 100) s = v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    else if (a >= 1) s = v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
    else if (a >= 0.01) s = v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
    else s = v.toExponential(1)
    return unit ? s + ' ' + unit : s
  }

  function _powLabel(p) {
    var v = Math.pow(10, p)
    if (p >= 6) return (v / 1e6) + 'M'
    if (p >= 3) return (v / 1e3) + 'k'
    if (p >= 0) return '' + v
    return v.toFixed(-p)
  }

  P.render = function () {
    var ctx = this.ctx, w = this.canvasW, h = this.rulerH
    ctx.clearRect(0, 0, w, h)

    var tickY = h - this.markerH - 2 - 50
    var majH = 20, midH = 12, minH = 6

    ctx.strokeStyle = '#888'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, tickY)
    ctx.lineTo(w, tickY)
    ctx.stroke()

    var s0 = Math.floor(this.viewOffset)
    var s1 = Math.ceil(this.viewOffset + this.viewSegments)
    if (s1 > this.totalSegments) s1 = this.totalSegments

    for (var s = s0; s <= s1; s++) {
      var x = (s - this.viewOffset) / this.viewSegments * w
      if (x < -80 || x > w + 80) continue

      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x, tickY)
      ctx.lineTo(x, tickY - majH)
      ctx.stroke()

      var lbl
      if (this.hasZero && s === 0) {
        lbl = '0'
      } else {
        var pi = s - (this.hasZero ? 1 : 0) + this.minPow
        lbl = _powLabel(pi)
      }
      ctx.fillStyle = '#ccc'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(lbl, x, tickY - majH - 4)

      if (s < s1) {
        var xn = (s + 1 - this.viewOffset) / this.viewSegments * w
        var segPx = xn - x
        for (var t = 1; t < 10; t++) {
          var tx = x + (t / 10) * segPx
          if (tx < -5 || tx > w + 5) continue
          var th = t === 5 ? midH : minH
          ctx.strokeStyle = t === 5 ? '#777' : '#555'
          ctx.lineWidth = t === 5 ? 1 : 0.5
          ctx.beginPath()
          ctx.moveTo(tx, tickY)
          ctx.lineTo(tx, tickY - th)
          ctx.stroke()
        }
      }
    }

    for (var m = 0; m < this.markers.length; m++) {
      this._drawMarker(m, tickY)
    }

    if (this.cursor != null) {
      var cx = this.valueToX(this.cursor)
      if (cx >= -5 && cx <= w + 5) {
        var cUp = this.prevCursor != null ? this.cursor >= this.prevCursor : true
        var cColor = cUp ? '#44ff44' : '#ff4444'
        ctx.save()
        ctx.strokeStyle = cColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, tickY - majH - 12)
        ctx.lineTo(cx, tickY + 2)
        ctx.stroke()
        ctx.fillStyle = cColor
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(_fmtVal(this.cursor, this.unit), cx, tickY - majH - 16)
        if (this.cursorExtra != null) {
          var eUp = this.prevCursorExtra != null ? this.cursorExtra >= this.prevCursorExtra : true
          ctx.fillStyle = eUp ? '#44ff44' : '#ff4444'
          ctx.font = 'bold 9px monospace'
          ctx.fillText(this.cursorExtra.toFixed(3) + ' km/s', cx, tickY - majH - 28)
        }
        ctx.restore()
      }
      this._updateFlags()
    }

    if (this.hoverX != null) {
      var hx = this.hoverX
      var hv = this.xToValue(hx)
      ctx.save()
      ctx.strokeStyle = '#ff8800'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(hx, tickY - majH - 12)
      ctx.lineTo(hx, tickY + 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ff8800'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(_fmtVal(hv, this.unit), hx, tickY + 16)
      ctx.restore()
    }
  }

  P._drawMarker = function (idx, tickY) {
    var ctx = this.ctx
    var mk = this.markers[idx]
    var mx = this.valueToX(mk.value)
    if (mx < -30 || mx > this.canvasW + 30) return
    var sel = idx === this.selectedMarker
    var hov = idx === this.hoverMarker
    var my = tickY + 2, mh = this.markerH - 4, mw = 8

    ctx.fillStyle = sel ? '#ff6600' : hov ? '#ffaa44' : '#4488ff'
    ctx.beginPath()
    ctx.moveTo(mx, my)
    ctx.lineTo(mx - mw / 2, my + mh)
    ctx.lineTo(mx + mw / 2, my + mh)
    ctx.closePath()
    ctx.fill()

    if (mk.label) {
      ctx.fillStyle = sel ? '#ff8833' : '#6699cc'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      var lx = Math.max(30, Math.min(this.canvasW - 30, mx))
      ctx.fillText(mk.label, lx, my + mh + 10)
    }
  }

  P._hitMarker = function (x, y) {
    var best = -1, bestDist = 20
    for (var i = 0; i < this.markers.length; i++) {
      var mx = this.valueToX(this.markers[i].value)
      var dx = Math.abs(x - mx)
      if (dx < bestDist) { bestDist = dx; best = i }
    }
    return best
  }

  P.onClick = function (e) {
    var r = this.canvas.getBoundingClientRect()
    var hit = this._hitMarker(e.clientX - r.left, e.clientY - r.top)
    if (hit >= 0) {
      this.selectedMarker = this.selectedMarker === hit ? -1 : hit
    } else {
      this.selectedMarker = -1
    }
    this.save()
    this.render()
    this.updateNote()
  }

  P.onMouseMove = function (e) {
    if (this.dragging) return
    var r = this.canvas.getBoundingClientRect()
    var mx = e.clientX - r.left
    var hit = this._hitMarker(mx, e.clientY - r.top)
    this.hoverX = mx
    if (hit !== this.hoverMarker) {
      this.hoverMarker = hit
      this.canvas.style.cursor = hit >= 0 ? 'pointer' : 'grab'
      this.updateNote()
    }
    this.render()
  }

  P.onMouseLeave = function () {
    this.hoverX = null
    if (this.hoverMarker >= 0) {
      this.hoverMarker = -1
      this.updateNote()
    }
    this.render()
  }

  P.onWheel = function (e) {
    e.preventDefault()
    this.viewOffset = this.clampOffset(this.viewOffset + (e.deltaY > 0 ? 0.3 : -0.3))
    this.save()
    this._raf()
  }

  P.onMouseDown = function (e) {
    if (e.button !== 0) return
    var r = this.canvas.getBoundingClientRect()
    if (this._hitMarker(e.clientX - r.left, e.clientY - r.top) >= 0) return
    this.dragging = true
    this.dragStartX = e.clientX
    this.dragStartOffset = this.viewOffset
    this.canvas.style.cursor = 'grabbing'
    e.preventDefault()
  }

  P.onMouseUp = function () {
    if (!this.dragging) return
    this.dragging = false
    this.canvas.style.cursor = 'grab'
    this.save()
  }

  P._raf = function () {
    var self = this
    if (this.animFrame) return
    this.animFrame = requestAnimationFrame(function () {
      self.animFrame = null
      self.render()
    })
  }

  P.updateNote = function () {
    var isHover = this.hoverMarker >= 0
    var idx = isHover ? this.hoverMarker : this.selectedMarker
    if (idx >= 0 && idx < this.markers.length) {
      var mk = this.markers[idx]
      var t = (mk.label || '') + ': ' + _fmtVal(mk.value, this.unit)
      if (mk.note) t += ' \u2014 ' + mk.note
      this.$note.text(t)
      this.$note.css('color', isHover ? '#ffaa44' : '#ff6600')
    } else {
      this.$note.html('\u00a0')
      this.$note.css('color', '#4488ff')
    }
  }

  P.showNote = P.updateNote

  P._updateFlags = function () {
    var cUp = this.prevCursor != null ? this.cursor >= this.prevCursor : true
    if (cUp) {
      this.$flagR.css('visibility', 'visible')
      this.$flagL.css('visibility', 'hidden')
    } else {
      this.$flagL.css('visibility', 'visible')
      this.$flagR.css('visibility', 'hidden')
    }
  }

  P.updateCursor = function (v, extra) {
    this.prevCursor = this.cursor; this.cursor = v
    if (extra !== undefined) { this.prevCursorExtra = this.cursorExtra; this.cursorExtra = extra }
    this._raf()
  }
  P.updateMarkers = function (m) { this.markers = m; this.render() }

  window.addEventListener('mousemove', function (e) {
    for (var i = 0; i < window.__lcRulerInstances.length; i++) {
      var r = window.__lcRulerInstances[i]
      if (r.dragging) {
        var dx = e.clientX - r.dragStartX
        r.viewOffset = r.clampOffset(r.dragStartOffset - dx / (r.canvasW / r.viewSegments))
        r._raf()
      }
    }
  })

  executor.on('afterElementUpdate', function ($el) {
    var pending = window.__lcRulerPending
    for (var objName in pending) {
      var cfg = pending[objName]
      var parts = objName.split(_P0)
      var nodeName = parts[parts.length - 1]

      $el.find('.node-name').each(function () {
        var txt = $(this).text().trim()
        if (txt.indexOf(nodeName) !== 0) return
        var $node = $(this).closest('.node')
        if ($node.find('.lc-ruler[data-ruler-id="' + cfg.id + '"]').length) return
        var padLeft = parseInt(this.style.paddingLeft, 10) || 0
        var $slot = $('<div class="lc-ruler-slot" style="padding-left:' + (padLeft + 10) + 'px"></div>')
        var lsKey = _LS_PFX + cfg.id + '_vis'
        var hidden = false
        try { hidden = localStorage.getItem(lsKey) === '0' } catch (e) {}
        var $btn = $('<span class="lc-ruler-toggle" title="Toggle ruler"></span>')
        $btn.text(hidden ? '\u25b6' : '\u25bc')
        var $label = $(this).find('.lc-node-name-label')
        var $target = $label.length ? $label : $(this)
        if (!$target.find('.lc-ruler-toggle').length) $target.append($btn)
        if (hidden) $slot.hide()
        $btn.on('click', function (ev) {
          ev.stopPropagation()
          var vis = $slot.is(':visible')
          if (vis) { $slot.hide(); $btn.text('\u25b6') } else { $slot.show(); $btn.text('\u25bc') }
          try { localStorage.setItem(lsKey, vis ? '0' : '1') } catch (e) {}
        })
        $(this).after($slot)
        new window.LcRuler($slot[0], cfg)
      })
    }
    window.__lcRulerPending = {}
    return $el
  })
}

for (var _ri = 0; _ri < window.__lcRulerInstances.length; _ri++) {
  window.__lcRulerInstances[_ri].destroy()
}
window.__lcRulerInstances = []
window.__lcRulerPending = {}

this.onFrame('ruler', '', 'frame', function () {
  try {
    var raw = this.data.trim()
    if (!raw) return
    var config = JSON.parse(raw)
    window.__lcRulerPending[this.object.name] = config
  } catch (e) {
    console.log('ruler: parse error', e, this.data)
  }
})

// ruler plugin ]
// ruler.css [
//:= this.frame('client.css')
.lc-ruler-slot {
  width: 50%;
  padding-top: 0;
  padding-right: 0;
  padding-bottom: 0;
  margin: 0;
  box-sizing: border-box;
}
.lc-ruler {
  position: relative;
  margin: 0 0 2px 0;
  background: transparent;
  user-select: none;
  -webkit-user-select: none;
  width: 100%;
}
.lc-ruler-titlebar {
  padding: 2px 10px;
  font: 11px/1.4 monospace;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lc-ruler-mid {
  display: flex;
  align-items: center;
}
.lc-ruler-flag {
  flex: 0 0 16px;
  width: 16px;
  text-align: center;
  font: bold 14px/1 monospace;
  animation: lc-ruler-blink 1.5s step-end infinite;
}
.lc-ruler-flag-l { color: #ff4444; }
.lc-ruler-flag-r { color: #44ff44; }
@keyframes lc-ruler-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.lc-ruler-canvas-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.lc-ruler-canvas {
  display: block;
  width: 100%;
  cursor: grab;
}
.lc-ruler-toggle {
  display: inline-block;
  margin-left: 6px;
  cursor: pointer;
  font-size: 9px;
  color: #666;
  vertical-align: middle;
}
.lc-ruler-toggle:hover {
  color: #ff8800;
}
.lc-ruler-note {
  padding: 4px 10px;
  font: 11px/1.4 sans-serif;
  color: purple !important;
  background: transparent;
  margin: 2px 10px 4px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.4em;
}
// ruler.css ]
// ruler: artemis ii distance [
//:= this.frame('ruler')
 {"id":"artemis-ii","title":"Artemis II \u2014 Distance from Earth (km)","unit":"km","min":0,"max":400000,"cursor":219945,"markers":[{"value":0,"label":"Earth","note":"Launch \u2014 Kennedy Space Center, FL"},{"value":408,"label":"ISS","note":"International Space Station orbit altitude ~408 km"},{"value":35786,"label":"GEO","note":"Geostationary orbit altitude 35,786 km"},{"value":219945,"label":"Artemis II","note":"Moon mission Artemis II \u2014 Outbound Coast, 219,945 km"},{"value":384400,"label":"Moon","note":"Average Earth\u2013Moon distance 384,400 km"}]}
// ruler: artemis ii distance ]
// ruler: llm memory [
//:= this.frame('ruler')
 {"id":"llm-memory","title":"LLM Model Size \u2014 Memory (GB)","unit":"GB","min":0,"max":100000,"cursor":3200,"markers":[{"value":0.5,"label":"GPT-2","note":"GPT-2 117M \u2014 ~0.5 GB memory"},{"value":3,"label":"LLaMA-7B","note":"LLaMA 7B params \u2014 ~3 GB (int4)"},{"value":26,"label":"LLaMA-70B","note":"LLaMA 70B params \u2014 ~26 GB (int4)"},{"value":328,"label":"BLOOM-176B","note":"BLOOM 176B \u2014 328 GB (fp16) \u2014 HuggingFace BigScience, trained 384\u00d7A100"},{"value":350,"label":"GPT-3","note":"GPT-3 175B params \u2014 ~350 GB (fp16)"},{"value":628,"label":"Grok-1","note":"xAI Grok-1 314B MoE \u2014 ~628 GB (fp16)"},{"value":800,"label":"LLaMA-405B","note":"Meta LLaMA 3.1 405B dense \u2014 ~800 GB (fp16)"},{"value":960,"label":"Arctic-480B","note":"Snowflake Arctic 480B MoE 128 experts \u2014 ~960 GB (fp16)"},{"value":1280,"label":"Ling-1T","note":"Ant Ling-2.5 1T MoE \u2014 1,280 GB (bf16) on 16\u00d7H100 \u2014 largest open-source"},{"value":1700,"label":"GPT-4","note":"GPT-4 est. ~1.8T MoE \u2014 ~1,700 GB (fp16)"},{"value":2000,"label":"DeepSeek-V4","note":"DeepSeek V4 1T MoE 32B active \u2014 ~2,000 GB (bf16 full weights)"},{"value":3200,"label":"Switch-1.6T","note":"Google Switch Transformer 1.6T \u2014 3,200 GB (fp16) \u2014 MAX on HuggingFace google/switch-c-2048"},{"value":6400,"label":"Switch-fp32","note":"Switch Transformer 1.6T fp32 \u2014 6,400 GB (6.4 TB) \u2014 ABSOLUTE MAX single model memory"}]}
// ruler: llm memory ]
// ruler: artemis ii live proxy [
//:= this.frame('server.exec')
var https = require('https')
function _fetchJSON(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'LiveComment/1.0' } }, function (r) {
    var body = ''
    r.on('data', function (c) { body += c })
    r.on('end', function () {
      try { cb(null, JSON.parse(body)) } catch (e) { cb(e) }
    })
  }).on('error', cb)
}
app.get('/api/artemis', function (req, res) {
  _fetchJSON('https://artemis-ii-tracker.com/api/artemis/trajectory', function (err, d) {
    if (err) return res.status(500).json({ error: err.message })
    var out = {}
    if (d.distanceFromEarth_km != null) out.distEarth = Math.round(d.distanceFromEarth_km)
    if (d.distanceFromMoon_km != null) out.distMoon = Math.round(d.distanceFromMoon_km)
    if (d.velocity_kms != null) out.speed = d.velocity_kms
    if (d.phase) out.phase = d.phase
    if (d.missionElapsedSeconds != null) {
      var s = d.missionElapsedSeconds, dd = s / 86400 | 0, hh = (s % 86400) / 3600 | 0, mm = (s % 3600) / 60 | 0
      out.met = 'MET T+' + dd + 'd ' + (hh < 10 ? '0' : '') + hh + 'h ' + (mm < 10 ? '0' : '') + mm + 'm'
    }
    if (d.commsDelay_sec != null) out.commsDelay = d.commsDelay_sec
    out.ts = Date.now()
    res.json(out)
  })
})
// ruler: artemis ii live proxy ]
// ruler: artemis ii live [
//:= this.frame('ruler')
 {"id":"artemis-live","title":"Artemis II LIVE \u2014 Distance from Earth (km)","unit":"km","min":0,"max":1000000,"cursor":219945,"markers":[{"value":0,"label":"Earth","note":"Launch \u2014 Kennedy Space Center, FL"},{"value":160,"label":"Karman","note":"K\u00e1rm\u00e1n line \u2014 edge of space 100 mi / 160 km"},{"value":408,"label":"ISS","note":"ISS orbit altitude ~408 km"},{"value":2000,"label":"Van Allen","note":"Van Allen inner belt begins ~2,000 km"},{"value":35786,"label":"GEO","note":"Geostationary orbit 35,786 km"},{"value":219945,"label":"Orion NOW","note":"LIVE position \u2014 Outbound Coast, 1.38 km/s"},{"value":384400,"label":"Moon","note":"Average Earth\u2013Moon distance 384,400 km"}]}
// ruler: artemis ii live ]
// ruler: artemis ii live poll [
//:= this.frame('client.exec')
(function () {
  var RULER_ID = 'artemis-live'
  var POLL_MS = 10000
  if (window.__artemisLivePoll) clearInterval(window.__artemisLivePoll)
  window.__artemisLivePoll = setInterval(function () {
    var inst = null
    for (var i = 0; i < window.__lcRulerInstances.length; i++) {
      if (window.__lcRulerInstances[i].id === RULER_ID) { inst = window.__lcRulerInstances[i]; break }
    }
    if (!inst) return
    fetch('https://artemis-ii-tracker.com/api/artemis/trajectory').then(function (r) { return r.json() }).then(function (d) {
      var _km3 = function (v) { return v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) }
      var dist = d.distanceFromEarth_km
      if (dist != null) {
        inst.updateCursor(dist, d.velocity_kms != null ? d.velocity_kms : undefined)
        var mk = null
        for (var j = 0; j < inst.markers.length; j++) {
          if (inst.markers[j].label === 'Orion NOW') { mk = inst.markers[j]; break }
        }
        if (mk) {
          mk.value = dist
          var note = 'LIVE ' + _km3(dist) + ' km from Earth'
          if (d.distanceFromMoon_km != null) note += ', ' + _km3(d.distanceFromMoon_km) + ' km to Moon'
          if (d.velocity_kms != null) note += ' | ' + d.velocity_kms + ' km/s'
          if (d.phase) note += ' | ' + d.phase
          mk.note = note
          inst.render()
          inst.updateNote()
        }
        inst.$titleBar.text('Artemis II LIVE \u2014 ' + _km3(dist) + ' km from Earth')
      }
    }).catch(function () {})
  }, POLL_MS)
})()
// ruler: artemis ii live poll ]
