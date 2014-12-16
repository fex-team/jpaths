SVGPathElement.prototype.normalizePath = function(bezierDegree,defaultFlatness) {
    var originalIsRemoved = original_is_removed(), dummy_seg, seg, letter, currentPoint,
    list = this.pathSegList,
    newpath = document.createElementNS("http://www.w3.org/2000/svg",'path'),
    method, newseg, x, y, i=0, N = list.numberOfItems, j, M, bezier,
    getCurrentPoint = function(i) {
        var j=i,
        x=false,y=false,
        prev;
       
        while (x===false || y===false) {
            j--;
            if (j<0) {
                if (x === false) { x = 0; }
                if (y === false) { y = 0; }
            }
            else {
                prev = list.getItem(j);
                if (prev.x!==undefined && x === false) { x = prev.x; }
                if (prev.y!==undefined && y === false) { y = prev.y; }
            }
        }
        return {x:x,y:y};
    };

    for (;i<N;i++) {
        seg = list.getItem(i);
        letter = seg.pathSegTypeAsLetter;
        currentPoint = getCurrentPoint(i);

        //First transform relative to aboslute segments
        if (letter.toUpperCase() !== letter && letter!=='z') {
            method = 'createSVGPathSeg';
            switch (letter) {
                case 'z' : method+='ClosePath'; break;
                case 'm' : method+='Moveto'; break;
                case 'l' : method+='Lineto'; break;
                case 'c' : method+='CurvetoCubic'; break;
                case 'q' : method+='CurvetoQuadratic'; break;
                case 'a' : method+='Arc'; break;
                case 'h' : method+='LinetoHorizontal'; break;
                case 'v' : method+='LinetoVertical'; break;
                case 's' : method+='CurvetoCubicSmooth'; break;
                case 't' : method+='CurvetoQuadraticSmooth'; break;
            }
            method+='Abs';
            args = [];

            if (letter === 'h') { args.push(currentPoint.x+seg.x); }
            else if (letter === 'v') { args.push(currentPoint.y+seg.y); }
            else
            {
                args.push(currentPoint.x+seg.x,currentPoint.y+seg.y);
                switch (letter)
                {
                    case 'c' : args.push(currentPoint.x+seg.x1,currentPoint.y+seg.y1,currentPoint.x+seg.x2,currentPoint.y+seg.y2); break;
                    case 'q' : args.push(currentPoint.x+seg.x1,currentPoint.y+seg.y1); break;
                    case 'a' : args.push(seg.r1,seg.r2,seg.angle,seg.largArcFlag,seg.sweepFlag); break;
                    case 's' : args.push(currentPoint.x+seg.x2,currentPoint.y+seg.y2); break;
                }
            }
           
            seg = this[method].apply(this,args);
            list.replaceItem(seg,i);
            letter = letter.toUpperCase();
        }
                   
        if (letter === 'H') {
            newseg = this.createSVGPathSegLinetoAbs(seg.x,currentPoint.y);
            newpath.pathSegList.appendItem(newseg);
        }
        else if (letter === 'V') {
            newseg = this.createSVGPathSegLinetoAbs(currentPoint.x,seg.y);
            newpath.pathSegList.appendItem(newseg);
        }
        else if (letter === 'S') { //transform S to C
            if (i === 0 || list.getItem(i-1).pathSegTypeAsLetter !== 'C') {
                x = currentPoint.x;
                y = currentPoint.y;
            }
            else {
                x = currentPoint.x * 2 - list.getItem(i-1).x2;
                y = currentPoint.y * 2 - list.getItem(i-1).y2;
            }
            newseg = this.createSVGPathSegCurvetoCubicAbs(seg.x,seg.y,x,y,seg.x2,seg.y2);
            list.replaceItem(newseg,i);
            i--;
            continue;
        }
        else if (letter === 'Q') {
            newseg = this.createSVGPathSegCurvetoCubicAbs(seg.x,seg.y, 1/3 * currentPoint.x + 2/3 * seg.x1, currentPoint.y/3 + 2/3 *seg.y1,2/3 * seg.x1 + 1/3 * seg.x, 2/3 * seg.y1 + 1/3 * seg.y);
            newpath.pathSegList.appendItem(newseg);
        }
        else if (letter === 'T') { //transform T to Q
            if (i === 0 || list.getItem(i-1).pathSegTypeAsLetter !== 'Q') {
                x = currentPoint.x;
                y = currentPoint.y;
            }
            else {
                x = currentPoint.x * 2 - list.getItem(i-1).x1;
                y = currentPoint.y * 2 - list.getItem(i-1).y1;
            }
            newseg = this.createSVGPathSegCurvetoQuadraticAbs(seg.x,seg.y,x,y,seg.x2,seg.y2);
            list.replaceItem( newseg , i );
            i--;
            continue;
        }
        else if (letter === 'A') {
            bezier = toBezier(seg,currentPoint,bezierDegree,defaultFlatness);
            if (!originalIsRemoved) // IE9, FF
            for (j=0,M=bezier.numberOfItems;j<M;j++) {
                newpath.pathSegList.appendItem(bezier.getItem(j));
            }
            else // Safari, Chrome, Opera
            for (j=0,M=bezier.numberOfItems;j<M;j++) {
                newpath.pathSegList.appendItem(bezier.getItem(0));
            } 
        }
        else {
            if (!originalIsRemoved) // IE9, FF
            newpath.pathSegList.appendItem(seg);
            else // Safari, Chrome, Opera
            {
                // Maybe there is a more efficient way, but
                // this is quick and dirty way to ensure
                // that the list remains intact in Safari, Chrome and Opera
                // in the same way as in IE9 and FF
                dummy_seg = clone_seg(seg);
                list.insertItemBefore(dummy_seg, i);
                newpath.pathSegList.appendItem(seg);
            }
        }
    }
   
    list.clear();
    M=newpath.pathSegList.numberOfItems;
    
    if (!originalIsRemoved) // IE9, FF
    for (j=0,M=newpath.pathSegList.numberOfItems;j<M;j++) {
         list.appendItem(newpath.pathSegList.getItem(j));
    }
    else // Safari, Chrome, Opera
        for (j=0,M=newpath.pathSegList.numberOfItems;j<M;j++) {
        list.appendItem(newpath.pathSegList.getItem(0));
    }
    return this;
};

toBezier = function(seg2,currentPoint,bezierDegree,defaultFlatness) {
   
    ///////////////////////////////////////   
    //from Luc Maisonobe www.spaceroots.org
    seg2.angleRad = seg2.angle*Math.PI/180;
    seg2.x1 = currentPoint.x;
    seg2.y1 = currentPoint.y;
    seg2.r1 = Math.abs(seg2.r1);
    seg2.r2 = Math.abs(seg2.r2);
       
    defaultFlatness = defaultFlatness || 0.5;
    bezierDegree = bezierDegree || 1;

    // find the number of Bézier curves needed
    var found = false,
    i,n = 1,
    dEta,etaA,etaB,
    path = document.createElementNS("http://www.w3.org/2000/svg",'path'),
    seg,
   
    coefs = {

        degree2 : {
   
            low : [
                [
                    [  3.92478,   -13.5822,     -0.233377,    0.0128206   ],
                    [ -1.08814,     0.859987,    0.000362265, 0.000229036 ],
                    [ -0.942512,    0.390456,    0.0080909,   0.00723895  ],
                    [ -0.736228,    0.20998,     0.0129867,   0.0103456   ]
                ], [
                    [ -0.395018,    6.82464,     0.0995293,   0.0122198   ],
                    [ -0.545608,    0.0774863,   0.0267327,   0.0132482   ],
                    [  0.0534754,  -0.0884167,   0.012595,    0.0343396   ],
                    [  0.209052,   -0.0599987,  -0.00723897,  0.00789976  ]
                ]
            ],
           
            high : [
                [
                    [  0.0863805, -11.5595,     -2.68765,     0.181224    ],
                    [  0.242856,   -1.81073,     1.56876,     1.68544     ],
                    [  0.233337,   -0.455621,    0.222856,    0.403469    ],
                    [  0.0612978,  -0.104879,    0.0446799,   0.00867312  ]
                ], [
                    [  0.028973,    6.68407,     0.171472,    0.0211706   ],
                    [  0.0307674,  -0.0517815,   0.0216803,  -0.0749348   ],
                    [ -0.0471179,   0.1288,     -0.0781702,   2.0         ],
                    [ -0.0309683,   0.0531557,  -0.0227191,   0.0434511   ]
                ]
            ],
           
            safety : [ 0.001, 4.98, 0.207, 0.0067 ]
        },
       
        degree3 : {
   
            low : [
                [
                    [ 3.85268,   -21.229,      -0.330434,    0.0127842   ],
                    [ -1.61486,     0.706564,    0.225945,    0.263682   ],
                    [ -0.910164,    0.388383,    0.00551445,  0.00671814 ],
                    [ -0.630184,    0.192402,    0.0098871,   0.0102527  ]
                ],[
                    [ -0.162211,    9.94329,     0.13723,     0.0124084  ],
                    [ -0.253135,    0.00187735,  0.0230286,   0.01264    ],
                    [ -0.0695069,  -0.0437594,   0.0120636,   0.0163087  ],
                    [ -0.0328856,  -0.00926032, -0.00173573,  0.00527385 ]
                ]
            ],
           
            high : [
                [
                    [  0.0899116, -19.2349,     -4.11711,     0.183362   ],
                    [  0.138148,   -1.45804,     1.32044,     1.38474    ],
                    [  0.230903,   -0.450262,    0.219963,    0.414038   ],
                    [  0.0590565,  -0.101062,    0.0430592,   0.0204699  ]
                ], [
                    [  0.0164649,   9.89394,     0.0919496,   0.00760802 ],
                    [  0.0191603,  -0.0322058,   0.0134667,  -0.0825018  ],
                    [  0.0156192,  -0.017535,    0.00326508, -0.228157   ],
                    [ -0.0236752,   0.0405821,  -0.0173086,   0.176187   ]
                ]
            ],
           
            safety : [ 0.001, 4.98, 0.207, 0.0067 ]
        }
    },
   
    rationalFunction = function(x,c) {
        return (x * (x * c[0] + c[1]) + c[2]) / (x + c[3]);
    },

    estimateError = function(etaA,etaB) {

        var eta  = 0.5 * (etaA + etaB);

        if (bezierDegree < 2) {

            // start point
            var aCosEtaA  = seg2.r1 * Math.cos(etaA),
            bSinEtaA = seg2.r2 * Math.sin(etaA),
            xA = seg2.cx + aCosEtaA * Math.cos(seg2.angleRad) - bSinEtaA * Math.sin(seg2.angleRad),
            yA = seg2.cy + aCosEtaA * Math.sin(seg2.angleRad) + Math.sin(seg2.angleRad) * Math.cos(seg2.angleRad),

            // end point
            aCosEtaB = seg2.r1 * Math.cos(etaB),
            bSinEtaB = seg2.r2 * Math.sin(etaB),
            xB = seg2.cx + aCosEtaB * Math.cos(seg2.angleRad) - bSinEtaB * Math.sin(seg2.angleRad),
            yB = seg2.cy + aCosEtaB * Math.sin(seg2.angleRad) + bSinEtaB * Math.cos(seg2.angleRad),

            // maximal error point
            aCosEta = seg2.r1 * Math.cos(eta),
            bSinEta = seg2.r2 * Math.sin(eta),
            x = seg2.cx + aCosEta * Math.cos(seg2.angleRad) - bSinEta * Math.sin(seg2.angleRad),
            y = seg2.cy + aCosEta * Math.sin(seg2.angleRad) + bSinEta * Math.cos(seg2.angleRad),

            dx = xB - xA,
            dy = yB - yA;

            return Math.abs(x * dy - y * dx + xB * yA - xA * yB) / Math.sqrt(dx * dx + dy * dy);
        }
        else {
       
            var x = seg2.r2 / seg2.r1,
            dEta = etaB - etaA,
            cos2 = Math.cos(2 * eta),
            cos4 = Math.cos(4 * eta),
            cos6 = Math.cos(6 * eta),
            // select the right coeficients set according to degree and b/a
            coeffs = (x < 0.25) ? coefs['degree'+bezierDegree].low : coefs['degree'+bezierDegree].high,
            c0 = rationalFunction(x, coeffs[0][0]) + cos2 * rationalFunction(x, coeffs[0][1]) +
                 cos4 * rationalFunction(x, coeffs[0][2]) + cos6 * rationalFunction(x, coeffs[0][3]),
            c1 = rationalFunction(x, coeffs[1][0]) + cos2 * rationalFunction(x, coeffs[1][1]) + cos4 *
                 rationalFunction(x, coeffs[1][2]) + cos6 * rationalFunction(x, coeffs[1][3]);
           
            return rationalFunction(x, coefs['degree'+bezierDegree].safety) * seg2.r1 * Math.exp(c0 + c1 * dEta);
        }
    };
   
    (function() { //compute center and angles

        //from http://www.w3.org/TR/2003/REC-SVG11-20030114/implnote.html#ArcConversionEndpointToCenter
        var xp1 = Math.cos(seg2.angleRad) * (seg2.x1-seg2.x) / 2 +
                  Math.sin(seg2.angleRad) * (seg2.y1-seg2.y) / 2,
        yp1 = -Math.sin(seg2.angleRad) * (seg2.x1-seg2.x) / 2 +
               Math.cos(seg2.angleRad) * (seg2.y1-seg2.y) / 2,
        r1c = Math.pow(seg2.r1,2),
        r2c = Math.pow(seg2.r2,2),
        xp1c = Math.pow(xp1,2),
        yp1c = Math.pow(yp1,2),
       
        lambda = xp1c / r1c + yp1c / r2c; //Ensure radii are large enough
       
        if (lambda > 1) {
            seg2.r1*=Math.sqrt(lambda);
            seg2.r2*=Math.sqrt(lambda);
            r1c = Math.pow(seg2.r1,2);
            r2c = Math.pow(seg2.r2,2);
        }
       
        var coef = (seg2.largeArcFlag === seg2.sweepFlag ? -1 : 1 ) *
                   Math.sqrt( Math.max(0,( r1c*r2c - r1c*yp1c - r2c*xp1c ) / ( r1c*yp1c + r2c*xp1c)) ),
        cpx = coef * ( seg2.r1 * yp1 ) / seg2.r2,
        cpy = coef * ( - seg2.r2 * xp1 ) / seg2.r1,
        cx = Math.cos(seg2.angleRad) * cpx - Math.sin(seg2.angleRad) * cpy + (seg2.x1 + seg2.x) / 2,
        cy = Math.sin(seg2.angleRad) * cpx + Math.cos(seg2.angleRad) * cpy + (seg2.y1 + seg2.y) / 2,
        cosTheta = ( (xp1-cpx)/seg2.r1 ) / Math.sqrt( Math.pow( (xp1-cpx)/seg2.r1 , 2 ) + Math.pow( (yp1-cpy)/seg2.r2 , 2 ) ),
        theta = ( (yp1-cpy)/seg2.r2 > 0 ? 1 : -1) * Math.acos(cosTheta),
        u = { x : (xp1-cpx) /seg2.r1 , y : (yp1-cpy) /seg2.r2 },
        v = { x : (-xp1-cpx)/seg2.r1 , y : (-yp1-cpy)/seg2.r2 },
        cosDeltaTheta = ( u.x * v.x + u.y * v.y ) / ( Math.sqrt(Math.pow(u.x,2) + Math.pow(u.y,2)) * Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2)) ),
        deltaTheta = (u.x*v.y-u.y*v.x > 0 ? 1 : -1) * Math.acos(Math.max(-1,Math.min(1,cosDeltaTheta))) % (Math.PI*2);
       
        if (seg2.sweepFlag === false && deltaTheta > 0) { deltaTheta-=Math.PI*2; }
        else if (seg2.sweepFlag === true && deltaTheta < 0) { deltaTheta+=Math.PI*2; }

        seg2.eta1 = theta;
        seg2.eta2 = theta + deltaTheta;
        seg2.cx = cx;
        seg2.cy = cy;
       
    }).call(seg2);
   
    while ((!found) && (n < 1024)) {
        dEta = (seg2.eta2 - seg2.eta1) / n;
        if (dEta <= 0.5 * Math.PI) {
            etaB = seg2.eta1;
            found = true;
            for (i=0; found && (i<n); ++i) {
                etaA = etaB;
                etaB += dEta;
                found = (estimateError.call(seg2,etaA, etaB) <= defaultFlatness);
            }
        }
        n = n << 1;
    }

    dEta = (seg2.eta2 - seg2.eta1) / n;
    etaB = seg2.eta1;

    var aCosEtaB = seg2.r1 * Math.cos(etaB),
    bSinEtaB = seg2.r2 * Math.sin(etaB),
    aSinEtaB = seg2.r1 * Math.sin(etaB),
    bCosEtaB = seg2.r2 * Math.cos(etaB),
    xB = seg2.cx + aCosEtaB * Math.cos(seg2.angleRad) - bSinEtaB * Math.sin(seg2.angleRad),
    yB = seg2.cy + aCosEtaB * Math.sin(seg2.angleRad) + bSinEtaB * Math.cos(seg2.angleRad),
    xADot,yADot,
    xBDot = -aSinEtaB * Math.cos(seg2.angleRad) - bCosEtaB * Math.sin(seg2.angleRad),
    yBDot = -aSinEtaB * Math.sin(seg2.angleRad) + bCosEtaB * Math.cos(seg2.angleRad);
   
    var t = Math.tan(0.5 * dEta),
    alpha = Math.sin(dEta) * (Math.sqrt(4 + 3 * t * t) - 1) / 3,
    xA,yA,xB,yB,xADot,xBDot,k;
   
    for (var i = 0; i < n; ++i) {

        etaA = etaB;
        xA = xB;
        yA = yB;
        xADot = xBDot;
        yADot = yBDot;

        etaB += dEta;
        aCosEtaB = seg2.r1 * Math.cos(etaB);
        bSinEtaB = seg2.r2 * Math.sin(etaB);
        aSinEtaB = seg2.r1 * Math.sin(etaB);
        bCosEtaB = seg2.r2 * Math.cos(etaB);
        xB       = seg2.cx + aCosEtaB * Math.cos(seg2.angleRad) - bSinEtaB * Math.sin(seg2.angleRad);
        yB       = seg2.cy + aCosEtaB * Math.sin(seg2.angleRad) + bSinEtaB * Math.cos(seg2.angleRad);
        xBDot    = -aSinEtaB * Math.cos(seg2.angleRad) - bCosEtaB * Math.sin(seg2.angleRad);
        yBDot    = -aSinEtaB * Math.sin(seg2.angleRad) + bCosEtaB * Math.cos(seg2.angleRad);
       
        if (bezierDegree == 1) {
            seg = path.createSVGPathSegLinetoAbs(xB,yB);
        }
        else if (bezierDegree == 2) {
            k = (yBDot * (xB - xA) - xBDot * (yB - yA)) / (xADot * yBDot - yADot * xBDot);
            seg = path.createSVGPathSegCurvetoQuadraticAbs(xB , yB , xA + k * xADot , yA + k * yADot);
        } else {
            seg = path.createSVGPathSegCurvetoCubicAbs(xB , yB , xA + alpha * xADot , yA + alpha * yADot, xB - alpha * xBDot, yB - alpha * yBDot);
        }
       
        path.pathSegList.appendItem(seg);
    }

    return path.pathSegList;
};
