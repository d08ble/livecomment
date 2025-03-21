// SOLVED [
// 0.2.23 - 2025-03-21 updated dependencies [
// [+] Moved version history to separate file
// [+] Updated dependencies to newer versions including:
//     - express: ^4.18.2
//     - connect-assets: ^6.0.1
//     - node-watch: ^0.7.3
//     - underscore: ^1.13.6
//     - socket.io: ^4.7.2
// [+] Replaced jade with pug template engine
// [+] Migrated from Jade to Pug template engine
// [+] Deleted old Jade templates and added new Pug templates
// [+] Updated Socket.IO from v1.2.0 to v4.7.4
// [+] Added CHANGELOG.md
// [+] Added .nvmrc for Node.js version management
// 0.2.23 - 2025-03-21 updated dependencies ]

// 0.2.22 [
// Improve livecomment options:
// Start for current dir:
// $ livecomment
// $ livecomment .
// --dangerousCodeExecutionClient is enabled by default and deprecated
// 0.2.22 ]
// 0.2.21 [
// 0.2.21 ]
// 0.2.20 [
// [+] bugfix fast file update by livelogging - add delayed process and config.fileProcessDelay (default 1s)
// 0.2.20 ]
// 0.2.19 [
// [+] update readme
// 0.2.19 ]
// 0.2.18 [
// [+] hihglight slow bugfix. now replace highlightCodeProcess codeOnShow codeOnHide for custom processing in plugins
// [+] fix prism.js tokenize url bug order (!warning, temporrary bugfix)
// [+] iframe plugin
// [+] cli works - bin/livecomment
// 0.2.18 ]
// 0.2.17 [
// [+] fix filterRoute o global var bug
// [+] fix applyFilter config.filterRoute null bug
// 0.2.17 ]
// 0.2.16 [
// [+] add location origin & host
// 0.2.16 ]
// 0.2.15 [
// [+] fix filterRoute dynamic changes with newO
// 0.2.15 ]
// 0.2.14 [
// [-] filterRoute dynamic hostname - fail
// 0.2.14 ]
// 0.2.13 [
// [+] fix filter.location
// 0.2.13 ]
// 0.2.12 [
// [+] add *HIDE* option, see A000-1.x
// [+] fix filterRoute for name -> object.name
// 0.2.12 ]
// 0.2.11 [
// [+] plugins/0/A000.js localhost:3000/plugins
// [+] main view overwrite - config homeIndex: function (req, res)
// [+] queryHash - unique page id for routing
// [+] routing - config filterRoute: function(name, filter) :: bool
// 0.2.11 ]
// 0.2.10 [
// [+] bugfix objname __lcFileCS hash checking
// [+] client htmlEscape fix
// [+] plugins/0 added
// [+] fix analyze sequence queue
// [+] hook beforeSet
// [+] noLogging server watch.skip, watch.scan, object.parsed, exe.emit, exe.frame, exe.onframe, run.eval
// [+] config.noLogging watch.<type> added
// [+] disable process.PORT, use config.port
// [+] speed up networking
// [+] bugfix: scan break when remaining+'\n' > 0
// [+] configure ws port
// [+] code execution client
// [+] code execution server
// [+] reconnect on each message bugfix: socket.io 1.2.0 updated
// [+] tested: add onLoaded event at startup -> send event:'state'
// [+] bugfix: add new object client updateState is wrong
// [+] bugfix: optimized Prism.highlightAll
// [+] bugfix: client scope to end (from begin) fixed
// [+] bugfix: fix crash out of memory while scan binary files (add async logic)
// 0.2.10 ]
// 0.2.9 [
// [+] type 'skip' bugfix
// 0.2.9 ]
// 0.2.8 [
// [+] require scanwatch. config changed (see bin/livecomment)
// 0.2.8 ]
// 0.2.7 [
// [+] added sh pro
// [+] shell scripts highlight
// 0.2.7 ]
// 0.2.6 [
// [+] added acpu heartbeat animation
// 0.2.6 ]
// 0.2.5 [
// [+] added acpul
// 0.2.5 ]
// 0.2.4 [
// [+] fixed objc m mm
// 0.2.4 ]
// 0.2.3 [
// [+] bugfixing - expand on reload page
// 0.2.3 ]
// [+] added state save/restore
// [+] send broadcast event update. livecomment heartbeat
// [+] notify client onChange event
// [+] show source on click
// [+] menu base (on/off ui components, change form)
// [+] add language type to <code...>
// [+] add file filter by ext/type
// [+] prism: fixed escape
// [-] hljs: disabled, using prism (faster)
// [+] client: click $.toggle scope
// [+] show code with hljs
// [+] fixed connectAsset pwd path setup
// [+] added script bin/livecomment
// [+] client view tree base
// [+] code as node_module updated
// [+] "ignore watch scan" paths config
// SOLVED ]
