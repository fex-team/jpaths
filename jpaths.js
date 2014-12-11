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
    var utils = {
        pathTool: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
        toString: function(dataopt) {
            var path = dataopt.path;
            var opt = dataopt.opt;
            var result;

            path = path.replace(/(\d+|[a-z])\s*,?\s*/gim, '$1,').replace(/,$/gm, '');
            switch(opt) {
                case 0:
                    result = path.replace(/\s*,?\s*([a-z])\s*,?\s*/gi, '$1');
                    break;
                case 1:
                    result = path.replace(/,/g, ' ').replace(/(\d+)\s(\d+)(?=\s[a-z]|$)/gim, '$1,$2');
                    break;
                case 2:
                    result = path.replace(/,/g, ' ').replace(/(\d+)\s(\d+)(?=\s[a-z]|$)/gim, '$1,$2').replace(/\s([a-z])/gi, '\\n$1');
                    break;
                default:
                    console.log('unkown type of toString');
                    result = path.replace(/\s*,?\s*([a-z])\s*,?\s*/gi, '$1');
                    break;
            }
            return result;
        },
        toArray: function() {
            var args = [].slice.call(arguments);
            var path = args.length ? args.join(' ').replace(/,/g, ' ') : '';
            var pathTool = utils.pathTool;
            var result = [],
                pathList,
                i,
                letter,
                item;
            pathTool.setAttribute('d', path);
            pathList = pathTool.pathSegList;

            for(i = 0; i < pathList.length; i++) {
                var param = [];
                var large,
                    sweep;
                item = pathList[i];
                letter = item.pathSegTypeAsLetter;
                switch(letter.toLowerCase()) {
                    case 'm':
                    case 'l':
                    case 't':
                        param = [item.x, item.y];
                        break;
                    case 'h':
                        param = [item.x];
                        break;
                    case 'v':
                        param = [item.y];
                        break;
                    case 'q':
                        param = [item.x1, item.y1, item.x, item.y];
                        break;
                    case 's':
                        param = [item.x2, item.y2, item.x, item.y];
                        break;
                    case 'a':
                        large = item.largeArcFlag ? 1 : 0;
                        sweep = item.sweepFlag ? 1 : 0;
                        param = [item.r1, item.r2, item.angle, large, sweep, item.x, item.y];
                        break;
                    case 'c':
                        param = [item.x1, item.y1, item.x2, item.y2, item.x, item.y];
                        break;
                    case 'r':
                        if(item.largeArcFlag != 'undefined') {
                            large = item.largeArcFlag ? 1 : 0;
                            sweep = item.sweepFlag ? 1 : 0;
                            param = [item.r, large, sweep, item.x, item.y];
                        } else {
                            console.log('the r command has not been surported by svg now');
                        }
                        break;
                }
                param.unshift(letter);
                result.push(param);
            }
            return result;
        }
    };

    function Path() {
        var path = [].slice.call(arguments).join('');
        this._path = path ? path : 'M0 0';
        this.pathTool = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path = this.toString() || 'M 0 0';
        this.pathList = this.toArray();
    }
    Path.prototype.append = function() {
        var args = [].slice.call(arguments);
        var apath = utils.toArray(args);
        var pathList = this.pathList;

        apath.forEach(function(item) {
            pathList.push(item);
        });

        this._path += args.join('');
        this.path = this.toString();
        this.pathList = this.toArray();
    };
    Path.prototype.toString = function() {
        var args = [].slice.call(arguments);
        var len = args.length;
        var tag = len === 0 ? 0 :
            args[0] === '%s' ? 1 : 
            args[0] === '%n' ? 2 : 0;
        var result;
            
        switch(tag) {
            case 0:
                result = utils.toString({path: this._path, opt: 0});
                break;
            case 1:
                result = utils.toString({path: this._path, opt: 1});
                break;
            case 2:
                result = utils.toString({path: this._path, opt: 2});
                break;
            default:
                console.log('unkown type of toString');
                result = utils.toString({path: this._path, opt: 0});
        }
        return result;
    };
    Path.prototype.length = function() {
    };
    Path.prototype.toArray = Path.prototype.valueOf =function() {
        var _path = this._path;
       return utils.toArray(_path);
    };
    Path.prototype.toAbsolute = function() {
        pathList = this.pathList;
        var curpos;

        pathList.forEach(function(value, index) {
            var type = value[0];
        });
    };

    module.exports = function(path) {
        return new Path(path);
    };
});