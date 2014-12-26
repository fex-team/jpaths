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
        var pathString = [].slice.call(arguments);
        this.set(pathString);
    }

    Path.prototype.set = function() {
        var pathString = [].slice.call(arguments).join(',');

        pathString = pathString || 'M0 0';
        this.pathString = utils.toString({
            pathString: pathString,
            opt: 0
        }); 
        //toDo 添加异常处理
    };

    Path.prototype.append = function() {
        // var pathString = [].slice.call(arguments).join('');
        // var pathList2,
        //     pathList1 = this.toArray();
        // var pathNodeXY2,
        //     pathNodeXY = this.pathNodePos();
        // var curPos = [].slice.call(pathNodeXY, -1)[0];
        // var letter = pathString.charAt(0);
        // var big = letter.toUpperCase();

        // pathString = 'M' + curPos.x + ',' + curPos.y + pathString;
        // pathString = utils.toString({
        //     pathString: pathString,
        //     opt: 0
        // });

        // this.pathString += pathString.replace(/M\d+\.?\d+,\d+\.?\d+/, '');
        var pathString1 = [].slice.call(arguments).toString();
        var pathString  = this.pathString;

        this.set(pathString, pathString1);
        // 添加异常处理;
    };
    Path.prototype.toString = function() {
        var args = [].slice.call(arguments);
        var len = args.length;
        var opt = len === 0 ? 0 :
            args[0] === '%s' ? 1 :
            args[0] === '%n' ? 2 : 0;
        var result;

        return utils.toString({
                    pathString: this.pathString,
                    opt: opt
                });
    };
    Path.prototype.toArray = Path.prototype.valueOf = function() {
        var pathString = this.pathString;
        return utils.toArray(pathString);
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
        var pathString = this.pathString;
        return utils.subPathes(pathString);
    };
    Path.prototype.lengthes = function() {
        // 用于获取第一段子路径，前两段子路径，..., 直到所有子路径的长度
        // var pathString = this.pathString;
        var subPathes = this.subPathes();
        return utils.lengthes(subPathes);
    };
    Path.prototype.at = function(position) {
        // position是沿着路径从起点出发的距离
        var pathString = this.pathString;
        return utils.at(pathString, position);
    };
    Path.prototype.cut = function(position) {
        var pathString = this.pathString;
        var subs;
        
        subs = utils.cut(pathString, position);

        return [new Path(subs[0]),
                new Path(subs[1])
            ];
    };
    Path.prototype.sub = function(position, length) {
        var pathString = this.pathString;
        var sub = utils.sub(pathString, position, length);

        return new Path(sub);
    };
    Path.prototype.toNormalized = function() {
        var pathString = this.pathString;
        var path = utils.toNormalized(pathString);
        
        return new Path(path);
    };
    Path.prototype.toCurve = function() {
        var pathString = this.pathString;
        var path = utils.toCurve(pathString);
        
        return new Path(path);
    };
    module.exports = function(path) {
        return new Path(path);
    };

});