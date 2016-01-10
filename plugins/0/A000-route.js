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

//this.dbgbrk('A000');

config.filterRoute = function filterRoute(o, filter) {
  var name = o.name
  console.log(name)
  console.log(filter)
//  console.log(o.objects)

  var removedCount = 0;
  var newObjects = {}
  for (var oid in o.objects) {
    var obj = o.objects[oid]
    obj.lines[0] -= removedCount;
    obj.lines[1] -= removedCount;
    if (oid.indexOf('*HIDE*') != -1) {
      oid = oid.replace('*HIDE*', '(©)')
      removedCount += obj.lines[1] - obj.lines[0];
      o.lines.splice(obj.lines[0], obj.lines[1] - obj.lines[0])
      obj.lines = [obj.lines[0], obj.lines[0] + 1]
    }
    newObjects[oid] = obj
  }

  o.objects = newObjects

  // fix dynamic hostname (bad - filterRoute set once, need another hook)

//  var newObjects= {}
//  for (var oid in o.objects) {
//    var obj = o.objects[oid]
//    for (var i in o.lines) {
//      var line = o.lines[i]
//      line = line.replace('*TEST_HOSTNAME*', filter && filter.location.hostname)
//      o.lines[i] = line+'111'
//    }
/*    console.log('oid='+oid)
    var q = filter && filter.location.hostname
    oid = oid.replace('*TEST_HOSTNAME*', q)
    console.log('AAA='+(filter && filter.location.hostname))
    console.log('q='+q)
    console.log('oid='+oid)
    newObjects[oid] = obj*/
//  }
//  o.objects = newObjects

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

// A000-1.0 test *HIDE* [

// *** this text is hidden by server ***

// A000-1.0 test *HIDE* ]
// A000-1.1 test after hide 0 [
// show this message success!
// A000-1.1 test after hide 0 ]
// A000-1.1 test after hide 1 [
// show this message success!
// A000-1.1 test after hide 1 ]
// A000-2 test hostname [
//  $hostname=*TEST_HOSTNAME*
// A000-2 test hostname ]