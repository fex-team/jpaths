/*!
 * ====================================================
 * jpaths - v1.0.0 - 2014-12-02
 * https://github.com/fex-team/jpaths
 * GitHub: https://github.com/fex-team/jpaths.git
 * Copyright (c) 2014 Baidu FEX; Licensed BSD
 * ====================================================
 */
define(function(require, exports, module) {
    /**
     * 格式化函数
     * @param {String} template 模板
     * @param {Object} json 数据项
     */
    var utils = require('../utils/utils');

    function Path() {
        var pathString = [].slice.call(arguments).join('');

        this._pathString = pathString ? pathString : 'M0 0';
        this.pathString = this.toString() || 'M 0 0';
        this.pathList = this.toArray();
        this.pathNodeXY = this.pathNodePos();
    }
    Path.prototype.append = function() {
        var pathString = [].slice.call(arguments).join('');
        var pathList2,
            pathList1 = this.pathList;
        var pathNodeXY2,
            pathNodeXY = this.pathNodeXY;
        var curPos = [].slice.call(pathNodeXY, -1)[0];
        var letter = pathString.charAt(0);
        var big = letter.toUpperCase();

        // toDo 异常处理   
        if (big === 'H' || big === 'V' || big === 'Z' || letter !== big) {
            this._pathString += pathString;
            pathString = 'M' + curPos.x + ',' + curPos.y + pathString;
            pathString = utils.toString({
                pathString: pathString,
                opt: 0
            });
            pathList2 = utils.toArray(pathString);
            pathList2.shift(0);

            pathNodeXY2 = utils.pathNodePos(pathString, curPos.x, curPos.y);
            pathNodeXY2.shift(0);

            this.pathString += pathString.replace(/M\d+\.?\d+,\d+\.?\d+/, '');
        } else {
            this._pathString += pathString;
            this.pathString += utils.toString({
                pathString: pathString,
                opt: 0
            });
            pathList2 = utils.toArray(pathString);

            pathNodeXY2 = utils.pathNodePos(pathString, curPos.x, curPos.y);
            if( big !== 'M') {
                pathNodeXY2.shift();
            }
        }

        this.pathList = pathList1.concat(pathList2);
        this.pathNodeXY = pathNodeXY.concat(pathNodeXY2);
    };
    Path.prototype.toString = function() {
        var args = [].slice.call(arguments);
        var len = args.length;
        var opt = len === 0 ? 0 :
            args[0] === '%s' ? 1 :
            args[0] === '%n' ? 2 : 0;
        var result;

        return utils.toString({
                    pathString: this._pathString,
                    opt: opt
                });
    };
    Path.prototype.toArray = Path.prototype.valueOf = function() {
        var _pathString = this._pathString;
        return utils.toArray(_pathString);
    };
    Path.prototype.toRelative = function() {
        var pathString = this.pathString;
        return utils.toRelative(pathString);
    };
    Path.prototype.toAbsolute = function() {
        var pathString = this.pathString;
        return utils.toAbsolute(pathString);
    };
    Path.prototype.pathNodePos = function() {
        var pathString = this.pathString;
        return utils.pathNodePos(pathString);
    };
    Path.prototype.length = function() {
        var pathString = this.pathString;
        return utils.pathLength(pathString, 0, 0);
    };
    Path.prototype.subPathes = function() {
        var pathList = this.toArray();
        var pathNodeXY = this.pathNodePos();
        return utils.subPathes(pathList, pathNodeXY);
    };
    Path.prototype.lengthes = function() {
        // 用于获取第一段子路径，前两段子路径，..., 直到所有子路径的长度
        var subPathes = this.subPathes();
        return utils.lengthes(subPathes);
    };
    Path.prototype.at = function(position) {
        // position是沿着路径从起点出发的距离
        var pathString = this.pathString;
        return utils.at(pathString, position);
    };
    Path.prototype.cut = function(position) {
        var sp   = this.subPathes();
        var ls   = this.lengthes();
        var pl   = this.toArray();
        var cp   = this.at(position);
        var subs = utils.cut(sp, ls, pl, position, cp.point);

        return [new Path(subs[0]),
                new Path(subs[1])
            ];
    };
    module.exports = function(path) {
        return new Path(path);
    };
    window.utils = utils;

});