/**

 */
(function () {
    function mySetup() {

        QUnit.readyFlag =0;
        te_jpaths = require('jpaths');
        stop();
        setTimeout(function(){



                QUnit.readyFlag =1;

        },20);

    }

    var _d = function () {

    }
    var s = QUnit.testStart, d = QUnit.testDone;
    QUnit.testStart = function () {
        s.apply(this, arguments);
        mySetup();
    };
    QUnit.testDone = function () {
        _d();
        d.apply(this, arguments);
    }
})();