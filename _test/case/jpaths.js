/**
 * Created by wangrui10 on 14-12-16.
 */
module( 'case/jpaths' );

test('列表内没有列表标号的项后退', function () {
    define('start1', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 102]);
        window.path = path;
        var x = path.toString();
        console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        setTimeout(function(){
            equal(x, "m0,0A10,10,0,0,0,10,102", "标记名称1");
            start();
        },50);
    });
    require(['start1'], function() {
        console.log('start');
    });
    stop();
});


test('列表内没有列表标号的项后退', function () {
    define('start2', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 10]);
        window.path = path;
        var x = path.toString();
        console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        equal(x, "m0,0A10,10,0,0,0,10,10", "标记名称1");
    });
    require(['start2'], function() {
        console.log('start');
    });
    stop();
    setTimeout(function(){
        var xs = "m0,0A10,10,0,0,0,10,10";
        equal(xs, "m0,0A10,10,0,0,0,10,10", "标记名称2");
        start();
    },50);
});

test('列表内没有列表标号的项后退', function () {
    define('start3', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 10]);
        window.path = path;
        var x = path.toString();
        console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        equal(x, "m0,0A10,10,0,0,0,10,10", "标记名称1");
    });
    require(['start3'], function() {
        console.log('start');
    });
    stop();
    setTimeout(function(){
        var xs = "m0,0A10,10,0,0,0,10,10";
        equal(xs, "m0,0A10,10,0,0,0,10,10", "标记名称2");
        start();
    },50);
});