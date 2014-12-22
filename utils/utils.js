define(function(require, exports, module) {
    var g = require('../utils/geometry');
    window.g = g;
    var utils = {
        point2point: function(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1- x2, 2) + Math.pow(y1 - y2, 2));
        },
        toString: function(dataopt) {
            var path0 = dataopt.pathString;
            var opt = dataopt.opt;
            var path, result;

            path = path0.replace(/(\d+\.?\d*|[a-z])\s*,?\s*/gim, '$1,').replace(/,$/gm, '');
            switch (opt) {
                case 0:
                    result = path.replace(/\s*,?\s*([a-z])\s*,?\s*/gim, '$1');
                    break;
                case 1:
                    result = path.replace(/,/g, ' ').replace(/(\d+\.?\d*)\s(\d+\.?\d*)(?=\s[a-z]|$)/gim, '$1,$2');
                    break;
                case 2:
                    result = path.replace(/,/g, ' ').replace(/(\d+\.?\d*)\s(\d+\.?\d*)(?=\s[a-z]|$)/gim, '$1,$2').replace(/\s([a-z])/gim, '\n$1');
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
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var result = [],
                pathList, i, letter, item;

            path.setAttribute('d', pathString);
            pathList = path.pathSegList;

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
            var dx, dy, x0, y0, x1, y1, x2, y2, segs;
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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
            var x0, y0, x1, y1, x2, y2, segs;
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var set = function(type) {
                var args = [].slice.call(arguments, 1),
                    rcmd = 'createSVGPathSeg' + type + 'Abs',
                    rseg = path[rcmd].apply(path, args);

                segs.replaceItem(rseg, i);
            };

            path.setAttribute('d', pathString);
            segs = path.pathSegList;

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
            }

            return path.getAttribute('d').replace(/z/g, 'Z');
        },
        pathNodePos: function(pathString, x, y) {
            // x, y分别为当前路径的起始点坐标
            var x0, y0, type, segs, pos = [], precision = 1e-6, isBreakPoint = 0;/*1 表示true, 0表示false*/
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            x = x ? x : 0;
            y = y ? y : 0;
            path.setAttribute('d', pathString);
            segs = path.pathSegList;

            for (var i = 0, len = segs.numberOfItems; i < len; ++i) {
                var seg = segs.getItem(i),
                    c = seg.pathSegTypeAsLetter;

                isBreakPoint = 0;

                if (/[MLHVCSQTA]/.test(c)) {
                    if (c === 'M') {
                        isBreakPoint = Math.abs(seg.x - x) > precision || Math.abs(seg.y - y) > precision ? 1 : 0;
                    }
                    if ('x' in seg) x = seg.x;
                    if ('y' in seg) y = seg.y;
                } else {
                    if (c === 'm') {
                        isBreakPoint = Math.abs(seg.x) > precision || Math.abs(seg.y) > precision ? 1 : 0;
                    }
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
                pos.push({x: x, y: y, isBreakPoint: isBreakPoint});
            }

            return pos;
        },
        pathLength: function(pathString, x, y) {
            // x、y为指定路径的起始点，如果有必要的话
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            if(typeof x === 'undefined' || typeof y === 'undefined') {
                console.log('用pathLength求路径方法时，注意路径是否有明确的起点。默认以(0, 0)开始');
            }
            x = x ? x : 0;
            y = y ? y : 0;
            
            pathString = 'M' + x + ',' + y + pathString;
            path.setAttribute('d', pathString);

            return path.getTotalLength();
        },
        subPathes: function(pathList, pathNodeXY) {
            //用于获取路径的子路径
            var subs = [];
            var type, big, count = 0;
            var x = pathNodeXY[0].x, y = pathNodeXY[0].y;

            pathList.forEach(function(item, index) {
                var data  = [];
                var start = [];
                var end   = [];
                var pathString;

                type = item[0];
                big  = type.toUpperCase();

                if (big === 'M') {
                    x = pathNodeXY[index].x;
                    y = pathNodeXY[index].y;
                } else if (big === 'Z') {
                    start.push(x, y);
                    pathString = 'M' + x + ',' + y + 'L' + (x = pathNodeXY[index].x) + ',' + (y = pathNodeXY[index].y);
                    end.push(x, y);
                    data.push(x, y);
                    typ = 'L';
                } else {
                    start.push(x, y);
                    pathString = 'M' + x + ',' + y + item.toString('');
                    data = item.slice(1);
                    x = pathNodeXY[index].x;
                    y = pathNodeXY[index].y;
                    end.push(x, y);
                }

                if (pathString) {
                    var pathString2 = utils.toString({
                        pathString: pathString,
                        opt: 0
                    });
                    var length;

                    length = utils.pathLength(pathString2, start[0], start[1]);
                    // length = Math.round(length * 10000) / 10000; 

                    subs.push({pathString: pathString2, type: type, index: index, count: count++, pathData: data, startPoint: start, endPoint: end, length: length});
                }
            });

            return subs;
        },
        lengthes: function(subPathes) {
            var lens = [];
            var sumLen = 0;

            [].forEach.call(subPathes, function(item, index) {
                sumLen += item.length;
                lens.push(sumLen);
            });

            return lens;
        },
        at: function(pathString, position) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var totalLength;

            path.setAttribute('d', pathString);
            totalLength = path.getTotalLength();

            if (position < 0 || position > totalLength) {
                alert('position is not in range of the path length');
            } else {
                var precision = 1e-6, dl = 0.5;
                var p, p1, p2, position1, position2;
                var rotate, tangent, point;

                p = path.getPointAtLength(position);

                position1 = Math.max(position - dl, 0);
                p1 = path.getPointAtLength(position1);
                // 判断是否为断点
                p1 = (dl >= Math.sqrt(Math.pow(p1.x - p.x, 2) + Math.pow(p1.y - p.y, 2))) ? p1 : p;

                position2 = Math.min(position + dl, totalLength);
                p2 = path.getPointAtLength(position2);
                p2 = (dl >= Math.sqrt(Math.pow(p2.x - p.x, 2) + Math.pow(p2.y - p.y, 2))) ? p2 : p;

                rotate = (Math.abs(p2.x - p1.x) > precision) ? Math.atan((p2.y - p1.y) / (p2.x - p1.x)) :
                    (p2.y > p1.y) ? Math.PI * 0.5 : -Math.PI * 0.5;
                tangent = [Math.cos(rotate), Math.sin(rotate)];
                rotate = rotate;
                point = [p.x, p.y];

                return {
                    point: point,
                    tangent: tangent,
                    rotate: rotate
                };
            }
        },
        cut: function(subPathes, lengthes, pathList, position, cutPoint) {
            var sp = subPathes.slice(0),
                ls = lengthes.slice(0),
                pl = pathList.slice(0),
                po = position,
                cp = cutPoint,
                n  = ls.length;

            if (position < 0 || position > ls[n - 1]) {
                return;
            } 

            var stop   = false,
                pathString,
                i, cur, index, type, big, pathData, start, item,
                sub1, sub2, subs;

            for(i = 0; i < n && !stop; i++) {
                if (ls[i] >= position) {
                    cur  = i;
                    stop = !stop;
                }
            }

            item  = sp[cur];
            index = item.index;
            type  = item.type;
            big   = type.toUpperCase();

            if (type !== big) {
                pathString = utils.toAbsolute(item.pathString);
                pathData   = utils.toArray(pathString)[1].slice(1);
            } else {
                pathData   = item.pathData;
            }

            sub1  = pl.slice(0, index);
            sub2  = pl.slice(index + 1);

            start = item.startPoint.slice(0);
            end   = item.endPoint.slice(0);


            if (big == 'S' || big == 'T') {
                var item1, type1, pd1, hx, hy, flag;

                if (cur > 0) {
                        item1 = sp[cur - 1];
                        type1 = item1.type.toUpperCase();
                    }

                flag = (big == 'S' && (type1 === 'S' || type1 === 'C')) ||
                    (big == 'T' && type1 == 'Q');//严格需向前考察

                if (flag) {
                    pd1   = item1.pathData.slice(-4, -2);
                    hx    = 2 * start[0] - pd1[0];
                    hy    = 2 * start[1] - pd1[1];
                    pathData.unshift(hx, hy);
                } else {
                    pathData.unshift(start[0], start[1]);
                }
            }
      
            pathData.unshift(start[0], start[1]);

            var temp1, temp2;
            switch(big) {
                case 'H': 
                case 'V':
                case 'L':
                    sub1.push(['L', cp[0], cp[1]]);
                    sub2.unshift(['M', cp[0], cp[1]], ['L', end[0], end[1]]);
                    break;
                case 'A':
                    subs = g.cutArc(pathData, cp);

                    temp1 = subs[0].slice(2);
                    temp1.unshift(big);
                    sub1.push(temp1);

                    temp2 = subs[1].slice(2);
                    temp2.unshift(big);
                    sub2.unshift(['M', cp[0], cp[1]], temp2);
                    break;
                case 'Q':
                case 'T':
                case 'S':
                case 'C':
                    var t, type2;
                    if (cur > 0) {
                        position -= ls[cur - 1];
  
                    }
                    t      = position / (sp[cur].length);

                    subs   = g.cutBezier(pathData, t);
                    console.log(subs);

                    if(big == 'Q' || big == 'T') {
                        type2 = 'Q';
                    } else {
                        type2 = 'C';
                    }

                    temp1  = subs[0].slice(2);
                    temp1.unshift(type2);
                    sub1.push(temp1);

                    temp2  = subs[1].slice(2);
                    temp2.unshift(type2);

                    var pos1 = subs[1].slice(0, 2);
                    sub2.unshift(['M', pos1[0], pos1[1]], temp2);
            }

            return [sub1, sub2];
        }
    };

    module.exports = utils;
});