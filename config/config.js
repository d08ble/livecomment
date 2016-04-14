// DEFAULT CONFIG [
module.exports = {
  dirs: {},

  port: 3070,
  ws_port: 8980,
  debug: false,

  extlangs: {
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
    'sh': 'c'
  },

  noLogging: [
    'watch.skip',
    'watch.scan',
    'object.parsed',
    'exe.emit',
    'exe.frame',
    'exe.onframe',
    'run.eval'
  ],

  filterRoute: null, // function(name, filter) :: bool

//  hooks.beforeSet: function beforeSet(o) {return o;},

  fileProcessDelay: 1000
};
// DEFAULT CONFIG ]
