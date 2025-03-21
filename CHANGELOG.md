# Changelog

## [2.23] - 2024-03-21
### Changed
- Updated version numbering scheme to major.minor format
- Updated dependencies to latest versions
- Migrated from Jade to Pug template engine
- Updated Socket.IO to v4.7.4
- Improved code organization and structure

## [0.2.23] - 2024-03-21
### Changed
- Moved version history to separate file
- Improved code organization

## [0.2.22] - 2024-03-21
### Changed
- Improve livecomment options:
  - Start for current dir:
    - `$ livecomment`
    - `$ livecomment .`
  - `--dangerousCodeExecutionClient` is enabled by default and deprecated

## [0.2.21] - 2024-03-21
- No changes

## [0.2.20] - 2024-03-21
### Fixed
- Fast file update by livelogging - add delayed process and config.fileProcessDelay (default 1s)

## [0.2.19] - 2024-03-21
### Changed
- Update readme

## [0.2.18] - 2024-03-21
### Fixed
- Highlight slow bugfix - now replace highlightCodeProcess codeOnShow codeOnHide for custom processing in plugins
- Prism.js tokenize url bug order (!warning, temporary bugfix)
### Added
- iframe plugin
- CLI works - bin/livecomment

## [0.2.17] - 2024-03-21
### Fixed
- filterRoute o global var bug
- applyFilter config.filterRoute null bug

## [0.2.16] - 2024-03-21
### Added
- Location origin & host

## [0.2.15] - 2024-03-21
### Fixed
- filterRoute dynamic changes with newO

## [0.2.14] - 2024-03-21
### Removed
- filterRoute dynamic hostname (failed)

## [0.2.13] - 2024-03-21
### Fixed
- filter.location

## [0.2.12] - 2024-03-21
### Added
- *HIDE* option (see A000-1.x)
### Fixed
- filterRoute for name -> object.name

## [0.2.11] - 2024-03-21
### Added
- plugins/0/A000.js localhost:3000/plugins
- Main view overwrite - config homeIndex: function (req, res)
- queryHash - unique page id for routing
- routing - config filterRoute: function(name, filter) :: bool

## [0.2.10] - 2024-03-21
### Fixed
- objname __lcFileCS hash checking
- client htmlEscape
- analyze sequence queue
- scan break when remaining+'\n' > 0
- add new object client updateState
- optimized Prism.highlightAll
- client scope to end (from begin)
- crash out of memory while scan binary files (add async logic)
### Added
- plugins/0
- hook beforeSet
- noLogging server watch.skip, watch.scan, object.parsed, exe.emit, exe.frame, exe.onframe, run.eval
- config.noLogging watch.<type>
- configure ws port
- code execution client
- code execution server
- reconnect on each message bugfix: socket.io 1.2.0 updated
- tested: add onLoaded event at startup -> send event:'state'
### Changed
- Disable process.PORT, use config.port
- Speed up networking

## [0.2.9] - 2024-03-21
### Fixed
- type 'skip' bugfix

## [0.2.8] - 2024-03-21
### Changed
- require scanwatch. config changed (see bin/livecomment)

## [0.2.7] - 2024-03-21
### Added
- sh pro
- shell scripts highlight

## [0.2.6] - 2024-03-21
### Added
- acpu heartbeat animation

## [0.2.5] - 2024-03-21
### Added
- acpul

## [0.2.4] - 2024-03-21
### Fixed
- objc m mm

## [0.2.3] - 2024-03-21
### Fixed
- bugfixing - expand on reload page

## Initial Release
### Added
- State save/restore
- Send broadcast event update. livecomment heartbeat
- Notify client onChange event
- Show source on click
- Menu base (on/off ui components, change form)
- Language type to <code...>
- File filter by ext/type
- Client: click $.toggle scope
- Show code with hljs
- Script bin/livecomment
- Client view tree base
- Code as node_module updated
- "ignore watch scan" paths config
### Changed
- Prism: fixed escape
- Fixed connectAsset pwd path setup
### Removed
- hljs: disabled, using prism (faster) 