/*
    TODO?: work on full size calculations    
*/

const delay = 750;
const radius = 5;
const tolerance = radius;
const toleranceLine = 0.05;
const toleranceLeft = 0.05;
const toleranceRight = 0.95;

let highlightedLineWidth = 2;
let highlightedColor = "magenta";
let highlightedTextColor = "blue";

function init() {
    let canvas = document.getElementById("fullCanvas");
/*
    let scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
    let scrollWidth = Math.max(
        document.body.scrollWidth, document.documentElement.scrollWidth,
        document.body.offsetWidth, document.documentElement.offsetWidth,
        document.body.clientWidth, document.documentElement.clientWidth
    );
*/

    let scrollHeight = window.innerHeight - reset.scrollHeight;
    let scrollWidth = window.innerWidth;

    canvas.width = scrollWidth-30;
    canvas.height = scrollHeight-30;

    drawEverything();
}

//body.onresize = init;
//document.addEventListener("resize", init);