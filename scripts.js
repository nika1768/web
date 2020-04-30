$(document).ready(function () {
    Switch("pen");
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

function SelectVideo() {
    let selectVideoButton = document.getElementById("selectVideoButton");
    let videoSelector = document.getElementById("videoSelector");
    selectVideoButton.disabled = true;
    videoSelector.disabled = true;
    Clear();

    image.onload = function () {
        imageContext.drawImage(this, 0, 0, imageCanvas.width, imageCanvas.height);

        selectVideoButton.disabled = false;
        videoSelector.disabled = false;
    }

    image.src = "http://195.113.19.174/camera.php?name=" + videoSelector.value;
}

function StopVideo() {
    Clear();
}

function Clear() {
    permanentContext.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
    interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
}


// Variables:
let imageCanvas = document.getElementById("imageCanvas");
let permanentCanvas = document.getElementById("permanentCanvas");
let interactiveCanvas = document.getElementById("interactiveCanvas");

let imageContext = imageCanvas.getContext("2d");
let permanentContext = permanentCanvas.getContext("2d");
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

// Code:

$('form input[type="radio"]').each(function () {
    this.addEventListener('change', function () {
        Switch(this.value);
        console.log(this.value);
    })
})

function Switch(typeOfdrawing) {
    interactiveContext.clearRect(0,0,interactiveCanvas.width,interactiveCanvas.height);
    wasFirstClick = false;

    // remove all
    interactiveCanvas.removeEventListener('mousedown', onMouseClickLine);
    interactiveCanvas.removeEventListener('mousemove', onMouseUpdateLine);
    interactiveCanvas.removeEventListener('mouseenter', onMouseUpdateLine);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownPen);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePen);
    interactiveCanvas.removeEventListener('mouseup', onMouseUpPen);

    interactiveCanvas.removeEventListener('mousedown', onMouseDownPolygon);
    interactiveCanvas.removeEventListener('mousemove', onMouseMovePolygon);
    interactiveCanvas.removeEventListener('mouseup', onMouseUpPolygon);

    switch (typeOfdrawing) {
        case "pen":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPen);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePen);
            interactiveCanvas.addEventListener('mouseup', onMouseUpPen);
            break;
        case "line":
            interactiveCanvas.addEventListener('mousedown', onMouseClickLine);
            interactiveCanvas.addEventListener('mousemove', onMouseUpdateLine);
            interactiveCanvas.addEventListener('mouseenter', onMouseUpdateLine);
            break;
        case "polygon":
            interactiveCanvas.addEventListener('mousedown', onMouseDownPolygon);
            interactiveCanvas.addEventListener('mousemove', onMouseMovePolygon);
            interactiveCanvas.addEventListener('mouseup', onMouseUpPolygon);
            break;
    }
}

// Line

function onMouseClickLine(e) {

    // set up current x, y
    let rect = permanentCanvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log("Coordinate x: " + x,
        "Coordinate y: " + y);

    if (!wasFirstClick) {
        // create initiating point
        fx = x;
        fy = y;
        wasFirstClick = true;
    }
    else {
        // draw a line from the initiating point
        permanentContext.beginPath();
        permanentContext.moveTo(fx, fy);
        permanentContext.lineTo(x, y);
        permanentContext.closePath();
        permanentContext.stroke();
        wasFirstClick = false;
    }
}

function onMouseUpdateLine(e) {
    if (wasFirstClick) {
        interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
        let rect = interactiveCanvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        interactiveContext.beginPath();
        interactiveContext.moveTo(fx, fy);
        interactiveContext.lineTo(x, y);
        interactiveContext.closePath();
        interactiveContext.stroke();
    }
}

// Pen

function onMouseDownPen(e) {
    isMouseDown = true;
    [fx, fy] = [e.offsetX, e.offsetY];
}
function onMouseUpPen(e) {
    isMouseDown = false;
}
function onMouseMovePen(e) {
    if (isMouseDown) {
        const newX = e.offsetX;
        const newY = e.offsetY;
        permanentContext.beginPath();
        permanentContext.moveTo(fx, fy);
        permanentContext.lineTo(newX, newY);
        permanentContext.stroke();
        //[x, y] = [newX, newY];
        fx = newX;
        fy = newY;
        console.log(fx, fy);
    }
}

// Polygon

function onMouseDownPolygon(e) {
    let rect = permanentCanvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log("Coordinate x: " + x,
        "Coordinate y: " + y);
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

        permanentContext.beginPath();
        permanentContext.moveTo(fx, fy);
        permanentContext.lineTo(x, y);
        permanentContext.closePath();
        permanentContext.stroke();
        [fx, fy] = [x, y];
    }
}

function onMouseUpPolygon(e) {
    isMouseDown = false;
}

function onMouseMovePolygon(e) {
    if (wasFirstClick) {
        interactiveContext.clearRect(0, 0, interactiveCanvas.width, interactiveCanvas.height);
        let rect = interactiveCanvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

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

// layer logick

let layerCount = 1;
let selectedLayerIdxs = [0];
let layers = [$(".layerItem")];
let canvases = [$(".layerCanvas")];
$("#layerList").on('click',".layerItem",function(){
    selectLayer($(this).attr("layer"));
})

function addLayer()
{
    let newLayerItem = $(`<li>Layer${layerCount}</li>`)
                        .addClass("layerItem")
                        .attr("layer",layerCount);
    layers.push(newLayerItem);
    $("#layerList").append(newLayerItem);

    layerCount++;
}

function selectLayer(layerIdx)
{
    if(isCtrlDown)
    {
        layers[layerIdx].addClass("selected");
        selectedLayerIdxs.push(layerIdx);
    }
    else
    {
        for(let idx of selectedLayerIdxs)
            layers[idx].removeClass("selected");
        layers[layerIdx].addClass("selected");
        selectedLayerIdxs = [layerIdx];
    }
}