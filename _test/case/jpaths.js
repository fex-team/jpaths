/**
 * Created by wangrui10 on 14-12-16.
 */
module( 'case/jpaths' );

test('列表内没有列表标号的项后退', function () {
        ok(true,"123");
    define('start', function(require) {
        var jpaths = te_jpaths;
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 102]);
        // var path = jpaths();
        //
        window.path = path;
        var x = path.toString();
        console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        equal(x, "m0,0A10,10,0,0,0,10,102", "标记名称1");
    });
    require(['start'], function() {
        console.log('start');
    });
    stop();
    setTimeout(function(){
        var xs = "m0,0A10,10,0,0,0,10,102";
        equal(xs, "m0,0A10,10,0,0,0,10,102", "标记名称2");
        start();
    },100);

});


test('列表内没有列表标号的项后退', function () {
    ok(true,"123");
    define('start', function(require) {
        var jpaths = require('jpaths');
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 10]);
        // var path = jpaths();
        //
        window.path = path;
        var x = path.toString();
        console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        equal(x, "m0,0A10,10,0,0,0,10,10", "标记名称1");
    });
    require(['start'], function() {
        console.log('start');
    });
    stop();
    setTimeout(function(){
        var xs = "m0,0A10,10,0,0,0,10,10";
        equal(xs, "m0,0A10,10,0,0,0,10,10", "标记名称2");
        start();
    },1000);

});