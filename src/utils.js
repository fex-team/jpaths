define(function(require, exports, module) {
    function fix(num) {
        if (num instanceof Array) {
          num.forEach(function(value, i) {
            num[i] = round(value * precisionInverse) / precisionInverse;
            });
        } else {
            num = round(num * precisionInverse) / precisionInverse;
        }
        return num;
    }
    function createPathElement() {
        return document.createElementNS('http://www.w3.org/2000/svg', 'path');
    }
    function point2point(x1, y1, x2, y2) {
        return sqrt(pow(x1- x2, 2) + pow(y1 - y2, 2));
    }
    function binarySearch(array, des) {//用于定位des在array中的确切位置
        var low = 0; 
    　　var high = array.length-1; 
        var middle;

    　　while(low <= high) { 
    　　    middle = (low + high)/2; 

    　　    if(des == array[middle]) { 
    　　        return middle; 
    　　    }else if(des < array[middle]) { 
    　　        high = middle - 1; 
    　　    }else { 
    　　        low = middle + 1; 
    　　    } 
    　　} 
    　　return -1;
    }
    function binarySearch2(array, des) {//用于定位des在array中所在区间的起始位置
        var low = 0; 
    　　var high = array.length-1; 
        var middle;

    　　while(low <= high) { 
    　　    middle = floor((low + high) * 0.5); 

            if (des > array[middle]) {
                low = middle + 1;
            } else if (des <= array[middle]) {
                if (des > (array[middle - 1] || 0)) {
                    return middle;
                } else {
                    high = middle - 1;
                }
            }
    　　} 

    　　return -1;
    }

    var g     = require('../src/geometry'),
        math  = Math,
        sqrt  = math.sqrt,
        pow   = math.pow,
        max   = math.max,
        min   = math.min,
        abs   = math.abs,
        round = math.round,
        sin   = math.sin,
        cos   = math.cos,
        tan   = math.tan,
        atan  = math.atan,
        PI    = math.PI,
        separatorRegExp = /(?!^)\s*,?\s*([+-]?\d+\.?\d*|[a-z])/igm,//用','分隔命令和数字，预处理
        replaceRegExp0  = /,?([a-z]),?/gim, //替换命令符两侧的','
        replaceRegExp1  = /([+-]?\d+\.?\d*)\s([+-]?\d+\.?\d*)(?=\s[a-z]|$)/gim, //仅将当前坐标用','分隔
        replaceRegExp2  = /([+-]?\d+\.?\d*)\s([+-]?\d+\.?\d*)\s*(?=[a-z]|$)/gim, //仅将当前坐标用','分隔, 并且在命令符前断行
        fullcommands    = {M: 'Moveto',
            L: 'Lineto',
            H: 'LinetoHorizontal',
            V: 'LinetoVertical',
            C: 'CurvetoCubic',
            S: 'CurvetoCubicSmooth',
            Q: 'CurvetoQuadratic',
            T: 'CurvetoQuadraticSmooth',
            A: 'Arc'
        },
        precision = 1e-6,
        precisionInverse = round(1 / precision);

    var utils = {
        toString: function(pathOpt) {
            var path = pathOpt.path;

            path = path.replace(separatorRegExp, ',$1');

            switch (pathOpt.opt) {
                case 0:
                    path = path.replace(replaceRegExp0, '$1');
                    break;
                case 1:
                    path = path.replace(/,/g, ' ').replace(replaceRegExp1, '$1,$2');
                    break;
                case 2:
                    path = path.replace(/,/g, ' ').replace(replaceRegExp2, '$1,$2\n');
                    break;
                default:
                    path = path.replace(replaceRegExp0, '$1');
                    break;
            }
            return path;
        },
        toArray: function() {
            if (!arguments.length) return;
            
            var pathElement = createPathElement();
            var path = [].slice.call(arguments).join(' ').replace(/,/g, ' ');
            var result = [], pathArray, i, type, item, param, lareFlag, sweepFlag;

            pathElement.setAttribute('d', path);
            pathArray = pathElement.pathSegList;

            for (i = 0; i < pathArray.length; i++) {
                item = pathArray[i];
                type = item.pathSegTypeAsLetter;

                switch (type.toLowerCase()) {
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
                        lareFlag = item.largeArcFlag ? 1 : 0;
                        sweepFlag = item.sweepFlag ? 1 : 0;
                        param = [item.r1, item.r2, item.angle, lareFlag, sweepFlag, item.x, item.y];
                        break;
                    case 'c':
                        param = [item.x1, item.y1, item.x2, item.y2, item.x, item.y];
                        break;
                    case 'z':
                        param = [];
                        break;
                    default:
                        break;
                }

                param.unshift(type);
                result.push(param);
            }
            return result;
        },
        toRelative: function(path) {
            if (!path) return;

            function set(type) {
                var args = [].slice.call(arguments, 1),
                    rcmd = 'createSVGPathSeg' + type + 'Rel',
                    rseg = pathElement[rcmd].apply(pathElement, args);

                segs.replaceItem(rseg, i);
            }

            var pathElement = createPathElement();
            var x, y, dx, dy, x0, y0, x1, y1, x2, y2, seg, segs, type, i;

            pathElement.setAttribute('d', path);
            segs = pathElement.pathSegList;

            for (x = 0, y = 0, i = 0; i < segs.numberOfItems; i++) {
                seg = segs.getItem(i);
                type = seg.pathSegTypeAsLetter;

                if (/[MLHVCSQTAZz]/.test(type)) {
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

                    switch (type) {
                        case 'M':
                            set(fullcommands[type], dx, dy);
                            break;
                        case 'L':
                            set(fullcommands[type], dx, dy);
                            break;
                        case 'H':
                            set(fullcommands[type], dx);
                            break;
                        case 'V':
                            set(fullcommands[type], dy);
                            break;
                        case 'C':
                            set(fullcommands[type], dx, dy, x1, y1, x2, y2);
                            break;
                        case 'S':
                            set(fullcommands[type], dx, dy, x2, y2);
                            break;
                        case 'Q':
                            set(fullcommands[type], dx, dy, x1, y1);
                            break;
                        case 'T':
                            set(fullcommands[type], dx, dy);
                            break;
                        case 'A':
                            set(fullcommands[type], dx, dy, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag);
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
                if (type == 'M' || type == 'm') {
                    x0 = x;
                    y0 = y;
                }
            }

            return pathElement.getAttribute('d').replace(/Z/g, 'z');
        },
        toAbsolute: function(path) {
            if (!path) return;

            function set(type) {
                var args = [].slice.call(arguments, 1),
                    rcmd = 'createSVGPathSeg' + type + 'Abs',
                    rseg = pathElement[rcmd].apply(pathElement, args);

                segs.replaceItem(rseg, i);
            }

            var pathElement = createPathElement();
            var x, y, dx, dy, x0, y0, x1, y1, x2, y2, seg, segs, type, i;

            pathElement.setAttribute('d', path);
            segs = pathElement.pathSegList;

            for (x = 0, y = 0, i = 0; i < segs.numberOfItems; i++) {
                seg = segs.getItem(i);
                type = seg.pathSegTypeAsLetter;

                if (/[MLHVCSQTA]/.test(type)) {
                    if ('x' in seg) x = seg.x;
                    if ('y' in seg) y = seg.y;
                } else {
                    if ('x1' in seg) x1 = x + seg.x1;
                    if ('x2' in seg) x2 = x + seg.x2;
                    if ('y1' in seg) y1 = y + seg.y1;
                    if ('y2' in seg) y2 = y + seg.y2;
                    if ('x' in seg) x += seg.x;
                    if ('y' in seg) y += seg.y;

                    type = type.toUpperCase();
                    switch (type) {
                        case 'M':
                            set(fullcommands[type], x, y);
                            break;
                        case 'L':
                            set(fullcommands[type], x, y);
                            break;
                        case 'H':
                            set(fullcommands[type], x);
                            break;
                        case 'V':
                            set(fullcommands[type], y);
                            break;
                        case 'C':
                            set(fullcommands[type], x, y, x1, y1, x2, y2);
                            break;
                        case 'S':
                            set(fullcommands[type], x, y, x2, y2);
                            break;
                        case 'Q':
                            set(fullcommands[type], x, y, x1, y1);
                            break;
                        case 'T':
                            set(fullcommands[type], x, y);
                            break;
                        case 'A':
                            set(fullcommands[type], x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag);
                            break;
                        case 'Z':
                            x = x0;
                            y = y0;
                            break;
                    }
                }
                // Record the start of a subpath
                if (type == 'M') {
                    x0 = x;
                    y0 = y;
                }
            }

            return pathElement.getAttribute('d').replace(/z/g, 'Z');
        },
        nodesPos: function(path, x, y) {
            // x, y分别为当前路径的起始点坐标
            var pathElement = createPathElement();
            var x0, y0, type, segs, seg, pos = [], isBreakPoint, i;

            x = x || 0;
            y = y || 0;
            pathElement.setAttribute('d', path);
            segs = pathElement.pathSegList;

            for (i = 0; i < segs.numberOfItems; i++) {
                seg = segs.getItem(i);
                type = seg.pathSegTypeAsLetter;

                isBreakPoint = false;

                if (/[MLHVCSQTA]/.test(type)) {
                    if ('x' in seg) x = seg.x;
                    if ('y' in seg) y = seg.y;
                    if (type === 'M') {
                        isBreakPoint = abs(seg.x - x) > precision || abs(seg.y - y) > precision;
                        x0 = x;
                        y0 = y;
                    }
                } else {
                    if ('x' in seg) x += seg.x;
                    if ('y' in seg) y += seg.y;
                    if (type === 'm') {
                        isBreakPoint = seg.x !== 0 || seg.y !== 0;
                        x0 = x;
                        y0 = y;
                    }
                    if (type == 'z' || type == 'Z') {
                        x = x0;
                        y = y0;
                    }
                }

                pos.push({x: x, y: y, isBreakPoint: isBreakPoint});
            }

            return pos;
        },
        length: function(path, x, y) {
            // x、y为指定路径的起始点，如果有必要的话
            var pathElement = createPathElement();

            x = x || 0;
            y = y || 0;
            
            path = 'M' + x + ',' + y + path;
            pathElement.setAttribute('d', path);

            return pathElement.getTotalLength();
        },
        subPathes: function(path) {
            var nodesPos,
                pathArray,
                sx, sy, x, y, x1, y1, x2, y2, preType, type, type2, len, count = 0, subs = [], pathData, path2;

            path = utils.toAbsolute(path);
            nodesPos = utils.nodesPos(path);
            pathArray = utils.toArray(path);

            pathArray.forEach(function(item, index) {
                type = item[0];
                pathData = item.slice(1);
                x = nodesPos[index].x;
                y = nodesPos[index].y;

                switch(type) {
                    case 'M':
                        break;
                    case 'L':
                    case 'H':
                    case 'V':
                    case 'Z':
                        type2 = 'L';
                        pathData = [x, y];
                        break;
                    case 'A':
                        type2 = type;
                        break;
                    case 'Q':
                        type2 = type;
                        x1 = pathData[0];
                        y1 = pathData[1];
                        break;
                    case 'T':
                        type2 = 'Q';
                        if (preType === 'Q' || preType === 'T') {
                            x1 = 2 * sx - x1;
                            y1 = 2 * sy - y1;
                        } else {
                            x1 = sx;
                            y1 = sy;
                        }
                        pathData.unshift(x1, y1);
                        break;
                    case 'C':
                        type2 = type;
                        x2 = pathData[2];
                        y2 = pathData[3];
                        break;
                    case 'S':
                        type2 = 'C';
                        if (preType === 'C' || preType ==='S') {
                            x1 = 2 * sx - x2;
                            y1 = 2 * sy - y2;
                        } else {
                            x1 = sx;
                            y1 = sy;
                        }
                        x2 = pathData[0];
                        y2 = pathData[1];
                        pathData.unshift(x1, y1);
                        break;
                }

                if (type !== 'M') {
                    path2 = ['M', sx, sy, type2].concat(pathData).toString();
                    path2 = utils.toString({path: path2, opt: 0 }); 
                    len = utils.length(path2, sx, sy);
                    subs.push({path: path2, 
                        type: type, 
                        nomalType: type2,
                        index: index, 
                        count: count++, 
                        normalPathData: pathData, 
                        pathData: item.slice(1),
                        startPoint: [sx, sy], 
                        endPoint: [x, y], 
                        length: len
                    });
                }

                sx = x;
                sy = y;
                preType = type;
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
        at: function(path, position) {
            if (position < 0 || position > totalLength) {
                console.log('position is not in range of the path length');
                return;
            }

            var pathElement = createPathElement();
            var totalLength, dl = 0.5, curPoint, frontPoint, behindPoint, rotate, tangent;

            pathElement.setAttribute('d', path);
            totalLength = pathElement.getTotalLength();
   
            curPoint = pathElement.getPointAtLength(position);

            position = max(position - dl, 0);
            frontPoint = pathElement.getPointAtLength(position);
            frontPoint = (dl >= sqrt(pow(frontPoint.x - curPoint.x, 2) + pow(frontPoint.y - curPoint.y, 2))) ? frontPoint : curPoint; // 考虑断点情况

            position = min(position + dl, totalLength);
            behindPoint = pathElement.getPointAtLength(position);
            behindPoint = (dl >= sqrt(pow(behindPoint.x - curPoint.x, 2) + pow(behindPoint.y - curPoint.y, 2))) ? behindPoint : curPoint;// 考虑断点情况

            rotate = (abs(behindPoint.x - frontPoint.x) > precision) ? atan((behindPoint.y - frontPoint.y) / (behindPoint.x - frontPoint.x)) : 
                (behindPoint.y > frontPoint.y) ? PI * 0.5 : -PI * 0.5;
            tangent = [cos(rotate), sin(rotate)];

            return {
                point: fix([curPoint.x, curPoint.y]),
                tangent: fix(tangent),
                rotate: fix(rotate)
            };
        },
        cut: function(path, position) {
            if (position < 0 || position > utils.length(path)) {
                return;
            } 

            var sp = utils.subPathes(path);
            var ls = utils.lengthes(sp);
            var pl = utils.toArray(path);
            var cp = utils.at(path, position).point;
            var cur = binarySearch2(ls, position);
            var index, type, big, pathData, start, item,
                sub1, sub2, subs, i;
            var n = ls.length;
            var pathString1;
         
            item  = sp[cur];
            index = item.index;
            type  = item.type;
            big   = type.toUpperCase();

            if (type !== big) {
                pathString1 = utils.toAbsolute(item.path);
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
                position1 = min(position + length, ls.slice(-1)[0]);
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

            pathString1 = utils.toString({path: subs[0].toString(), opt: 0});
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
                var cubic, contr1, contr2;

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
                            contr2 = pd.slice(-4, -2);
                            x2 = contr2[0];
                            y2 = contr2[1];
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
                        contr1 = pd.slice(-4, -2);
                        x1 = contr1[0];
                        y1 = contr1[1];

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
                        contr1 = cubic.slice(-4, -2);
                        x1 = contr1[0];
                        y1 = contr1[1];

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
        toCurve: function(pathString) {
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
        },
        transform: function(pathString, matrix) {
            var normalPath = utils.toNormalized(pathString);
            var tran = g.transform;
            var x, y, type;

            normalPath.forEach(function(sub, i) {
                var end  = sub.slice(-2);
                var len  = sub.length;
                var end2, sub2;

                type = sub[0];

                switch(type) {
                    case 'Z':
                        break;
                    case 'M':
                    case 'L':
                        end2 = tran(matrix, end);
                        normalPath[i] = [type].concat(end2);
                        break;
                    case 'C':
                        var p1   = sub.slice(1, 3);
                        var p2   = sub.slice(3, 5);
                        var p11, p21;
 
                        p11  = tran(matrix, p1);
                        p21  = tran(matrix, p2);
                        end2 = tran(matrix, end);
                        normalPath[i] = [type].concat(p11, p21, end2);
                        break;
                }
            });

            return normalPath;
        },
        tween: function(path1, path2, t) {
            if (t < 0 || !t) {
                return path1;
            } else if (t >= 1) {
                return path2;
            }

            var curvePath1 = utils.toCurve(path1);
            var curvePath2 = utils.toCurve(path2);
            var subPathes1  = utils.subPathes(utils.toString({
                path: curvePath1.toString(''),
                opt: 0 
            }));
            var subPathes2  = utils.subPathes(utils.toString({
                path: curvePath2.toString(''),
                opt: 0
            }));
            var n1, n2, type1, type2, step, pathString = '';
            var i, j, index, temp, item;

            if (subPathes1.length > subPathes2.length) {
                temp = subPathes2;
                subPathes2 = subPathes1;
                subPathes1 = temp;
                t  = 1 - t;
            }

            n1 = subPathes1.length;
            n2 = subPathes2.length;

            step = n2 > n1 ? floor(n1 / (n2 - n1)) : 0;
            i = 0;
            while(i < n2 - n1) {
                var end, fill = {};

                index = step * i;
                end = subPathes1[index].endPoint;
                fill.endPoint = end;
                fill.pathData = end.concat(end, end, end);
                subPathes1.splice(index + 1, 0, fill);
                i++;
            }
            for(i = 0; i < n2; i++) {
                var p1, p2, pathData1, pathData2, pathData = [];

                p1 = subPathes1[i];
                p2 = subPathes2[i];
                type1 = p1.type;
                type2 = p2.type;

                if (type2 === 'Z') {
                    pathData2 = g.upgradeBezier(p2.startPoint.concat(p2.endPoint), 3);
                } else {
                    pathData2 = p2.startPoint.concat(p2.pathData);
                }

                if (type1) {
                    if (type1 === 'Z') {
                        pathData1 = g.upgradeBezier(p1.startPoint.concat(p1.endPoint), 3);
                    } else {
                        pathData1 = p1.startPoint.concat(p1.pathData);
                    }
                } else {
                    pathData1 = p1.pathData;
                }

                for(j = 0; j < pathData1.length; j++) {
                    item = round((pathData1[j] + t * (pathData2[j] - pathData1[j])) * 1e6) / 1e6 ;
                    pathData.push(item);
                }

                pathData.splice(2, 0, 'C');
                pathData.unshift('M');

                pathString += utils.toString({
                    path: pathData.toString(''),
                    opt: 1
                });
            }

            return pathString;
        },
        render: function(pathString, svgCanvas) {
            if (svgCanvas) {
                if (svgCanvas.createSVGPathSegMovetoAbs) {
                    svgCanvas.setAttribute('d', pathString);
                } else if (svgCanvas.canvas) {
                    var pathArray = utils.toNormalized(pathString);
                    var ctx = svgCanvas;

                    ctx.strokeStyle = 'blue';
                    ctx.strokeWidth = 1;
                    pathArray.forEach(function(pathData, i) {
                        var data = pathData.slice(1);
                        var type = pathData[0];
                        
                        switch(type) {
                            case 'M':
                                ctx.stroke();
                                ctx.beginPath();
                                ctx.moveTo.apply(ctx, data);
                                break;
                            case 'L':
                                ctx.lineTo.apply(ctx, data);
                                break;
                            case 'C':
                                ctx.bezierCurveTo.apply(ctx, data);
                                break;
                            case 'Z':
                                ctx.closePath();
                                ctx.stroke();
                                break;
                        } 
                    });
                    ctx.stroke();
                }
            } else {
                alert('Make sure where you want to render to is a canvas 2d context or a svg path element!');
            }
        }
    };

    module.exports = utils;
});