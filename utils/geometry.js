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
        
        x1   = Math.round((x1 - dx) * 10000) / 10000;//保留四位有效数字，去掉多余零
        y1   = Math.round((y1 - dy) * 10000) / 10000;

        return [x1, y1];
    }

    /**
     * [getArcCenter 获取椭圆弧的圆心]
     * @param  {[Array]} arcPointArray  [圆弧上取互异三点的坐标集]
     * @param  {[Num]} rx               [长半轴]
     * @param  {[Num]} ry               [短半轴]
     * @param  {[Num]} x_axis_rotation  [椭圆逆时针旋转的角度，负值为顺，弧度]
     * @return {[Array]}                [圆心坐标集]
     */
    function _getArcCenter(arcPointArray, rx, ry, x_axis_rotation) {
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

    /**
     * [_sweepAngular 向量1逆时针旋转至向量2扫过的角度]
     * @param  {[Array]} pointArray [中心点、起点1、终点2的坐标集]
     * @return {[Num]}              [扫过的角度，角度制]
     */
    function _sweepAngular(pointArray) {
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
        
        return Math.round(ang * 18000 / pi) / 100;//保留两位小数
    }

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
                x = cut(ba[2 * i], ba[2 * i + 2]);
                y = cut(ba[2 * i + 1], ba[2 * i + 3]);
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
            sub2 = [cp[0], cp[1], rx, ry, rotate, 0, sf, ep[0]. ep[1]];
        } else {
            var arcPointArray = sp.concat(cp, ep),
                gc   = _getArcCenter,
                sw   = _sweepAngular,
                pi   = Math.pi,
                cent = gc(arcPointArray, rx, ry, rotate * pi / 180),
                lf1  = 1,
                lf2  = 1,
                pointArray, sweepAng1, sweepAng2;

            if (!sf) {
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

            console.log(sweepAng1, sweepAng2);
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


    module.exports = g;
});