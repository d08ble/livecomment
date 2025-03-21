var LiveComment = require('livecomment');
var options = {
  port: 3072,
  ws_port: 3073,
  dangerousCodeExecution: ['client', 'server'],
  debug: 1,
  common: {
    ignore: [
//      /.*node_modules.*/,
      /^node_modules.*/,
      /^\.idea.*/,
      /^\.svn.*/,
      /^\.git.*/,

      /^\.old.*/
    ]
  },

  paths: [
    __dirname+'/logs/prev'
  ]

};

options.extlangs = {
  'css': 'css',
  'less': 'css',
  'js': 'javascript',
//    'jade': 'jade',
  'json': 'javascript',

  'hpp': 'cpp',
  'cpp': 'cpp',
  'c': 'c',
  'h': 'cpp',

  'm': 'objectivec',
  'mm': 'objectivec',

  'acpul': 'c',

  'pro': 'c',
  'sh': 'c',

  'log': 'none',
  'txt': 'none',

  'pug': 'pug',
}
var p = 0

options.extractCommentTagFromLine = function extractCommentTagFromLine(fileext, line) {
  line = line.trim();
  // CHECK FORMAT [
  var b;
  function chkfmt(b) {
    if (line.indexOf(b) == 0 && line.indexOf('[') == line.length-1) // begin
      return [line.substr(b.length, line.length-b.length-1).trim(), 0];
    if (line.indexOf(b) == 0 && line.indexOf(']') == line.length-1 && line.indexOf('[') == -1) // end
      return [line.substr(b.length, line.length-b.length-1).trim(), 1];
    return null;
  };
  // CHECK FORMAT ]

  // SUPPORT FORMATS [
  switch (fileext) {
    case '.log':
    case '.txt':
      function chkfmt0() {
        if (line.length > 0 && line.indexOf('[') == line.length-1) {// begin
          return [line.substr(0, line.length-1).trim(), 0];
        }
        if (line.length > 0 && line.indexOf(']') == line.length-1 && line.indexOf('[') == -1) { // end
          return [line.substr(0, line.length-1).trim(), 1];
        }
        return null
      }
      return chkfmt0() || false;
    case '.js':
    case '.java':
    case '.c':
    case '.h':
    case '.cpp':
    case '.hpp':
    case '.less':
    case '.m':
    case '.mm':
      return chkfmt('//') || false;
    case '.css':
      return chkfmt('/*') || false;
    case '.acpul':
    case '.sh':
    case '.py':
    case '.pro':
      return chkfmt('#') || false;
    case '.ejs':
    case '.jade':
    case '.sass':
    case '.styl':
    case '.coffee':
      break;
    case '.pug':
      return chkfmt('//') || false;
    default:
      return null;
  }
  // SUPPORT FORMATS ]
  return false;
}


var livecomment = new LiveComment(options);
