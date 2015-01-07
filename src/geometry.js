define(function(require, exports, module) {
    var g = {};

    // 0 私有函数
    // 

    /**
     * [cutData 分割相邻数据<辅助>, 私有方法，不暴露]
     * @param  {[Num]} t [分割的位置，[0, 1]]
     * @return {[function]}   [分割函数]
     */
    function _cutData(t) {
        return function(p, q) {
            return p + t * (q - p);
        };
    }

    /**
     * [pRotate2P 点绕点旋转后的新点<辅助> 暂不暴露]
     * @param  {[Array]} pointArray [中心点和旋转点的坐标集]
     * @param  {[Num]} beta       [逆时针旋转的角度，负值表示顺时针旋转(弧度制)]
     * @example
     *
     *   e1:
     *   var r = _pRotate2P([0, 0, 1, 0], Math.PI / 4);
     *   // 返回: [0.7071, 0.7071];
     *
     *   e2:
     *   var r = _pRotate2P([0, 0, 1, 0], -3 * Math.PI / 4);
     *   // 返回: [-0.7071, -0.7071];   
     *
     * @return {[Array]}            [新点坐标集]
     */
    function _pRotate2P(pointArray, beta) {
        var c   = pointArray.slice(0, 2),
            m   = pointArray.slice(2, 4),
            dx  = -c[0],// 中心点平移到原点的x位移
            dy  = -c[1],// 中心点平移到原点的y位移
            sin = Math.sin(beta),
            cos = Math.cos(beta),
            x0  = m[0] + dx,// 旋转点平移后的x
            y0  = m[1] + dy;// 旋转点平移后的y
        var x1, y1;

        beta = beta || 0;
        x1   = x0 * cos - y0 * sin;// 向量旋转
        y1   = x0 * sin + y0 * cos;

        x1  -= dx;// 平移回去
        y1  -= dy;
        
        x1   = x1 - dx;//保留四位有效数字，去掉多余零
        y1   = y1 - dy;

        return [x1, y1];
    }

    /**
     * [getArcCenter 获取椭圆弧的圆心]
     * @param  {[Array]} arcPointArray  [圆弧上取互异三点的坐标集]
     * @param  {[Num]} rx               [长半轴]
     * @param  {[Num]} ry               [短半轴]
     * @param  {[Num]} x_axis_rotation  [椭圆逆时针旋转的角度，负值为顺，弧度]
     * @example
     *
     *   e1:
     *   var deg = Math.PI / 4,
     *       cos = Math.cos(deg), sin = Math.sin(deg),
     *       rx  = 2, ry  = 1,
     *       pointArray = [3 - rx * cos,3 - rx * sin,3 - ry * cos,3 + ry * sin, 3 + rx * cos, 3 + rx * sin];
     *   var a   = getArcCenter(pointArray, rx, ry, deg); 
     *   // 返回: [3, 3];
     *
     *   e2:
     *   var pointArray = [-2, 0, 0, 1, 2, 0];
     *   var a   = getArcCenter(pointArray, 2, 1, 0); 
     *   // 返回: [0, 0];
     *
     * @return {[Array]}                [圆心坐标集]
     */
    function getArcCenter(arcPointArray, rx, ry, x_axis_rotation) {
        var ap   = arcPointArray,
            beta = x_axis_rotation || 0,
            cos  = Math.cos(beta),
            sin  = Math.sin(beta),
            x1   = ap[0],
            y1   = ap[1],
            x2   = ap[2],
            y2   = ap[3],
            x3   = ap[4],
            y3   = ap[5], 
            k    = rx * rx / (ry * ry), 
            m1, m2, a, b, c, c10, c11, c20, c21, c1, c0, t;
            
        //求第一组参数
        c10 = x1 * cos + y1 * sin;
        c11 = y1 * cos - x1 * sin;
        c20 = x2 * cos + y2 * sin;
        c21 = y2 * cos - x2 * sin;
        c0  = c10 - c20;
        c1  = c11 - c21;

        a = k * c1 * sin - c0 * cos;
        b = -k * c1 * cos - c0 * sin;
        c = -0.5 * (c0 * (c10 + c20) + k * c1 * (c11 + c21));
        m1= [a, b, c];

        //求第二组参数
        c20 = x3 * cos + y3 * sin;
        c21 = y3 * cos - x3 * sin;
        c0  = c10 - c20;
        c1  = c11 - c21;

        a = k * c1 * sin - c0 * cos;
        b = -k * c1 * cos - c0 * sin;
        c = -0.5 * (c0 * (c10 + c20) + k * c1 * (c11 + c21));
        m2= [a, b, c];

        t = m1[0] * m2[1] - m2[0] * m1[1];
        x = (m1[2] * m2[1] - m2[2] * m1[1]) / t;
        y = (-m1[2] * m2[0] + m2[2] * m1[0]) / t;

        return [x, y];
    }

    g.getArcCenter = getArcCenter;

    /**
     * [sweepAngular 向量1逆时针旋转至向量2扫过的角度]
     * @param  {[Array]} pointArray [中心点、起点1、终点2的坐标集]
     * @example
     *
     *    var s = sweepAngular([0,0,-2,0,0,1]); //向量(-2, 0)逆时针转至向量(0,1)扫过的角度
     *    // 返回: 270
     *
     * @return {[Num]}              [扫过的角度，角度制]
     */
    function sweepAngular(pointArray) {
        var p  = pointArray,
            v1 = [p[2] - p[0], p[3] - p[1]],
            v2 = [p[4] - p[0], p[5] - p[1]],
            l1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]),
            l2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]),
            pi = Math.PI,
            ang1, ang2, ang;

        ang1 = Math.acos(v1[0] / l1);
        ang1 = v1[1] > 0 ? ang1 : pi * 2 - ang1;

        ang2 = Math.acos(v2[0] / l2);
        ang2 = v2[1] > 0 ? ang2 : pi * 2 - ang2;

        ang = ang2 - ang1;
        if (ang < 0) {
            ang = pi * 2 + ang;
        }
        
        return ang * 180 / pi; //保留两位小数
    }

    g.sweepAngular = sweepAngular;
    
    // 1 路径切割，包括切割直线、圆弧、贝塞尔曲线
    //

    // 1.1 分割贝塞尔曲线
    // 

    /**
     * [cutBezier 将任意次数(n = 1,2,3,4,...)贝塞尔曲线切成两部分]
     *
     * @see  http://netclass.csu.edu.cn/NCourse/hep089/Chapter3/CG_Txt_3_016.htm
     * @param  {[Array]} bezierArray [贝塞尔曲线起始点和控制点的坐标集]
     * @param  {[Num]} t           [分割贝塞尔曲线的位置，[0, 1]]
     * @return {[Array]}             [切割后的两条子贝塞尔曲线的坐标集]
     */
    function cutBezier(bezierArray, t) {
        var cut = _cutData(t || 0.5),
            n = Math.round(bezierArray.length * 0.5 -1),/*贝塞尔曲线的次数*/
            cb = [], lp = [], rp = [],/*分别用于存储t点左右侧子曲线的控制点的坐标*/
            ba = bezierArray.slice(0),
            i = 0;

        while(n >= 0) {
            var r = ba.slice(-2),
                p = [],
                x, y;
            
            lp.push(ba[0], ba[1]);
            rp.unshift(r[0], r[1]);

            for(i = 0; i < n; i++) {
                x = cut(ba[2 * i], ba[2 * i + 2], t);
                y = cut(ba[2 * i + 1], ba[2 * i + 3], t);
                p.push(x, y);
            }
            ba = p;
            n--;
        }

        return [lp, rp];
    }

    g.cutBezier = cutBezier;

    // 1.2 分割线段
    // 

    /**
     * [cutLine 分割线段]
     * @param  {[Array]} lineArray [线段两端点的坐标集]
     * @param  {[Num]} t         [分割的线段位置，[0, 1]]
     * @return {[Array]}           [分割后的两子线段坐标集]
     */
    function cutLine(lineArray, t) {
        var cut = _cutData(t || 0.5),
            la = lineArray,
            cx, cy;

        cx = cut(la[0], la[2]);
        cy = cut(la[1], la[3]);

        return [
            [la[0], la[1], cx, cy],
            [cx, cy, la[2], la[3]]
        ];
    }

    g.cutLine = cutLine;

    // 1.3 分割圆弧
    // 

    /**
     * [cutArc 分割椭圆弧]
     * @param  {[Array]} arcArray [arc起点 + arc命令参数]
     * @param  {[Array]} cutPoint [切割的位置]
     * @return {[Array]}          [切割成的两段弧的参数]
     */
    function cutArc(arcArray, cutPoint) {
        var aa     = arcArray,
            cp     = cutPoint, //绝对坐标
            sp     = aa.slice(0, 2),//圆弧起点, 绝对坐标
            ep     = aa.slice(-2),//圆弧终点, 绝对坐标
            rx     = aa[2],
            ry     = aa[3],
            rotate = aa[4],
            lf     = aa[5],
            sf     = aa[6],
            sub1   = [],
            sub2   = [];

        if (!lf) {
            sub1 = [sp[0], sp[1], rx, ry, rotate, 0, sf, cp[0], cp[1]];
            sub2 = [cp[0], cp[1], rx, ry, rotate, 0, sf, ep[0], ep[1]];
        } else {
            var arcPointArray = sp.concat(cp, ep),
                gc   = getArcCenter,
                sw   = sweepAngular,
                pi   = Math.pi,
                cent = gc(arcPointArray, rx, ry, rotate * pi / 180),
                lf1  = 1,
                lf2  = 1,
                pointArray, sweepAng1, sweepAng2;

            if (sf) {
                pointArray = cent.concat(sp, cp);
                sweepAng1  = sw(pointArray);

                pointArray = cent.concat(cp, ep);
                sweepAng2  = sw(pointArray);
            } else {
                pointArray = cent.concat(cp, sp);
                sweepAng1  = sw(pointArray);

                pointArray = cent.concat(ep, cp);
                sweepAng2  = sw(pointArray);
            }

            if (sweepAng1 < 180) {
                lf1 = 0;
            } 

            if (sweepAng2 < 180) {
                lf2 = 0;
            }

            sub1 = [sp[0], sp[1], rx, ry, rotate, lf1, sf, cp[0], cp[1]];
            sub2 = [cp[0], cp[1], rx, ry, rotate, lf2, sf, ep[0], ep[1]];
        }

        return [sub1, sub2];
    }
  
    g.cutArc = cutArc;

    // 2 贝赛尔曲线 升阶和降阶s
    // 
    
    /**
     * [upgradeBezier 贝赛尔曲线升阶]
     * @param  {[type]} bezierArray [贝塞尔曲线起始点和控制点的坐标集]
     * @param  {[type]} n           [要升级到的级数n, n>n0(原始阶)]
     * @return {[type]}             [升阶后的贝赛尔曲线的坐标集]
     */
    function upgradeBezier(bezierArray, n) {
        function _p(pi_1, pi, i, n) {
            var t = i / (n + 1);
            return t * pi_1 + (1 - t) * pi;
        }

        var ba = bezierArray.slice(0),
            n0 = Math.round(ba.length * 0.5 - 1),//贝赛尔曲线的原始阶
            b = [], i;

        if (n0 >= n) {
            return false;
        }

        while(n0 < n) {
            b[0] = ba[0];
            b[1] = ba[1];

            for(i = 1; i < n0 + 1; i++) {
                b[2 * i] = _p(ba[2 * i - 2], ba[2 * i], i, n0 + 1);
                b[2 * i + 1] = _p(ba[2 * i - 1], ba[2 * i + 1], i, n0 + 1);
            }

            var t = ba.slice(-2);

            b.push(t[0]);
            b.push(t[1]);
            ba = b.slice(0);
            n0++;
        }

        return b;
    }

    g.upgradeBezier = upgradeBezier;

    // 把圆弧绘制的曲线转化为对应的三次贝塞尔形式
    function arc2curv(arcArray, recursive) {
        // copy from raphael.js
        // for more information of where this math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        var aa = arcArray;
        var x1 = aa[0];
        var y1 = aa[1];
        var rx = aa[2];
        var ry = aa[3];
        var angle = aa[4];
        var laf = aa[5];
        var sf = aa[6];
        var x2 = aa[7];
        var y2 = aa[8];
        var math = Math,
            PI = math.PI,
            abs = Math.abs,
            _120 = PI * 120 / 180,
            rad = PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = function(x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad),
                    Y = x * math.sin(rad) + y * math.cos(rad);
                return {
                    x: X,
                    y: Y
                };
            };
        var cos, sin, h, x, y, rx2, ry2, k, cx, cy, f1, f2, df,
            f2old, x2old, y2old, c1, s1, c2, s2, t, hx, hy,
            m1, m2, m3, m4, newres, i, ii;

        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            cos = math.cos(PI / 180 * angle);
            sin = math.sin(PI / 180 * angle);
            x = (x1 - x2) / 2;
            y = (y1 - y2) / 2;
            h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            rx2 = rx * rx;
            ry2 = ry * ry;
            k = (laf == sf ? -1 : 1) *
                math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
            cx = k * rx * y / ry + (x1 + x2) / 2;
            cy = k * -ry * x / rx + (y1 + y2) / 2;
            f1 = math.asin(((y1 - cy) / ry).toFixed(9));
            f2 = math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            if (f1 < 0) f1 = PI * 2 + f1;
            if (f2 < 0) f2 = PI * 2 + f2;
            if (sf && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sf && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        df = f2 - f1;
        if (abs(df) > _120) {
            f2old = f2;
            x2old = x2;
            y2old = y2;
            f2 = f1 + _120 * (sf && f2 > f1 ? 1 : -1);
            x2 = cx + rx * math.cos(f2);
            y2 = cy + ry * math.sin(f2);
            res = arc2curv([x2, y2, rx, ry, angle, 0, sf, x2old, y2old], [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        c1 = math.cos(f1);
        s1 = math.sin(f1);
        c2 = math.cos(f2);
        s2 = math.sin(f2);
        t = math.tan(df / 4);
        hx = 4 / 3 * rx * t;
        hy = 4 / 3 * ry * t;
        m1 = [x1, y1];
        m2 = [x1 + hx * s1, y1 - hy * c1];
        m3 = [x2 + hx * s2, y2 - hy * c2];
        m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];

        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(',');
            newres = [];
            for (i = 0, ii = res.length; i < ii; i++) {
                newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }

    g.arc2curv = arc2curv;
    // 把二次贝塞尔曲线参数转化为三次贝塞尔曲线参数

    /**
     * [transform 坐标转换]
     * @param  {[Array]} matrix [转换矩阵]
     * @param  {[Array]} coord  [需转换的坐标]
     * @return {[Array]}        [转换后的坐标]
     */
    function transform(matrix, coord) {
        //matrix = [a, b, c, d, e, f]; <=> a c e
        //                                 b d f
        //                                 0 0 1
        return [matrix[0] * coord[0] + matrix[2] * coord[1] + matrix[4],
            matrix[1] * coord[0] + matrix[3] * coord[1] + matrix[5]
        ];
    }

    g.transform = transform;
    module.exports = g;
});