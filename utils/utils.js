define(function(require, exports, module) {
    var utils = {
        pathTool: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
        toString: function(dataopt) {
            var path = dataopt.pathString;
            var opt = dataopt.opt;
            var result;

            path = path.replace(/(\d+|[a-z])\s*,?\s*/gim, '$1,').replace(/,$/gm, '');
            switch (opt) {
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
            var pathString = args.length ? args.join(' ').replace(/,/g, ' ') : '';
            var pathTool = utils.pathTool;
            var result = [],
                pathList, i, letter, item;

            pathTool.setAttribute('d', pathString);
            pathList = pathTool.pathSegList;

            for (i = 0; i < pathList.length; i++) {
                var param = [];
                var large, sweep;

                item = pathList[i];
                letter = item.pathSegTypeAsLetter;
                switch (letter.toLowerCase()) {
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
                }
                param.unshift(letter);
                result.push(param);
            }
            return result;
        },
        toRelative: function(pathString) {
            var dx, dy, x0, y0, x1, y1, x2, y2, segs,
                path = utils.pathTool;
            var set = function(type) {
                var args = [].slice.call(arguments, 1),
                    rcmd = 'createSVGPathSeg' + type + 'Rel',
                    rseg = path[rcmd].apply(path, args);

                segs.replaceItem(rseg, i);
            };
            path.setAttribute('d', pathString);
            segs = path.pathSegList;

            for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; i++) {
                var seg = segs.getItem(i),
                    c = seg.pathSegTypeAsLetter;

                if (/[MLHVCSQTAZz]/.test(c)) {
                    if ('x1' in seg) {
                        x1 = seg.x1 - x;
                    }
                    if ('x2' in seg) {
                        x2 = seg.x2 - x;
                    }
                    if ('y1' in seg) {
                        y1 = seg.y1 - y;
                    }
                    if ('y2' in seg) {
                        y2 = seg.y2 - y;
                    }
                    if ('x' in seg) {
                        dx = -x + (x = seg.x);
                    }
                    if ('y' in seg) {
                        dy = -y + (y = seg.y);
                    }
                    switch (c) {
                        case 'M':
                            set('Moveto', dx, dy);
                            break;
                        case 'L':
                            set('Lineto', dx, dy);
                            break;
                        case 'H':
                            set('LinetoHorizontal', dx);
                            break;
                        case 'V':
                            set('LinetoVertical', dy);
                            break;
                        case 'C':
                            set('CurvetoCubic', dx, dy, x1, y1, x2, y2);
                            break;
                        case 'S':
                            set('CurvetoCubicSmooth', dx, dy, x2, y2);
                            break;
                        case 'Q':
                            set('CurvetoQuadratic', dx, dy, x1, y1);
                            break;
                        case 'T':
                            set('CurvetoQuadraticSmooth', dx, dy);
                            break;
                        case 'A':
                            set('Arc', dx, dy, seg.r1, seg.r2, seg.angle,
                                seg.largeArcFlag, seg.sweepFlag);
                            break;
                        case 'Z':
                        case 'z':
                            x = x0;
                            y = y0;
                            break;
                    }
                } else {
                    if ('x' in seg) x += seg.x;
                    if ('y' in seg) y += seg.y;
                }
                // store the start of a subpath
                if (c == 'M' || c == 'm') {
                    x0 = x;
                    y0 = y;
                }
            }

            return path.getAttribute('d').replace(/Z/g, 'z');
        },
        toAbsolute: function(pathString) {
            var x0, y0, x1, y1, x2, y2, segs,
                path = utils.pathTool;
            var set = function(type) {
                var args = [].slice.call(arguments, 1),
                    rcmd = 'createSVGPathSeg' + type + 'Abs',
                    rseg = path[rcmd].apply(path, args);

                segs.replaceItem(rseg, i);
            };

            path.setAttribute('d', pathString);
            segs = path.pathSegList;

            var pos = [];
            for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; ++i) {
                var seg = segs.getItem(i),
                    c = seg.pathSegTypeAsLetter;
                if (/[MLHVCSQTA]/.test(c)) {
                    if ('x' in seg) x = seg.x;
                    if ('y' in seg) y = seg.y;
                } else {
                    if ('x1' in seg) x1 = x + seg.x1;
                    if ('x2' in seg) x2 = x + seg.x2;
                    if ('y1' in seg) y1 = y + seg.y1;
                    if ('y2' in seg) y2 = y + seg.y2;
                    if ('x' in seg) x += seg.x;
                    if ('y' in seg) y += seg.y;
                    switch (c) {
                        case 'm':
                            set('Moveto', x, y);
                            break;
                        case 'l':
                            set('Lineto', x, y);
                            break;
                        case 'h':
                            set('LinetoHorizontal', x);
                            break;
                        case 'v':
                            set('LinetoVertical', y);
                            break;
                        case 'c':
                            set('CurvetoCubic', x, y, x1, y1, x2, y2);
                            break;
                        case 's':
                            set('CurvetoCubicSmooth', x, y, x2, y2);
                            break;
                        case 'q':
                            set('CurvetoQuadratic', x, y, x1, y1);
                            break;
                        case 't':
                            set('CurvetoQuadraticSmooth', x, y);
                            break;
                        case 'a':
                            set('Arc', x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag);
                            break;
                        case 'z':
                        case 'Z':
                            x = x0;
                            y = y0;
                            break;
                    }
                }
                // Record the start of a subpath
                if (c == 'M' || c == 'm') {
                    x0 = x;
                    y0 = y;
                }
                pos.push([x,y]);
            }
            console.log(pos);

            return path.getAttribute('d').replace(/z/g, 'Z');
        },
        pathNodePos: function(pathString, x, y) {
            var x0, y0, segs, pos = [],
                path = utils.pathTool;

            x = x ? x : 0;
            y = y ? y : 0;
            path.setAttribute('d', pathString);
            segs = path.pathSegList;

            for (var i = 0, len = segs.numberOfItems; i < len; ++i) {
                var seg = segs.getItem(i),
                    c = seg.pathSegTypeAsLetter;

                if (/[MLHVCSQTA]/.test(c)) {
                    if ('x' in seg) x = seg.x;
                    if ('y' in seg) y = seg.y;
                } else {
                    if ('x' in seg) x += seg.x;
                    if ('y' in seg) y += seg.y;
                    if (c == 'z' || c == 'Z') {
                            x = x0;
                            y = y0;
                    }
                }
                // Record the start of a subpath
                if (c == 'M' || c == 'm') {
                    x0 = x;
                    y0 = y;
                }
                pos.push({x: x, y: y});
            }

            return pos;
        }
    };

    module.exports = utils;
});