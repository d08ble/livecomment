// 0000 [
//:= this.frame('client.exec')
//:= this.frame('server.exec')

console.log('0000-INIT.JS: '+(this.IsLivecommentServer?"server":"client"))
//console.log(this)
//this.dbgbrk('0000.INIT.JS')
// 0000 ]

// client.css - CSS <style> tag [
//:= this.frame('client.exec')

console.log("client.css: setup, use frame('client.exec')")
this.onFrame('client.css', '', 'frame', function() {
  var name = 'client.css.frame: '+htmlEscape(this.object.name)
  this.dbgbrk('client.css frame')
  var a = $("style[name='"+name+"']")
  var style = a.length ? a : $('<style type="text/css" name="'+name+'" />').appendTo('head');
  style.html(this.data);
})
// client.css - CSS <style> tag ]

// client.css - test [
//:= this.frame('client.css')
body {
  background-color: yellow;
}
// client.css - test ]

// 111 client.css - test [
//:= this.frame('client.css')
body {
  background-color: #fff;
}
#menu {
  background-color:#eff;
  border-bottom:5px solid #99f;
}
.scope-name {
  background-color: #0ce;
}
// 111 client.css - test ]
