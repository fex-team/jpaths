/**
 * Created by wangrui10 on 14-12-15.
 */
module( 'case/jpaths' );

test('测试 .toString()方法', function () {

    define('start1', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths(['M', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 10]);
            // var path = jpaths();
        var x = path.toString();
        stop();
        setTimeout(function() {

            console.log(x); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
            equal(x, "M0,0A10,10,0,0,0,10,10", ".toString()");

            // x = path.toString('%s');
            // console.log(x);
            // equal(x, 'M 0,0 A 10 10 0 0 0 10,10', ".toString('%s')");

            // x = path.toString('%n');
            // console.log(x);
            // equal(x, 'M 0,0\nA 10 10 0 0 0 10,10', ".toString('%n')");
            // start();
        }, 20);

    });
    require(['start1'], function() {
        console.log('start');
    });
});

test('测试 .toArray() / .valueOf() 方法', function () {

    define('start2', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths('M0,0h3v4L5,6');
        // var path = jpaths();
        //
        var x = path.toArray();
        console.log(x); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
        equal(x, [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]], ".toArray()");

        x = path.valueOf();
        equal(x, [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]], ".valueOf()");
    });
    require(['start2'], function() {
        console.log('start');
    });
});


test('列表内没有列表标号的项后退', function () {
        ok(true,"123");
    define('start3', function(require) {
        var jpaths = require('src/jpaths');
        var path = jpaths(['m', 0, 0, 'A', 10, 10, 0, 0, 0, 10, 10]);
        // var path = jpaths();
        //
        stop();
        setTimeout(function() {
            var x = path.toString();
            console.log(path.toString()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
            equal(x, "m0,0A10,10,0,0,0,10,10", "标记名称1");
            start();
        }, 100);

    });
    require(['start3'], function() {
        console.log('start');
    });
    stop();
    setTimeout(function(){
        var xs = "m0,0A10,10,0,0,0,10,10";
        equal(xs, "m0,0A10,10,0,0,0,10,10", "标记名称2");
        start();
    },100);

});
