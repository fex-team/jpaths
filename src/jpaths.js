/*!
 * ====================================================
 * jpaths - v1.0.0 - 2014-12-02
 * https://github.com/fex-team/jpaths
 * GitHub: https://github.com/fex-team/jpaths.git
 * Copyright (c) 2014 Baidu FEX; Licensed BSD
 * ====================================================
 */
define(function(require, exports, module) {

    var utils = require('../src/utils'),
        shapeDefines = {},
        jPaths = {},
        separatorRegExp = /(?!^)\s*,?\s*(\d+\.?\d*|[a-z]+)/gim;//用','分隔命令和数字，预处理
        isCommandRegExp = /^[MLHVCSQTAZ]$/i;//判断自定义path命令是否为svg 原生的path命令
        segCommandRegExp = /[a-z]+(,\d+\.?\d*)+/gmi; //一段命令，包括命令符和参数

    jPaths.version = "0.0.1";


    function Path() {
        var path = [].slice.call(arguments);
        this.set(path);
    }

    Path._ = {};
    Path._.path = 'M0 0';//初始化path值

    Path.prototype.define = function(name, fn) {
        if (isCommandRegExp.test(name)) throw new Error("The name of the shape you define can't be base command of SVG Path.");

        shapeDefines[name] = fn;
    };

    Path.prototype.set = function() {
        if (!arguments.length) throw new Error("The param in the Method set() can't be empty or undefined.");
        
        var path = [].slice.call(arguments).join(',');

        Path._.path = utils.toString({path: path, opt: 0 }); //toDo 添加异常处理
    };

    Path.prototype.append = function() {
        var path = [].slice.call(arguments).toString().replace(separatorRegExp, ',$1');
        var result, path2 = '', type;

        while ((result = segCommandRegExp.exec(path)) !== null) {
            result = result[0];
            type = result.charAt(0);

            if (shapeDefines[type]) {
                path2 += shapeDefines[type].apply(null, result.subString(2).split(','));
            } else {
                path2 += result;
            }
        }
        
        Path._.path += utils.toString({path: path2, opt: 0});
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
                    path: Path._.path,
                    opt: opt
                });
    };
    Path.prototype.toArray = Path.prototype.valueOf = function() {
        var path = Path._.path;
        return utils.toArray(path);
    };
    Path.prototype.toRelative = function() {
        var path = Path._.path;
        return utils.toRelative(path);
    };
    Path.prototype.toAbsolute = function() {
        var path = Path._.path;
        return utils.toAbsolute(path);
    };
    Path.prototype.pathNodePos = function() {
        var path = Path._.path;
        return utils.pathNodePos(path);
    };
    Path.prototype.length = function() {
        var path = Path._.path;
        return utils.pathLength(path, 0, 0);
    };
    Path.prototype.subPathes = function() {
        var path = Path._.path;
        return utils.subPathes(path);
    };
    Path.prototype.lengthes = function() {
        // 用于获取第一段子路径，前两段子路径，..., 直到所有子路径的长度
        // var path = Path._.path;
        var subPathes = this.subPathes();
        return utils.lengthes(subPathes);
    };
    Path.prototype.at = function(position) {
        // position是沿着路径从起点出发的距离
        var path = Path._.path;
        return utils.at(path, position);
    };
    Path.prototype.cut = function(position) {
        var path = Path._.path;
        var subs;
        
        subs = utils.cut(path, position);

        return [new Path(subs[0]),
                new Path(subs[1])
            ];
    };
    Path.prototype.sub = function(position, length) {
        var path = Path._.path;
        var sub = utils.sub(path, position, length);

        return new Path(sub);
    };
    Path.prototype.toNormalized = function() {
        var path = Path._.path;
        var path = utils.toNormalized(path);

        return new Path(path);
    };
    Path.prototype.toCurve = function() {
        var path = Path._.path;
        var path = utils.toCurve(path);

        return new Path(path);
    };
    Path.prototype.transform = function(matrix) {
        var path = Path._.path;
        var path = utils.transform(path, matrix);

        return new Path(path);
    };
    Path.prototype.tween = function(destPath, t) {
        var curPath = Path._.path;
        var path = utils.tween(curPath, destPath, t);

        return new Path(path);
    };
    Path.prototype.render = function(svgCanvas) {
        var path = Path._.path;

        utils.render(path, svgCanvas);
    };

    jPaths = function(path) {
        return new Path(path);
    };
    jPaths.define = Path.prototype.define;

    module.exports = jPaths;

});
