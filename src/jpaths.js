/*!
 * ====================================================
 * jpaths - v1.0.0 - 2014-12-02
 * https://github.com/fex-team/jpaths
 * GitHub: https://github.com/fex-team/jpaths.git
 * Copyright (c) 2014 Baidu FEX; Licensed BSD
 * ====================================================
 */
define(function(require, exports, module) {

    var utils = require('../src/utils');
    var shapeDefines = {};
    var jPaths = {};
    var separatorRegExp = /(?!^)\s*,?\s*([+-]?\d+\.?\d*|[a-z]+)/igm;//用','分隔命令和数字，预处理
    var isCommandRegExp = /^[MLHVCSQTAZ]$/i;//判断自定义path命令是否为svg 原生的path命令
    var segCommandRegExp = /[a-z]+(,[+-]?\d+\.?\d*)*/igm; //一段命令，包括命令符和参数

    function Path() {
        var path = [].slice.call(arguments).join(',');

        this.init(path || 'M0 0');
    }

    Path.prototype.define = function(name, fn) {
        if (isCommandRegExp.test(name)) throw new Error("The name of the shape you define can't be base command of SVG Path.");

        shapeDefines[name] = fn;
    };

    Path.prototype.init = function(path) {
        // if (!arguments.length) throw new Error("The param in the Method set() can't be empty or undefined.");
        this._ = {};
        this._.path = utils.toString({path: path, opt: 0 }); //toDo 添加异常处理
        this._.path1 = utils.toString({path: path, opt: 1});
        this._.path2 = utils.toString({path: path, opt: 2});
        this._.pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._.pathElement.setAttribute('d', this._.path);
        this._.hasChanged = false;
    };

    Path.prototype.append = function() {
        if (!arguments.length) return;

        var path = [].slice.call(arguments).toString().replace(separatorRegExp, ',$1');
        var result, path2 = '', type;

        while ((result = segCommandRegExp.exec(path)) !== null) {
            result = result[0].split(',');
            type = result[0];

            if (shapeDefines[type]) {
                path2 += shapeDefines[type].apply(null, result.slice(1));
            } else {
                path2 += result;
            }
        }
        
        this._.path += utils.toString({path: path2, opt: 0});
        this._.path1 += utils.toString({path: path2, opt: 1});
        this._.path2 += utils.toString({path: path2, opt: 2});
        this._.pathElement.setAttribute('d', this._.path);
        this._.hasChanged = true;
        // 添加异常处理;
    };
    Path.prototype.toString = function(opt) {
        opt = !opt ? '' : opt === '%s' ? 1 : opt === '%n' ? 2 : '';
        return this._['path' + opt]; 
    };
    Path.prototype.toArray = Path.prototype.valueOf = function() {
        var that = this;
        return utils.toArray(that._.path, that._.pathElement);
    };
    Path.prototype.toRelative = function() {
        var that = this;
        return utils.toRelative(that._.path);
    };
    Path.prototype.toAbsolute = function() {
        var that = this;
        that._.absPath = utils.toAbsolute(that._.path);
        return that._.absPath;
    };
    Path.prototype.nodesPos = function() {
        var that = this;
        that._.nodesPos = utils.nodesPos(that._.path);
        return that._.nodesPos;
    };
    Path.prototype.length = function() {
        var that = this;
        that._.length = utils.length(that._.path);
        return that._.length;
    };
    Path.prototype.lengthes = function() {
        // 用于获取第一段子路径，前两段子路径，..., 直到所有子路径的长度
        var that = this;
        var subPathes = this.subPathes();
        that._.lengthes = utils.lengthes(subPathes);
        return that._.lengthes;
    };
    Path.prototype.subPathes = function() {
        var that = this;
        return utils.subPathes(that._.path);
    };
    Path.prototype.at = function(position) {
        // position是沿着路径从起点出发的距离
        var that = this;
        return utils.at(that._.path, position);
    };
    Path.prototype.cut = function(position) {
        var that = this;
        var subs = utils.cut(that._.path, position);

        return [new Path(subs[0]), new Path(subs[1]) ]; 
    };
    Path.prototype.sub = function(position, length) {
        var that = this;
        var sub = utils.sub(that._.path, position, length);

        return new Path(sub);
    };
    Path.prototype.toNormalized = function() {
        var that = this;
        var path = utils.toNormalized(that._.path);

        return new Path(path);
    };
    Path.prototype.toCurve = function() {
        var that = this;
        var path = utils.toCurve(that._.path);

        return new Path(path);
    };
    Path.prototype.transform = function(matrix) {
        var that = this;
        var path = utils.transform(that._.path, matrix);

        return new Path(path);
    };
    Path.prototype.tween = function(destPath, t) {
        var that = this;
        var path = utils.tween(that._.path, destPath, t);

        return new Path(path);
    };
    Path.prototype.render = function(svgCanvas) {

        var that = this;
        utils.render(that._.path, svgCanvas);
    };

    jPaths = function(path) {
        return new Path(path);
    };

    jPaths.version = "0.0.1";
    jPaths.define = Path.prototype.define;

    module.exports = jPaths;

});
