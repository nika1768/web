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

let layerCount = 0;
let layerNumber = 0;

let activeCanvas;
let activeContext;

jQuery.fn.extend({
    context2d: function () { return this[0].getContext("2d") },
    clearContext2d: function () { this.each(function () { this.getContext("2d").clearRect(0, 0, this.width, this.height) }) }
})

$("#layerList").on('click', ".layerItem", function () {
    //selectLayer($(this).attr("layer"));
    selectLayer(parseInt($(this).attr("layer")));
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

$(document).ready(function () {
    addLayer();
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

    layerCount = 0;
    layerNumber = 0;

    removeAllLayers();
    clearCanvas();
    addLayer();
    switchType("pen");

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
    if (!idxs) {
        $("#canvasWrapper .layerCanvas").clearContext2d();
    }
    else {
        for (idx of idxs) {
            $(`#canvasWrapper .layerCanvas[layer = ${idx}]`).clearContext2d();
        }
    }
}

function switchType(typeOfdrawing) {
    // remove all event listeners
    interactiveCanvas.removeEventListener('mousedown', onMouseDownPen);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePen);
    interactiveCanvas.removeEventListener('mouseup', onMouseUpPen);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLine);
    interactiveCanvas.removeEventListener('mousemove', onMouseUpdateLine);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownLines);
    interactiveCanvas.removeEventListener('mousemove', onMouseMoveLines);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownPolygon);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePolygon);

    switch (typeOfdrawing) {
        case "pen":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPen);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePen);
            interactiveCanvas.addEventListener('mouseup', onMouseUpPen);
            break;
        case "line":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLine);
            interactiveCanvas.addEventListener('mousemove', onMouseUpdateLine);
            break;
        case "lines":
            interactiveCanvas.addEventListener('mousedown', onMouseDownLines);
            interactiveCanvas.addEventListener('mousemove', onMouseMoveLines);
            break;
        case "polygon":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPolygon);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePolygon);
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

function onMouseUpdateLine(e) {
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
    const rect = activeCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (!wasFirstClick) {
        [fx, fy] = [x, y];
        wasFirstClick = true;
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

// layers

function addLayer() {
    let newLayerItem = $(`<li>Layer${layerNumber}</li>`)
        .addClass("layerItem")
        .attr("layer", layerNumber);
    $("#layerList").append(newLayerItem);

    let newLayerCanvas = $("<canvas></canvas>")
        .addClass("layerCanvas")
        .attr("layer", layerNumber)
        .attr("width", canvasWidth)
        .attr("height", canvasHeight);
    $("#canvasWrapper").append(newLayerCanvas);

    layerCount++;
    layerNumber++;

    if (layerCount == 1) {
        switchActiveCanvas();
    }
}

function selectLayer(layerIdx) {
    if (isCtrlDown) {
        $(`#layerList .layerItem[layer = ${layerIdx}]`).addClass("selected");
    }
    else {
        $("#layerList .layerItem.selected").removeClass("selected");
        $(`#layerList .layerItem[layer = ${layerIdx}]`).addClass("selected");
        switchActiveCanvas(layerIdx);
    }
}

function removeAllLayers() {
    $("#layerList .layerItem").remove();
    $("#canvasWrapper .layerCanvas").remove();
    layerCount = 0;
}

function removeSelectedLayers() {
    $("#layerList .layerItem").each(function () {
        if (this.classList.contains("selected")) {
            this.remove();
            layerCount--;
            $(`#canvasWrapper .layerCanvas[layer=${this.getAttribute("layer")}]`).remove();
        }
    })

    // at least one layerItem exists - switch active canvas
    if ($("#layerList .layerItem").length) {
        switchActiveCanvas();
    }
}

function switchActiveCanvas(layerIdx) {
    // index is not specified
    if (!layerIdx) {
        let layerToSelect;
        // at least one layerItem is selected - switch active canvas to the first selected one
        if ($("#layerList .layerItem").hasClass("selected")) {
            layerToSelect = $("#layerList .layerItem.selected").first();
            layerIdx = layerToSelect.attr("layer");
        }
        // nothing is selected, select the first one from the list
        else {
            layerToSelect = $("#layerList .layerItem").first();
            layerToSelect.addClass("selected");
            layerIdx = layerToSelect.attr("layer");
        }
    }

    activeCanvas = $(`#canvasWrapper .layerCanvas[layer = ${layerIdx}]`)[0];
    activeContext = activeCanvas.getContext("2d");
}

// :)