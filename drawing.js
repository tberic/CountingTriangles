/* 
    TODO: write the number of triangles somewhere in the html document

    MAYBE: save and load pictures    
    MAYBE: when creating points, they should be immediately selected?

    FIX: what to do when the visualization is interrupted by clicking on 
        another button/same button/somewhere on the canvas
        stop? disable other buttons?
*/

let nodes = new Map();
let nNodes = 0;
let lines = new Map();
let nLines = 0;
let lastNode;

let selected;
let selectedMove;
let moved;
let canvas = document.getElementById("fullCanvas");

function drawEverything() {
    let ctx = canvas.getContext("2d");    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    for (const c of nodes.values())
        if (!c.invisible)
            drawCircle(ctx, c, c.color);

    for (const l of lines.values())
        drawLine(ctx, nodes.get(l.start), nodes.get(l.end), l.color);
}

function inCircle(x, y) {
    for (const [i, c] of nodes) {
        if ( (x-c.x)**2 + (y-c.y)**2 <= (radius+tolerance)**2 )
            return i;
    }
    return null;
}

function isConnected(a, b) {
    for (l of lines.values())
        if ( l.points.has(a) && l.points.has(b) )
            return true;

    return false;
}

function isColinear(a, b, c) {
    for (l of lines.values())
        if (l.points.has(a) && l.points.has(b) && l.points.has(c))
            return true;

    return false;
}

function isIntersected(a, b) {
    for (let i of lines.get(a).points)
        for (let j of lines.get(b).points)
            if (i == j)
                return true;
    return false;
}

/*
function isIntersectionPoint(i) {
    let flag = false;
    for (let l of lines.values())
        if (l.points.has(i)) {
            if (flag)
                return true;
            else
                flag = true;
        }
    return false;
}
*/

function onLine(x, y) {
    for (const [i, l] of lines) {
        let x1 = nodes.get(l.start).x;
        let x2 = nodes.get(l.end).x;
        let y1 = nodes.get(l.start).y;
        let y2 = nodes.get(l.end).y;

        let crossproduct = Math.abs( (y-y1)*(x2-x1) - (y2-y1)*(x-x1) );
        let AB2 = (y-y1)**2 + (x-x1)**2;
        let AC2 = (y2-y1)**2 + (x2-x1)**2;

        if (crossproduct**2 > toleranceLine**2*AB2*AC2)
            continue;

        let dotproduct = (x2-x1)*(x-x1) + (y2-y1)*(y-y1);
        if (dotproduct < 0 || dotproduct > AC2)
            continue;

        return [i, dotproduct/AC2];
    }

    return [null, null];
}

function drawCircle(ctx, c, color) {
    ctx.beginPath();
    ctx.strokeStyle = (nodes.get(selected) !== c) ? color : "red";
    ctx.fillStyle = (nodes.get(selected) !== c) ? color : "red";
    ctx.arc(c.x, c.y, radius, 0, 2*Math.PI );    
    ctx.fill();
    ctx.stroke();
}

function drawLine(ctx, a, b, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;

    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function connect(i, j) {
    let a = Math.min(i, j);
    let b = Math.max(i, j);

    selected = null;

    //segment already exists
    for (let l of lines.values())
    if (l.start == a && l.end == b)
        return ;

    //don't connect point on a segment with the endpoints of that segment
    if (nodes.get(i).line && 
        (lines.get(nodes.get(i).line).start == j || lines.get(nodes.get(i).line).end == j))
        return ;
    if (nodes.get(j).line && 
        (lines.get(nodes.get(j).line).start == i || lines.get(nodes.get(j).line).end == i)) 
        return ;

    lines.set(++nLines, {start: a, end: b, points: new Set([a, b]), color: "black"});

}

/*
    creates a node along with getters and setters for 'x' and 'y' properties
    (because some nodes have explicit values for x,y
        others have implicit values given by their position on the segment )
*/
function createNode(obj) {
    let node = obj;
    Object.defineProperties(node, {
        'x': { get: function() {
            if (this._x) return this._x;
            let P0 = nodes.get( lines.get(this.line).start );
            let P1 = nodes.get( lines.get(this.line).end );
            return (1-this.pos)*P0.x + this.pos*P1.x;
        },  set: function(val) {
            this._x = val;
        }},
        'y': { get: function() {
            if (this._y) return this._y;
            let P0 = nodes.get( lines.get(this.line).start );
            let P1 = nodes.get( lines.get(this.line).end );
            return (1-this.pos)*P0.y + this.pos*P1.y;
        },  set: function(val) {
            this._y = val;
        }}
    });

    return node;
}

canvas.onclick = function(event) {    
    let left = canvas.getBoundingClientRect().left;
    let top = canvas.getBoundingClientRect().top;
    let cx = event.clientX - left;
    let cy = event.clientY - top;

    if (moved) {
        drawEverything();
        moved = false;
        return ;
    }

    let i = inCircle(cx, cy);
    let j, t;
    [j, t] = onLine(cx, cy);

    if (!i) {
        if (!j) {            
            nodes.set(++nNodes, createNode({_x: cx, _y: cy, color: "black"}));
        }
        else {
            nodes.set(++nNodes, createNode({line: j, pos: t, color: "blue"}));
            lines.get(j).points.add(nNodes);
            let tmpSelected = selected;
            connect(lines.get(j).start, nNodes);
            connect(lines.get(j).end, nNodes);
            selected = tmpSelected;
        }

        if (selected)
            connect(nNodes, selected);
    }
    else if (selected == i) {        
        selected = null;
    }
    else if (selected) {
        connect(i, selected);
    }
    else {
        selected = i;        
    }

    drawEverything();
}

function removeConnections(i) {      
    //before deleting the segment, delete all all the points on that segment
    for (let [k, l] of lines) {
        if (l.points.has(i))
            l.points.delete(i);

        if (l.start == i || l.end == i) {
            for (let c of l.points)
                if (c != l.start && c != l.end) {
                    removeConnections(c);
                    nodes.delete(c);
                }
            lines.delete(k);
        }        
    }
}

canvas.oncontextmenu = function(event) {
    let left = canvas.getBoundingClientRect().left;
    let top = canvas.getBoundingClientRect().top;
    let cx = event.clientX - left;
    let cy = event.clientY - top;
    
    i = inCircle(cx, cy);
    if (i) {
        removeConnections(i);
        nodes.delete(i);
        selected = null;
    }    

    drawEverything();
}

function onMouseMove(event) {
    if (!selectedMove)
        return ;
    moved = true;
/*
    if (isIntersectionPoint(selectedMove))
        return ;
*/    
    let c = nodes.get(selectedMove);
/*
    if (c.fixed)
        return ;
*/
    let x = event.clientX - canvas.getBoundingClientRect().left;
    let y = event.clientY - canvas.getBoundingClientRect().top;

    if (c.line) {
        let x1 = nodes.get(lines.get(c.line).start).x;
        let y1 = nodes.get(lines.get(c.line).start).y;
        let x2 = nodes.get(lines.get(c.line).end).x;
        let y2 = nodes.get(lines.get(c.line).end).y;

        let AC2 = (y2-y1)**2 + (x2-x1)**2;
        let dotproduct = (x2-x1)*(x-x1) + (y2-y1)*(y-y1);

        if (dotproduct < toleranceLeft*AC2) dotproduct = toleranceLeft*AC2;
        if (dotproduct > toleranceRight*AC2) dotproduct = toleranceRight*AC2;
        c.pos = dotproduct/AC2;
    }
    else {
        c.x = x;
        c.y = y;
    }

    drawEverything();
}

canvas.onmousedown = function(event) {
    let cx = event.clientX - canvas.getBoundingClientRect().left;
    let cy = event.clientY - canvas.getBoundingClientRect().top;

    i = inCircle(cx, cy);
    if (!i)
        return ;

    moved = false;
    selectedMove = i;

    canvas.addEventListener("mousemove", onMouseMove);

    canvas.onmouseup = function() {
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.onmouseup = null;
        selectedMove = null;                
    }
}






document.body.oncontextmenu = function() {
    return false;
}

canvas.ondragstart = function() {
    return false;
}

reset.onclick = function() {
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.clear();
    nNodes = 0;
    lines.clear();
    nLines = 0;
//    connected.clear();    
    selected = null;
    selectedMove = null;
}

printNodes.onclick = function() {
    console.log("print nodes");
    console.log(nodes);
    /*
    for (let c of nodes)
        console.log( c.x + " " + c.y);
    */
}

printLines.onclick = function() {
    console.log("print lines");

    console.log(lines);
/*
    for (const [a, l] of connected)
        for (const b of l)
            //console.log(`(${a.x},${a.y})-(${b.x},${b.y})`);
            console.log(a + "-" + b);
*/
}

function intersection(a, b) {
    let A = nodes.get(a.start);
    let B = nodes.get(a.end);
    let C = nodes.get(b.start);
    let D = nodes.get(b.end);
    let x1 = A.x, y1 = A.y;
    let x2 = B.x, y2 = B.y;
    let a1 = C.x, b1 = C.y;
    let a2 = D.x, b2 = D.y;

    if ( (x2-x1)*(b2-b1) - (a2-a1)*(y2-y1) == 0 )
        return null;

    let u = ((a1-x1)*(b2-b1) - (a2-a1)*(b1-y1)) / ((x2-x1)*(b2-b1) - (a2-a1)*(y2-y1));
    if (u < 0 || u > 1)
        return null;
    
    let t;
    if (a1 != a2)
        t = ( u*(x2-x1) - (a1-x1) ) / (a2-a1);
    else
        t = ( u*(y2-y1) - (b1-y1) ) / (b2-b1);
    if (t < 0 || t > 1)
        return null;

    return u;
}

function findIntersections() {
    lastNode = nNodes;
    for (let i = 1; i <= nLines; ++i)
        if (lines.has(i))
        for (let j = i+1; j <= nLines; ++j) 
            if (lines.has(j))
            if (!isIntersected(i, j)) {
                let l1 = lines.get(i);
                let l2 = lines.get(j);
                let t = intersection(l1, l2);
                if (t) {
                    let node = createNode({line: i, pos: t, fixed: true, color: "green", invisible: true});
                    let point = inCircle(node.x, node.y);
                    if (!point) {
                        //console.log("found intersection");
                        nodes.set(++nNodes, node);
                        l1.points.add(nNodes);
                        l2.points.add(nNodes);
                    }
                    else {
                        l1.points.add(point);
                        l2.points.add(point);
                    }
            }
        }
}


function visualize(A, B, C, n=null) {
    drawEverything();
    
    let ctx = canvas.getContext("2d");
/*    
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = highlightedTextColor;
    ctx.fillText(n, canvas.width/2, 70);
*/
    ctx.beginPath();
    ctx.strokeStyle = highlightedColor;
    ctx.fillStyle = highlightedColor;
    ctx.lineWidth = highlightedLineWidth;
    ctx.globalAlpha = 0.2;

    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(A.x, A.y);
    ctx.stroke();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = highlightedTextColor;
    ctx.fillText(n, (A.x+B.x+C.x)/3, (A.y+B.y+C.y)/3);
}

const timer = ms => new Promise(res => setTimeout(res, ms))

async function count(draw = false) {
    console.log("Count triangles");
    selected = null;
    findIntersections();
    drawEverything();

    let nTriangles = 0;
    for (let a = 1; a <= nNodes; ++a)
        if (nodes.has(a))
        for (let b = a+1; b <= nNodes; ++b)
            if (nodes.has(b))
            for (let c = b+1; c <= nNodes; ++c)
                if (nodes.has(c))
                if (isConnected(a, b) && isConnected(b, c) && isConnected(a, c) &&
                    !isColinear(a, b, c)) {
                    nTriangles++;

                    if (draw) {
                        visualize(nodes.get(a), nodes.get(b), nodes.get(c), nTriangles);
                        await timer(delay);
                    }
                }
    
    console.log("Triangles: " + nTriangles);

    //remove temporary invisible intersection nodes after we are done
    for (let i = lastNode+1; i <= nNodes; ++i) {
        removeConnections(i);        
        nodes.delete(i);
    }
    nNodes = lastNode;

    drawEverything();
}   



countTri.onclick = () => count(false);
visualizeTri.onclick = () => count(true);