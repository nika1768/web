// Constants:
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

let previousRadioButton = null;

let isMouseDown = false;

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


$(document).ready(function () {
    switchType("pen");
})

$('form input[type="radio"]').each(function () {
    this.addEventListener('change', function () {
        switchType(this.value);
        console.log(this.value);
    })
})

function selectVideo() {
    let selectVideoButton = document.getElementById("selectVideoButton");
    let videoSelector = document.getElementById("videoSelector");
    selectVideoButton.disabled = true;
    videoSelector.disabled = true;
    clearCanvas();
    removeLayers();

    image.onload = function () {
        imageContext.drawImage(this, 0, 0, canvasWidth, canvasHeight);
        selectVideoButton.disabled = false;
        videoSelector.disabled = false;
    }

    image.src = "http://195.113.19.174/camera.php?name=" + videoSelector.value;
}

function clearCanvas() {
    clearInteractiveLayer();
    clearLayers();
    wasFirstClick = false;
}

function clearInteractiveLayer() {
    interactiveContext.clearRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Clear layer canvases.
 * @param {number[]} idxs Indexes of layers to clear.
 */
function clearLayers(idxs) {
    if (!idxs)
        idxs = [...Array(layerCount).keys()]

    for (idx of idxs)
        canvases[idx][0].getContext("2d").clearRect(0, 0, canvasWidth, canvasHeight);
}

function switchType(typeOfdrawing) {
    clearCanvas();

    // remove all event listeners
    interactiveCanvas.removeEventListener('mousedown', onMouseDownPen);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePen);
    interactiveCanvas.removeEventListener('mouseup', onMouseUpPen);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLine);
    interactiveCanvas.removeEventListener('mousemove', onMouseUpdateLine);
    //interactiveCanvas.removeEventListener('mouseenter', onMouseUpdateLine);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLines);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveLines);
    //interactiveCanvas.removeEventListener('mouseup', onMouseUpLines);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownPolygon);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePolygon);
    //interactiveCanvas.removeEventListener('mouseup', onMouseUpPolygon);

    switch (typeOfdrawing) {
        case "pen":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPen);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePen);
            interactiveCanvas.addEventListener('mouseup', onMouseUpPen);
            break;
        case "line":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLine);
            interactiveCanvas.addEventListener('mousemove', onMouseUpdateLine);
            //interactiveCanvas.addEventListener('mouseenter', onMouseUpdateLine);
            break;
        case "lines":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLines);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveLines);
            //interactiveCanvas.addEventListener('mouseup', onMouseUpLines);
            break;
        case "polygon":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPolygon);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePolygon);
            //interactiveCanvas.addEventListener('mouseup', onMouseUpPolygon);
            break;
    }
}

// Pen

function onMouseDownPen(e) {
    isMouseDown = true;
    const rect = activeCanvas.getBoundingClientRect();
    [fx, fy] = [e.clientX - rect.left, e.clientY - rect.top];
}
function onMouseUpPen(e) {
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

    // set up current x, y
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    //console.log("Coordinate x: " + x, "Coordinate y: " + y);

    if (!wasFirstClick) {
        // create initiating point
        [fx, fy] = [x, y];
        wasFirstClick = true;
    }
    else {
        // draw a line from the initiating point
        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        wasFirstClick = false;
    }
}

function onMouseUpdateLine(e) {
    if (wasFirstClick) {
        interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
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
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (!wasFirstClick) {
        [fx, fy] = [x, y];
        wasFirstClick = true;
    }
    else {
        if (isShiftDown)
            wasFirstClick = false;

        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        [fx, fy] = [x, y];
    }
}

function onMouseUpLines(e) {
    isMouseDown = false;
}

function onMouseMoveLines(e) {
    if (wasFirstClick) {
        interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
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
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    //console.log("Coordinate x: " + x, "Coordinate y: " + y);
    if (!wasFirstClick) {
        // if beginning to make a polygon, save initial point of the polygon
        [px, py] = [x, y];
        [fx, fy] = [x, y];
        wasFirstClick = true;
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
            interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
        }

        activeContext.beginPath();
        activeContext.moveTo(fx, fy);
        activeContext.lineTo(x, y);
        activeContext.closePath();
        activeContext.stroke();
        [fx, fy] = [x, y];
    }
}

function onMouseUpPolygon(e) {
    isMouseDown = false;
}

function onMouseMovePolygon(e) {
    if (wasFirstClick) {
        interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
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


// layer logic

let layerCount = 1;
/** Layer onto which it is currently drawn. */
let activeLayerIdx = 0;
/** List of indexes which are currently selected in the layer manager. */
let selectedLayerIdxs = [0];
/** List of <li> elements in the layer manager. */
let layers = [$(".layerItem")];
/** List of interactive (drawable) <canvas>. */
let canvases = [$(".layerCanvas")];

let activeCanvas = canvases[activeLayerIdx][0];
let activeContext = activeCanvas.getContext("2d");

$("#layerList").on('click', ".layerItem", function () {
    selectLayer($(this).attr("layer"));
})

function addLayer() {
    let newLayerItem = $(`<li>Layer${layerCount}</li>`)
        .addClass("layerItem")
        .attr("layer", layerCount);
    layers.push(newLayerItem);
    $("#layerList").append(newLayerItem);

    let newLayerCanvas = $("<canvas></canvas>")
        .addClass("layerCanvas")
        .attr("layer", layerCount);
    // width, height
    canvases.push(newLayerCanvas);
    $("#canvasWrapper").append(newLayerCanvas);

    layerCount++;
}

function selectLayer(layerIdx) {
    if (isCtrlDown) {
        layers[layerIdx].addClass("selected");
        selectedLayerIdxs.push(layerIdx);
    }
    else {
        for (let idx of selectedLayerIdxs)
            layers[idx].removeClass("selected");

        layers[layerIdx].addClass("selected");
        selectedLayerIdxs = [layerIdx];
    }
}

function removeLayers(idxs) {
    if (!idxs)
        idxs = [...Array(layerCount).keys()]

    // remove html elements
    for (idx of idxs) {
        if (idx != 0) {
            layers[idx].remove();
            layerCount--;
            canvases[idx].remove();
        }
    }

    // TODO
    layers = [$(".layerItem")];
    canvases = [$(".layerCanvas")];

    /*
    // remove array elements
    for (idx of idxs) {
        if (idx != 0) {
            layers.splice(idx, 1);
            layerCount--;
            canvases.splice(idx, 1);
        }
    }
    */

    // select layer 0
    layers[0].addClass("selected");
    selectedLayerIdxs = [0];
}

function removeSelectedLayers() {
    // TODO - pouzit arraye, ktore su vytvorene
    //$(".layerItem.selected[layer != 0]").remove();
    //layers = [$(".layerItem")];
    //canvases = [$(".layerCanvas")];

    // TODO - select 1st layer in array
}