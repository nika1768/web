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

// Key Manager

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

let mouseIsDown = false;

$(document).mousedown(function (e) {
    mouseIsDown = true;
    console.log("mouse is down");
})

$(document).mouseup(function (e) {
    mouseIsDown = false;
    console.log("mouse is up");
})



$(document).ready(function () {
    disableButtons(true);
    switchType("pen");
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

function clearInteractiveLayer() {
    interactiveContext.clearRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Clear layer canvases.
 * @param {number[]} idxs Indexes of layers to clear.
 */
function clearLayers(idxs) {
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

    interactiveCanvas.removeEventListener('mouseenter', onMouseEnterDirection);
    interactiveCanvas.removeEventListener('mouseout', onMouseOutDirection);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveDirection);
}

function switchType(typeOfDrawing) {
    // clear canvas only if the drawing was not completed
    if (wasFirstClick) {
        clearInteractiveLayer();
        clearLayers(activeCanvas.getAttribute("layer"));
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
            interactiveCanvas.addEventListener('mouseenter', onMouseEnterDirection);
            interactiveCanvas.addEventListener('mouseout', onMouseOutDirection);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveDirection);
        case "ellipse":
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

        addPredicate("line");
        disableButtons(false);
    }
    else {
        clearInteractiveLayer();
        // draw a line from the initiating point
        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        wasFirstClick = false;
    }
}

function onMouseMoveLine(e) {
    if (wasFirstClick) {
        clearInteractiveLayer();
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

    // TODO
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
            clearInteractiveLayer();
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
        clearInteractiveLayer();
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

    // TODO
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

            // also get rid of the interactive line
            clearInteractiveLayer();
        }

        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        [fx, fy] = [x, y];
    }
}

function onMouseMovePolygon(e) {
    if (wasFirstClick) {
        clearInteractiveLayer();
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

// direction

function onMouseEnterDirection(e) {
    if (mouseIsDown) {
        addCanvas();
        addPredicate("direction");
        disableButtons(false);

        const rect = activeCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        console.log("Coordinate x: " + x, "Coordinate y: " + y);
    
        [fx, fy] = [x, y];

        activeContext.beginPath();
        activeContext.arc(x, y, 5, 0, 2 * Math.PI);
        activeContext.fill();
        activeContext.stroke();
    }
}

function onMouseOutDirection(e) {
    if (mouseIsDown) {
        const rect = activeCanvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.stroke();
        [fx, fy] = [x, y];

        activeContext.beginPath();
        activeContext.arc(x, y, 5, 0, 2 * Math.PI);
        activeContext.fill();
        activeContext.stroke();
    
        clearInteractiveLayer();
    }
}

function onMouseMoveDirection(e) {
    if (mouseIsDown) {
        clearInteractiveLayer();
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

// -------------------------------------------------------------------------------------------------------------
// spacial predicates

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

    // clean up interactive layer
    if (wasFirstClick) {
        clearInteractiveLayer();
        wasFirstClick = false;
    }

    disableButtons(true);
}

function removeSelectedPredicates() {
    $("#predicateList .predicateItem").each(function () {
        if (this.classList.contains("selected")) {
            this.remove();
            $(`#canvasWrapper .predicateCanvas[layer=${this.getAttribute("layer")}]`).remove();
        }
    })

    // clean up interactive layer
    if (wasFirstClick) {
        clearInteractiveLayer();
        wasFirstClick = false;
    }

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