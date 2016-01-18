// plugin: url iframe preview [
//:= this.frame('client.exec')

// todo: screenshot/dom/api for X-Frame-Options sites
// http://phantomjs.org/screen-capture.html

this.dbgbrk('B000 url iframe preview')

codeOnShow = function ($code) {
  if (!$($code).attr('highlighted')) {
    Prism.highlightElement($code)
    $($code).attr('highlighted', true)
    var $a = $($code).find('a')
    $a.after("<button class='url-iframe-preview-button'>Preview</button>")
    var $buttons = $($code).find('.url-iframe-preview-button')
    $buttons.click(function (e) {
      var $prev = $(e.target).prev()
      var url = $prev.attr('href')
      var $next = $(e.target).next()
      if (!$next.is('iframe')) {
        $(e.target).after("<iframe class='url-iframe-preview-frame' src='"+url+"'></iframe>")
      }
      else {
        $($next).remove()
      }
    })
  }
}
codeOnHide = function ($code) {
  // hide iframe
}
// plugin: url iframe preview ]
// ./iframe.css [
//:= this.frame('client.css')
.url-iframe-preview-button {
  width: 70px;
  background-color: #4285f4;
  border: none;
  margin-left: 20px;
}
.url-iframe-preview-frame {
  width: calc(100% - 40px);
  height: 480px;
  display: block;
  margin-top: 10px;
  background-color: white;
}
// ./iframe.css ]
