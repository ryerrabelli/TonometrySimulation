import {lens, ZLC, gatScreen, canvasSz} from "./GATsimulation.js";
import {isNullOrUndef, areArraysEqual, numberDictToStr} from "./helper.js";
import {Joy} from "./joystick.js";

export let origPhoto, zoomingLens;

class Person {
  constructor(filenameBase, extension="jpg", pathToFolder="data/") {
    this.filenameBase = filenameBase;
    this.pathToFolder = pathToFolder;
    this.extension = extension;
  }
  get pathResLow() {
    return this.pathToFolder + this.filenameBase + "-res-low"  + "." + this.extension;
  }
  get pathResHigh() {
    return this.pathToFolder + this.filenameBase + "-res-high" + "." + this.extension;
  }
  get name() {
    return this.filenameBase.split("-")[0]
  }
}


export function moveZoomingLensByJoystick(joyNormHor, joyNormVer, joyNormDir) {
  const oldLoc = Object.assign({}, gatScreen.lens.loc);  // copy
  // inputs are normalized [0,1] so need to convert them to canvas coordinates
  const scaledLoc = gatScreen.lens.getNormToScaled({"s":joyNormVer, "x":joyNormHor, "y": joyNormDir});
  const newLoc = gatScreen.lens.checkAndSetLoc(scaledLoc);
  const movedDistanceSq = (newLoc.x-oldLoc.x)**2 + (newLoc.y-oldLoc.y)**2;
  if (movedDistanceSq > 1.44) gatScreen.hasMovedByJoystick = true;
  return newLoc;
}
function moveZoomingLensByHover(event) {
  /*get the cursor's x and y positions:*/
  let pos = getCursorPos(event);
  /*calculate the position of the zoomingLens:*/
  let selectedLoc = {
    x: pos.x - (zoomingLens.offsetWidth / 2),
    y: pos.y - (zoomingLens.offsetHeight / 2),
  }
  const oldLoc = Object.assign({}, gatScreen.lens.loc);  // copy
  const newLoc = gatScreen.lens.checkAndSetLoc(selectedLoc);
  const movedDistanceSq = (newLoc.x-oldLoc.x)**2 + (newLoc.y-oldLoc.y)**2;
  if (movedDistanceSq > 1.44) gatScreen.hasMovedByHover = true;
  return newLoc;
}

// https://www.w3schools.com/graphics/game_intro.asp
// Original source: https://www.w3schools.com/howto/howto_js_image_zoom.asp
export function setUpPhotoZooming(origPhotoID, zoomingLensID) {
  origPhoto = document.getElementById(origPhotoID);
  zoomingLens = document.getElementById(zoomingLensID);
  const persons = [
    new Person("Ashkhan-Hojati-008-cropped-square"),
    new Person("Rahul-Yerrabelli-005-cropped-square"),
  ]

  const urlParams = new URLSearchParams(window.location.search);
  // Decide which photo to use based on the GET URL param (url ending with <url>/?personID=0)
  const personID = urlParams.has("personID") ? urlParams.get("personID") : 0;
  // Added all the photo options
  for (let i = 0; i < persons.length; i++) {
    $("#persons-selector").append($("<option>", {
      value: i,
      text: persons[i].name,
      selected: i==personID,
    }));
  }

  origPhoto.src = persons[personID].pathResLow;

  updateZoom()

  /*execute a function when someone moves the cursor over the image, or the zoomingLens:*/

  // Check if the device support the touch or not
  if ("ontouchstart" in document.documentElement) {
    zoomingLens.addEventListener("touchstart", onZoomingLensTouchStart, false);
    zoomingLens.addEventListener("touchmove", onZoomingLensTouchMove, false);
    zoomingLens.addEventListener("touchend", onZoomingLensTouchEnd, false);
    origPhoto.addEventListener("touchstart", onZoomingLensTouchStart, false);
    origPhoto.addEventListener("touchmove", onZoomingLensTouchMove, false);
    origPhoto.addEventListener("touchend", onZoomingLensTouchEnd, false);
  } else {
    zoomingLens.addEventListener("mousedown", onZoomingLensMouseDown, false);
    zoomingLens.addEventListener("mousemove", onZoomingLensMouseMove, false);
    zoomingLens.addEventListener("mouseup", onZoomingLensMouseUp, false);
    origPhoto.addEventListener("mousedown", onZoomingLensMouseDown, false);
    origPhoto.addEventListener("mousemove", onZoomingLensMouseMove, false);
    origPhoto.addEventListener("mouseup", onZoomingLensMouseUp, false);
  }

  origPhoto.style.width    = canvasSz.wd + "px";
  origPhoto.style.height   = canvasSz.ht + "px";
}



export function updateZoom() {  // update with the latest values of lens size and loc
  if (!isNullOrUndef(Joy)) {
    // negate the vertical variable so top of the screen is higher numbers
    const normLoc = gatScreen.lens.getScaledToNorm(gatScreen.lens.loc);
    Joy.setNormLoc(normLoc.x, normLoc.s, 1-normLoc.y);
  }
  //console.log(gatScreen.lens.loc)
  /*set the sizing of the zoomingLens and */
  zoomingLens.style.width  = gatScreen.lens.sz.wd + "px";
  zoomingLens.style.height = gatScreen.lens.sz.ht + "px";
  /*set the position of the zoomingLens:*/
  zoomingLens.style.left = gatScreen.lens.loc.x + "px";
  zoomingLens.style.top  = gatScreen.lens.loc.y + "px";
}

function getCursorPos(event) {
  event = event || window.event;
  /*get the x and y positions of the image:*/
  let a = origPhoto.getBoundingClientRect();
  /*calculate the cursor's x and y coordinates, relative to the image:*/
  let x = event.pageX - a.left;
  let y = event.pageY - a.top;
  /*consider any page scrolling:*/
  x = x - window.pageXOffset;
  y = y - window.pageYOffset;
  return {x : x, y : y};
}

let zoomingLensMousePressed = 0;
function onZoomingLensMouseDown(event, button=null) {
  if (isNullOrUndef(button)) button = event.button;
  if (button===0) {  // 0 is left click, 1 is middle, 2 is right click
    zoomingLensMousePressed = 1;
    moveZoomingLensByHover(event);
  }
}
function onZoomingLensMouseUp(event) {
  zoomingLensMousePressed = 0;
}
function onZoomingLensMouseMove(event) {
  if (zoomingLensMousePressed===1) {
    /*prevent any other actions that may occur when moving over the image:*/
    event.preventDefault();
    moveZoomingLensByHover(event)
  }
}
function onZoomingLensTouchStart(event) {
  onZoomingLensMouseDown(event, 0);  // make button 0 to assume left click
}
function onZoomingLensTouchMove(event) {
  if (event.targetTouches[0].target === gatScreen.canvas) {
    onZoomingLensMouseMove(event);
  }
}
function onZoomingLensTouchEnd(event) {
  onZoomingLensMouseUp(event);
}

