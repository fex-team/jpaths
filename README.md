JPaths API Design
===

## Create

Create the `JPath` object with the `jpaths()` method

### jpaths()

How to create a [`JPath`](#the-jpath-object) object:

```js
// create an empty path
var path = jpaths();

// create a path with init path string
var path = jpaths('M0,0h3v3z');
```

## Building

### .append()

Append standard commands (according to [SVG Path Commands](http://www.w3.org/TR/SVG/paths.html#PathData))

```js
var path = jpaths();

// append command and param directly
path.append('M', 0, 0);

// append command string
path.append('M0,0');

// array-style path segment(s)
path.append(['M', 0, 0])
path.append([['M', 0, 0], ['L', 0, 0]])

```

\* You can checkout the [appendix table](#appendixi-supported-command-table) for commands jpaths supports

### jpaths.define()

You can extend your shape by `jpaths.define()` easily

```js
// define the `rect` shape
jpaths.define('rect', function(params) {

    if (params.length != 2) throw new Error('The rect command should have 2 parameters');

    var dx = params.shift();
    var dy = params.shift();

    return ['h', dx, 'v', dy, 'h', -dx, 'v', -dy, 'z'];
});

// append the `rect` shape
var path = jpaths();
path.append('M', 100, 100);
path.append('rect', 40, 30); // path.toString() will be 'M100,100h40v30h-40v-30z'
```

## Conversions

The `JPath` object can convert to different representations 

### .toString()

Convert the `JPath` object to a [standard SVG path string](http://www.w3.org/TR/SVG/paths.html#PathData). Any drawing define will be converted.

```js
var path = jpaths(['M', 0, 0, 'R', 10, 0, 0, 10, 10]);

// ziped
console.log(path.toString()); // 'M0,0A10,10,0,0,0,10,10'

// formated
console.log(path.toString('%s')); // 'M 0,0 A 10 10 0 0 0 10,10' only coordinate use comma to split
console.log(path.toString('%n')); // 'M 0,0\nA 10 10 0 0 0 10,10' commands are split with line-break
```

### .toArray() / .valueOf()

Converts `JPath` object to a 2-dimension array, see example below.

```js
var path = jpaths('M0,0h3v4L5,6');

console.log(path.toArray()); // [['M', 0, 0], ['h', 3], ['v', 4], ['L', 5, 6]]
console.log(path.valueOf()); // the same way to `toArray()`
```

### .toAbsolute()

Converts `JPath` object to another, which commands use absolute coordinates.

```js
var path = jpaths('M0,0h3v4l1,1');

console.log(path.toAbsolute().toString()); // 'M0,0H3V4L4,5'
```

### .toNormalized()

Converts `JPath` object to a normalized path. A normalized path string contains only 4 command types: `M`, `L`, `C`, `z`. All command coordinates are absolute.

```js
var path = jpaths('...');

path = path.normalize(); // returns a new jpath object contains only 4 normalize command types.
```

### .toCurve()

Converts `JPath` object to another which contains only `M`, `C` and `z` commands.

```js
var path = jpaths('M0,0H10');
path = path.toCurve(); // path.toString() is 'M0,0C0,0,10,0,10,0'
```

## Calculations

### .length()

Calculate the path length (length-along-path)

```js
var path = jpaths('...');
var length = path.length();
```

### .at(position)

Calculate the point coordinate, tangent vector and tangent angle at the specific position along the path. Returns an object like this:

```js
var path = jpaths('M0,0L10,10');
var vertex = path.at(2); // returns {
                         //     point: [1.414, 1.414] // sqrt(2)
                         //     tangent: [0.717, 0.717] // vector length will be 1
                         //     rotate: 0.7854 // PI/4
                         // }
```

> Notice: If the position is not in range of the path length, an error will throw

### .cut(position)

Cut the `JPath` object into 2 `JPath` objects from the position along the path

```js
var path = jpaths('M0,0H100');
var cutted = path.cut(50);
console.log(cutted[0].toString()); // 'M0,0H50'
console.log(cutted[1].toString()); // 'M50,0H100'
```

### .sub(position, length)

Calculate the sub path from specified position and length. If length is not specified, return sub path from position to end.

```js
var path = jpaths('M0,0H100');
var subpath = path.sub(20, 30); // 'M20,0H50'
```

### .transform(matrix)

Transform the path using the specified matrix. The matrix should be a 6-length array.

```js
var path = jpaths('M0,0H100');
var transformed = path.transform([1, 0, 0, 1, 10, 10]); // transformed.toString() will be 'M10,10L110,10'
```

### .tween(dest, t)

Calculate the tween from the current `JPath` object to the destination `JPath` object along `t`. `t` ranges in [0, 1].

```js
var path = jpaths('M0,0H100');
var dest = jpaths('M0,0H50');
var tween = path.tween(dest, 0.5); // tween.toString() will be 'M0,0L75,0'
```

## Rendering

The `JPath` object can be rendered to a canvas 2d context or a svg path element.

```js
var path = jpath('M0,0L100,0,0,100');

// render to canvas
var ctx = canvas.getContext('2d');
path.render(ctx);
ctx.fillStyle = 'red';
ctx.fill();

// render to svg path element
var pathElement = document.querySelector('svg #triangle');
path.render(pathElement); // in fact, this equals to pathElement.setAttribute('d', path);
```

## The JPath Object

The `jpath()` method returns the `JPath` object, which is instanceof `jpath.JPath`. You can construct a `JPath` instance with `new` operator.

```js
var path = new jpath.JPath(); 
// same with `var path = jpath();`
```

The detail usage of the `JPath` object is described above. Here's the list:

* `constructor jpath()`
* `constructor jpath(pathString)`
* `.append(commandName, params...)`
* `.append(pathString)`
* `.append(pathArray)`
* `.toString()`
* `.toArray()`
* `.toAbsolute()`
* `.toNormalized()`
* `.toCurve()`
* `.length()`
* `.at(position)`
* `.cut(position)`
* `.sub(position, length)`
* `.transform(matrix)`
* `.tween(dest, t)`
* `.render(CanvasRenderingContext2D ctx)`
* `.render(SVGPathElement element)`

## Appendix.I. Supported Command Table

| Command | Grammar                            | Description                                      |
|---------|------------------------------------|--------------------------------------------------|
| M/m     | M\|m (x, y)+                       | Move to command                                  |
| L/l     | L\|l (x, y)+                       | Line to command                                  |
| H/h     | H\|h (x)+                          | Horizon line to command                          |
| V/v     | V\|v (y)+                          | Vertical line to command                         |
| A/a     | A\|a (rx, ry, xr, laf, sf, x, y)+  | Arc to command                                   |
| C/c     | C\|c (x1, y1, x2, y2, x, y)+       | Cubic bezier to command                          |
| Q/q     | Q\|q (x1, y1, x, y)+               | Quard bezier to command                          |
| S/s     | S\|s (x2, y2, x, y)+               | Smooth(or short-hand) cubic bezier to command    |
| T/t     | T\|t (x, y)+                       | Smooth(or short-hand) quard bezier to command    |
| Z/z     | Z\|z                               | Close path command                               |
| R/r *   | R\|r (r, laf, sf, x, y)+           | Circle arc to command                            |

\* Non-standard
