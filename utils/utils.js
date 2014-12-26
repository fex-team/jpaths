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
        subPathes: function(pathString) {
            //用于获取路径的子路径
            var subs = [];
            var type, count = 0;
            var pathString1 = utils.toAbsolute(pathString);
            var pathNodeXY = utils.pathNodePos(pathString1);
            var pathList = utils.toArray(pathString1);
            var x = pathNodeXY[0].x, y = pathNodeXY[0].y;
            var sx, sy, x1, y1, x2, y2, preType;

            pathList.forEach(function(item, index) {
                var data  = item.slice(1);
                var start = [];
                var end   = [];
                var pathString2, c1, c2;

                type = item[0];

                x = pathNodeXY[index].x;
                y = pathNodeXY[index].y;

                switch(type) {
                    case 'M':
                        break;
                    case 'L':
                    case 'H':
                    case 'V':
                        pathString2 = ['M', sx, sy, 'L'].concat([x, y]).toString();
                        break;
                    case 'Z':
                        pathString2 = ['M', sx, sy, 'L'].concat([x, y]).toString();
                        break;
                    case 'A':
                        pathString2 = ['M', sx, sy, 'A'].concat(data).toString();
                        break;
                    case 'Q':
                        x1 = data[0];
                        y1 = data[1];

                        pathString2 = ['M', sx, sy, 'Q'].concat(data).toString();
                        break;
                    case 'T':
                        if (preType === 'Q' || preType === 'T') {
                            x1 = 2 * sx - x1;
                            y1 = 2 * sy - y1;
                        } else {
                            x1 = sx;
                            y1 = sy;
                        }

                        pathString2 = ['M', sx, sy, 'Q', x1, y1].concat(data).toString();
                        break;
                    case 'C':
                        x2 = data[2];
                        y2 = data[3];

                        pathString2 = ['M', sx, sy, 'C'].concat(data).toString();
                        break;
                    case 'S':
                        if (preType === 'C' || preType ==='S') {
                            x1 = 2 * sx - x2;
                            y1 = 2 * sy - y2;
                        } else {
                            x1 = sx;
                            y1 = sy;
                        }

                        x2 = data[0];
                        y2 = data[1];

                        pathString2 = ['M', sx, sy, 'C', x1, y1].concat(data).toString();
                        break;
                }

                start.push(sx, sy);
                end.push(x, y);
                sx = x;
                sy = y;
                preType = type;

                if (pathString2) {
                    var pathString3 = utils.toString({
                        pathString: pathString2,
                        opt: 0
                    });
                    var length = utils.pathLength(pathString3, start[0], start[1]);

                    subs.push({pathString: pathString3, type: type, index: index, count: count++, pathData: data, startPoint: start, endPoint: end, length: length});


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
                return;
            }
   
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
        },
        cut: function(pathString, position) {
            var sp = utils.subPathes(pathString);
            var ls = utils.lengthes(sp);
            var pl = utils.toArray(pathString);
            var p0 = position;
            var cp = utils.at(pathString, position).point;
            var n = ls.length;

            if (position < 0 || position > ls[n - 1]) {
                return;
            } 

            var stop   = false,
                pathString1,
                i, cur = 0, index, type, big, pathData, start, item,
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
                pathString1 = utils.toAbsolute(item.pathString);
                pathData   = utils.toArray(pathString1)[1].slice(1);
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
        },
        sub: function(pathString, position, length) {
            var sp = utils.subPathes(pathString);
            var ls = utils.lengthes(sp);
            var position1, subs, subs1, pathString1;

            if (length) {
                position1 = Math.min(position + length, ls.slice(-1)[0]);
            } else {
                var n = ls.length;
                var stop = false, i, cur;

                for(i = 0; i < n && !stop; i++) {
                    if (ls[i] >= position) {
                        cur  = i;
                        stop = !stop;
                    }
                }

                position1 = ls[cur];
            }

            subs = utils.cut(pathString, position1);

            pathString1 = utils.toString({pathString: subs[0].toString(), opt: 0});
            sub1 = utils.cut(pathString1, position);

            return sub1[1];
        },
        toNormalized: function(pathString) {
            var pathString1 = utils.toAbsolute(pathString);//先转化为绝对路径
            var subPathes = utils.subPathes(pathString1);
            var path = [];
            var x, y, preType, x2, y2, x1, y1;

            subPathes.forEach(function(item, index) {
                var type = item.type;
                var start = item.startPoint;
                var end = item.endPoint;
                var pd = item.pathData;
                var cubic, c1, c2;

                if (x !== start[0] || y !== start[1]) {
                    path.push(['M', start[0], start[1]]);
                    preType = 'M';
                }

                x = start[0];
                y = start[1];

                switch(type) {
                    case 'L':
                    case 'C':
                        if (type === 'C') {
                            c2 = pd.slice(-4, -2);
                            x2 = c2[0];
                            y2 = c2[1];
                        }

                        path.push([type].concat(pd));
                        preType = type;
                        break;
                    case 'Z':
                        path.push([type]);
                        preType = type;
                        break;
                    case 'H':
                    case 'V':
                        path.push(['L'].concat(end));
                        preType = 'L';
                        break;
                    case 'Q':
                        c1 = pd.slice(-4, -2);
                        x1 = c1[0];
                        y1 = c1[1];

                        cubic = g.upgradeBezier(start.concat(pd), 3);
                        path.push(['C'].concat(cubic.slice(2)));

                        preType = 'Q';//后边跟T时有用
                        break;
                    case 'S':
                        if (preType === 'C') {
                            x2 = 2 * x - x2;
                            y2 = 2 * y - y2;
                        } else {
                            x2 = x;
                            y2 = y;
                        }
                        path.push(['C', x2, y2].concat(pd));
                        preType = 'C';
                        break;
                    case 'T':
                        if (preType === 'Q') {
                            x1 = 2 * x - x1;
                            y1 = 2 * y - y1;
                        } else {
                            x1 = x;
                            y1 = y;
                        }
              
                        cubic = g.upgradeBezier(start.concat([x1, y1]).concat(pd), 3);
                        c1 = cubic.slice(-4, -2);
                        x1 = c1[0];
                        y1 = c1[1];

                        path.push(['C'].concat(cubic.slice(2)));

                        preType = 'Q';//后边跟T时有用
                        break;
                    case 'A':
                        var cubics = [];
                        var i;

                        cubic = g.arc2curv(start.concat(pd));
                   
                        for (i = 0;i < cubic.length / 6; i ++) {
                            cubics.push(cubic.slice(i * 6, (i + 1) * 6));
                        }

                        cubics.forEach(function(cubic, i) {
                            path.push(['C'].concat(cubic));
                        });
                        preType = 'A';
                        break;
                    default:
                        console.log('unkown path command');
                        break;
                }

                x = end[0];
                y = end[1];

            });
           
            return path;
        },
        toCurve : function(pathString) {
            var normalPath = utils.toNormalized(pathString);
            var x, y, x0, y0;

            normalPath.forEach(function(sub, i) {
                var type = sub[0];
                var pathData = sub.slice(1);
                var end = sub.slice(-2);

                if (type === 'M') {
                    x0 = x = end[0];
                    y0 = y = end[1];
                } else if (type === 'Z'){
                    x = x0;
                    y = y0;
                } else if (type === 'L'){
                    if (type == 'L') {
                        var bezier = g.upgradeBezier([x, y].concat(end), 3);

                        normalPath[i] = ['C'].concat(bezier.slice(2));
                    }
                    x = end[0];
                    y = end[1];
                }
            });

            return normalPath;
        }
    };

    module.exports = utils;
});