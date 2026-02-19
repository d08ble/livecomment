// plugin: ai [
//:= this.frame('client.exec')

this.dbgbrk('I000 ai plugin')

// add menu button for AI [
if (!$('#btnAI').length) {
  $('#menu').prepend("<button id='btnAI' title='AI'>🤖 AI</button>")
  $('#btnAI').click(function(e) {
    // TODO: AI functionality
    console.log('AI button clicked')
  })
}
// add menu button for AI ]

// plugin: ai ]
// ./ai.css [
//:= this.frame('client.css')
#btnAI {
  background-color: #9c27b0;
  color: white;
  border: none;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
}
#btnAI:hover {
  background-color: #7b1fa2;
}
// ./ai.css ]
