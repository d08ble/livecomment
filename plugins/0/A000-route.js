// A000 [
//:= this.frame('server.exec')

function routeB(req, res, next) {
  res.send('A000');
}
app.get('/b', routeB);

function routeC(req, res, next) {
  res.render('home', {
    title: 'Home',
    queryHash: 'plugins_only'
  });
}
app.get('/c', routeC);
app.get('/plugins', routeC);

this.dbgbrk('A000');

config.filterRoute = function filterRoute(name, filter) {
  console.log(name)

  if (filter && filter.queryHash == 'plugins_only') {
    return name.indexOf('plugins/0/') != -1;
  }
  return true;
}

/*
config.homeIndex = function homeIndex1(req, res) {
  res.render('home', {
    title: 'Home'
  });
};
*/

//console.log(config)
//console.log(config.filterRoute);

// A000 ]
