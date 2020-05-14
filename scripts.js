// -------------------------------------------------------------------------------------------------------------
// Classes:

class Point {
    constructor(X, Y) {
        this.X = X;
        this.Y = Y;
    }
}

class Polynom {
    constructor(id, points, action) {
        this.id = id;
        this.points = points;
        this.action = action;
    }

    ToString() {
        let result = "polygon " + this.id + " (";
        for (i = 0; i < this.points.length - 1; i++) {
            result = result + "(" + this.points[i].X + "," + this.points[i].Y + "),";
        }
        result = result + "(" + this.points[points.length].X + "," + this.points[points.length].Y + "))";
        return result;
    }
}

class Polynoms {
    constructor() {
        this.list = [];
    }

    AddPolynom(id, points, action) {
        this.list.push(new Polynom(id, points, action));
    }

    RemoveEverything() {
        this.list = [];
    }

    RemoveById(ids) {
        this.list = this.list.filter(function (item) {
            return !ids.includes(item.id);
        })
    }
}

class Line {
    constructor(id, point1, point2, action) {
        this.id = id;
        this.point1 = point1;
        this.point2 = point2;
        this.action = action;
    }

    ToString() {
        let result = "line " + this.id + " ((" + this.point1.X + "," + this.point1.Y + "),(" + this.point2.X + "," + this.point2.Y + "))";
        return result;
    }
}

class Lines {
    constructor() {
        this.list = [];
    }

    AddLine(id, point1, point2, action) {
        this.list.push(new Line(id, point1, point2, action));
    }

    RemoveEverything() {
        this.list = [];
    }

    RemoveById(ids) {
        this.list = this.list.filter(function (item) {
            return !ids.includes(item.id);
        })
    }
}

class Circle {
    constructor(id, point, diameter, action) {
        this.id = id;
        this.point = point;
        this.diameter = diameter;
        this.action = action;
    }

    ToString() {
        let result = "circle " + this.id + " ((" + this.point.X + "," + this.point.Y + ")," + this.diameter + ")";
        return result;
    }
}

class Circles {
    constructor() {
        this.list = [];
    }

    AddCircle(id, point, diameter, action) {
        this.list.push(new Circle(id, point, diameter, action));
    }

    RemoveEverything() {
        this.list = [];
    }

    RemoveById(ids) {
        this.list = this.list.filter(function (item) {
            return !ids.includes(item.id);
        })
    }
}

class selectedItems {
    constructor() {
        this.list = [];
    }

    AddItem(name) {
        this.list.push(name);
    }

    ToString() {
        result = "selected(";
        for (i = 0; i < this.list.length - 1; i++) {
            result = result + this.list[i] + ",";
        }
        result = result + this.list[this.list.length] + ")";
        return result;
    }
}

// Global varibales: 
let selectedItem = new selectedItems(); // pripraveno pro id/class/..., jenom do pole vl
let points = [];
let polynoms = new Polynoms();
let lines = new Lines();
let circles = new Circles();

// -------------------------------------------------------------------------------------------------------------
// Constants:

// 960 x 540
const canvasWidth = 672;
const canvasHeight = 378;

// Variables:
let imageCanvas = document.getElementById("imageCanvas");
let interactiveCanvas = document.getElementById("interactiveCanvas");

let imageContext = imageCanvas.getContext("2d");
let interactiveContext = interactiveCanvas.getContext("2d");

let image = new Image();

// locally first position (first point in line, first point in line of polygon)
let wasFirstClick = false;
let fx;
let fy;

// globally first position in polygon (starting position of the first line)
let px;
let py;

// constant delta for resolving if click was made on the initial point of the polygon
let pdeltax = 10;
let pdeltay = 10;

let isMouseDown = false;

let predicateNumber = 0;

let activeCanvas;
let activeContext;

jQuery.fn.extend({
    context2d: function () { return this[0].getContext("2d") },
    clearContext2d: function () { this.each(function () { this.getContext("2d").clearRect(0, 0, this.width, this.height) }) }
})

$("#predicateList").on('click', ".predicateItem", function () {
    //selectPredicate($(this).attr("layer"));
    selectPredicate(parseInt($(this).attr("layer")));
})

// -------------------------------------------------------------------------------------------------------------
// Key Manager:

let isShiftDown = false;
let isCtrlDown = false;

$(document).keydown(function (e) {
    if (e.key == "Shift") isShiftDown = true;
    if (e.key == "Control") isCtrlDown = true;
})

$(document).keyup(function (e) {
    if (e.key == "Shift") isShiftDown = false;
    if (e.key == "Control") isCtrlDown = false;
})

// Key Manager End

$(document).ready(function () {
    disableButtons(true);
    switchType("line");
})

$('form input[type="radio"]').each(function () {
    this.addEventListener('change', function () {
        switchType(this.value);
        console.log(this.value);
    })
})

function disableButtons(bool) {
    document.getElementById("removeSelectedPredicatesBtn").disabled = bool;
    document.getElementById("removeAllPredicatesBtn").disabled = bool;
}

function selectVideo() {
    let selectVideoButton = document.getElementById("selectVideoBtn");
    let videoSelector = document.getElementById("videoSelector");
    //selectVideoButton.disabled = true;
    //videoSelector.disabled = true;

    predicateNumber = 0;

    removeAllPredicates();
    //addPredicate();
    switchType("pen");

    image.onload = function () {
        imageContext.drawImage(this, 0, 0, canvasWidth, canvasHeight);
        selectVideoButton.disabled = false;
        videoSelector.disabled = false;
    }

    image.src = "http://195.113.19.174/camera.php?name=" + videoSelector.value;
}

function clearInteractiveCanvas() {
    interactiveContext.clearRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Clear predicate canvases.
 * @param {number[]} idxs Indexes of predicatess to clear.
 */
function clearPredicateCanvases(idxs) {
    if (!idxs) {
        $("#canvasWrapper .predicateCanvas").clearContext2d();
    }
    else {
        for (idx of idxs) {
            $(`#canvasWrapper .predicateCanvas[layer = ${idx}]`).clearContext2d();
        }
    }
}

function removeEventListeners() {
    interactiveCanvas.removeEventListener('mousedown', onMouseDownPen);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePen);
    interactiveCanvas.removeEventListener('mouseup', onMouseUpOutPen);
    interactiveCanvas.removeEventListener('mouseout', onMouseUpOutPen);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLine);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveLine);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLines);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveLines);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownPolygon);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePolygon);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownCircle);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveCircle);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownDirection);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveDirection);
}

function switchType(typeOfDrawing) {
    // clear canvas only if the drawing was not completed
    if (wasFirstClick) {
        clearInteractiveCanvas();
        clearPredicateCanvases(activeCanvas.getAttribute("layer"));
        wasFirstClick = false;
    }

    removeEventListeners();

    switch (typeOfDrawing) {
        case "pen":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPen);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePen);
            interactiveCanvas.addEventListener('mouseup', onMouseUpOutPen);
            interactiveCanvas.addEventListener('mouseout', onMouseUpOutPen);
            break;
        case "line":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLine);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveLine);
            break;
        case "lines":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLines);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveLines);
            break;
        case "polygon":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPolygon);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePolygon);
            break;
        case "direction":
            interactiveCanvas.addEventListener('mousedown', onMouseDownDirection);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveDirection);
            break;
        case "circle":
            interactiveCanvas.addEventListener('mousedown', onMouseDownCircle);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveCircle);
            break;
    }
}

// Pen

function onMouseDownPen(e) {
    // override default behaviour - move the selection by moving the mouse
    e.preventDefault();
    isMouseDown = true;
    addCanvas();
    addPredicate("pen");
    disableButtons(false);
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    [fx, fy] = [x, y];
}

function onMouseUpOutPen(e) {
    isMouseDown = false;
}

function onMouseMovePen(e) {
    if (isMouseDown) {
        const rect = activeCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.stroke();
        [fx, fy] = [x, y];
        //console.log(fx, fy);
    }
}

// Line

function onMouseDownLine(e) {
    if (!wasFirstClick)
        addCanvas();

    // set up current x, y
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    //console.log("Coordinate x: " + x, "Coordinate y: " + y);

    if (!wasFirstClick) {
        // create initiating point
        [fx, fy] = [x, y];
        wasFirstClick = true;
        points = [];
        points.push(new Point(x, y));

        addPredicate("line");
        disableButtons(false);
    }
    else {
        clearInteractiveCanvas();
        // draw a line from the initiating point
        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        wasFirstClick = false;
        points.push(new Point(x, y));

        // add this line to lines
        lines.AddLine(predicateNumber - 1, points[0], points[1], undefined);
        console.log("line added to lines");
    }
}

function onMouseMoveLine(e) {
    if (wasFirstClick) {
        clearInteractiveCanvas();
        const rect = interactiveCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        interactiveContext.beginPath();
        interactiveContext.moveTo(fx, fy);
        interactiveContext.lineTo(x, y);
        interactiveContext.closePath();
        interactiveContext.stroke();
    }
}

// Lines

function onMouseDownLines(e) {
    if (!wasFirstClick)
        addCanvas();

    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (!wasFirstClick) {
        [fx, fy] = [x, y];
        wasFirstClick = true;

        addPredicate("lines");
        disableButtons(false);
    }
    else {
        if (isShiftDown) {
            wasFirstClick = false;
            clearInteractiveCanvas();
        }

        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        [fx, fy] = [x, y];
    }
}

function onMouseMoveLines(e) {
    if (wasFirstClick) {
        clearInteractiveCanvas();
        const rect = interactiveCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        interactiveContext.beginPath();
        interactiveContext.moveTo(fx, fy);
        interactiveContext.lineTo(x, y);
        interactiveContext.closePath();
        interactiveContext.stroke();
    }
}

// Polygon

function onMouseDownPolygon(e) {
    if (!wasFirstClick)
        addCanvas();

    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    //console.log("Coordinate x: " + x, "Coordinate y: " + y);
    if (!wasFirstClick) {
        // if beginning to make a polygon, save initial point of the polygon
        [px, py] = [x, y];
        [fx, fy] = [x, y];
        wasFirstClick = true;

        points = [];
        points.push(new Point(x, y));

        addPredicate("polygon");
        disableButtons(false);
    }
    else {
        // if new point is close enough to the polygon initial point and shift is not pressed, close it
        if (px - x < pdeltax &&
            x - px < pdeltax &&
            py - y < pdeltay &&
            y - py < pdeltay &&
            !isShiftDown) {
            [x, y] = [px, py];
            wasFirstClick = false;

            // add this polygon to polygons
            polynoms.AddPolynom(predicateNumber - 1, points, undefined);
            console.log("polygon added to polygons");


            // also get rid of the interactive line
            clearInteractiveCanvas();
        }

        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        [fx, fy] = [x, y];

        if (wasFirstClick)
            points.push(new Point(x, y));
    }
}

function onMouseMovePolygon(e) {
    if (wasFirstClick) {
        clearInteractiveCanvas();
        const rect = interactiveCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // check if current point is close enough and shift is not pressed. snap to initial point if so
        if (px - x < pdeltax &&
            x - px < pdeltax &&
            py - y < pdeltay &&
            y - py < pdeltay &&
            !isShiftDown) {
            [x, y] = [px, py];
        }

        interactiveContext.beginPath();
        interactiveContext.moveTo(fx, fy);
        interactiveContext.lineTo(x, y);
        interactiveContext.closePath();
        interactiveContext.stroke();
    }
}

// Direction
function onMouseDownDirection(e) {
    if (!wasFirstClick) {
        addCanvas();
        addPredicate("direction");
        disableButtons(false);
        wasFirstClick = true;
    }
    else {
        wasFirstClick = false;
    }

    const rect = interactiveCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    activeContext.beginPath();
    activeContext.arc(x, y, 5, 0, 2 * Math.PI);
    activeContext.fill();
    activeContext.stroke();

}

function onMouseMoveDirection(e) {
    if (wasFirstClick) {

        clearInteractiveCanvas();
        const rect = interactiveCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        interactiveContext.beginPath();
        interactiveContext.arc(x, y, 5, 0, 2 * Math.PI);
        interactiveContext.fill();
        interactiveContext.stroke();
    }

}

// Circle
function onMouseDownCircle(e) {
    if (!wasFirstClick) {
        addCanvas();
    }

    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (!wasFirstClick) {
        [fx, fy] = [x, y];
        wasFirstClick = true;

        addPredicate("circle");
        disableButtons(false);
    }
    else {
        clearInteractiveCanvas();

        let [cx, cy] = [(x + fx) / 2, (y + fy) / 2];
        let d = Math.sqrt((x - fx) ** 2 + (y - fy) ** 2);

        activeContext.beginPath();
        activeContext.arc(cx, cy, d / 2, 0, 2 * Math.PI);
        activeContext.stroke();
        wasFirstClick = false;

        circles.AddCircle(predicateNumber - 1, new Point(cx, cy), d, undefined);
        console.log("circle added to circles");
    }
}

function onMouseMoveCircle(e) {
    if (wasFirstClick) {
        const rect = activeCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        clearInteractiveCanvas();

        let [cx, cy] = [(x + fx) / 2, (y + fy) / 2];
        let d = Math.sqrt((x - fx) ** 2 + (y - fy) ** 2);

        interactiveContext.beginPath();
        interactiveContext.arc(cx, cy, d / 2, 0, 2 * Math.PI);
        interactiveContext.stroke();
    }
}

// -------------------------------------------------------------------------------------------------------------
// Spacial predicates:

function addPredicate(typeOfDrawing) {
    let newPredicateItem = $(`<li>sp ${predicateNumber}: ${typeOfDrawing}</li>`)
        .addClass("predicateItem")
        .attr("layer", predicateNumber);
    $("#predicateList").append(newPredicateItem);

    selectPredicate(predicateNumber);
    predicateNumber++;
}

function addCanvas() {
    let newPredicateCanvas = $("<canvas></canvas>")
        .addClass("predicateCanvas")
        .attr("layer", predicateNumber)
        .attr("width", canvasWidth)
        .attr("height", canvasHeight);
    $("#canvasWrapper").append(newPredicateCanvas);

    switchActiveCanvas(predicateNumber);
}

function selectPredicate(predicateIdx) {
    if (isCtrlDown) {
        $(`#predicateList .predicateItem[layer = ${predicateIdx}]`).addClass("selected");
    }
    else {
        $("#predicateList .predicateItem.selected").removeClass("selected");
        $(`#predicateList .predicateItem[layer = ${predicateIdx}]`).addClass("selected");
    }
}

function removeAllPredicates() {
    $("#predicateList .predicateItem").remove();
    $("#canvasWrapper .predicateCanvas").remove();

    // clean up interactive canvas
    if (wasFirstClick) {
        clearInteractiveCanvas();
        wasFirstClick = false;
    }

    lines.RemoveEverything();
    polynoms.RemoveEverything();
    circles.RemoveEverything();

    disableButtons(true);
}

function removeSelectedPredicates() {
    let idxs = [];
    let idx;

    $("#predicateList .predicateItem").each(function () {
        if (this.classList.contains("selected")) {
            this.remove();
            idx = parseInt(this.getAttribute("layer"));
            idxs.push(idx);
            $(`#canvasWrapper .predicateCanvas[layer=${idx}]`).remove();
        }
    })

    // clean up interactive canvas
    if (wasFirstClick) {
        clearInteractiveCanvas();
        wasFirstClick = false;
    }

    lines.RemoveById(idxs);
    polynoms.RemoveById(idxs);
    circles.RemoveById(idxs);

    // if at least one predicateItem exists - select the last one
    if ($("#predicateList .predicateItem").length) {
        let layerToSelect = $("#predicateList .predicateItem").last().attr("layer");
        selectPredicate(layerToSelect);
    }
    else {
        disableButtons(true);
    }
}

function switchActiveCanvas(predicateIdx) {
    activeCanvas = $(`#canvasWrapper .predicateCanvas[layer = ${predicateIdx}]`)[0];
    activeContext = activeCanvas.getContext("2d");
}