
let origPhoto, zoomingLens, zoomedPhoto;

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


// https://www.w3schools.com/graphics/game_intro.asp
// Original source: https://www.w3schools.com/howto/howto_js_image_zoom.asp
function setUpPhotoZooming(origPhotoID, zoomedPhotoID, zoomingLensID) {
  origPhoto = document.getElementById(origPhotoID);
  zoomedPhoto = document.getElementById(zoomedPhotoID);
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

  /*set background properties for the zoomedPhoto DIV:*/
  zoomedPhoto.style.backgroundImage = `url("${persons[personID].pathResHigh}")`
  updateZoom()

  /*execute a function when someone moves the cursor over the image, or the zoomingLens:*/
  zoomingLens.addEventListener("mousemove", moveZoomingLensByHover);
  origPhoto.addEventListener("mousemove", moveZoomingLensByHover);
  /*and also for touch screens:*/
  zoomingLens.addEventListener("touchmove", moveZoomingLensByHover);
  origPhoto.addEventListener("touchmove", moveZoomingLensByHover);

  origPhoto.style.width    = canvasSz.wd + "px";
  origPhoto.style.height   = canvasSz.ht + "px";
  zoomedPhoto.style.width  = canvasSz.wd + "px";
  zoomedPhoto.style.height = canvasSz.ht + "px";
}

function updateZoom() {  // update with the latest values of lens size and loc
  const normLoc = gatScreen.lens.getScaledToNorm(gatScreen.lens.loc);
  if (!isNullOrUndef(Joy)) {
    //console.log( "["+normLoc.x.toFixed(2) + "," + normLoc.y.toFixed(2) + "," + normLoc.s.toFixed(2) + "]")
    Joy.SetNormLoc(normLoc.x, normLoc.s);
  }

  /*set the sizing of the zoomingLens and */
  zoomingLens.style.width  = gatScreen.lens.sz.wd + "px";
  zoomingLens.style.height = gatScreen.lens.sz.ht + "px";
  zoomedPhoto.style.backgroundSize = (canvasSz.wd * gatScreen.lens.loc.s) + "px " + (canvasSz.ht * gatScreen.lens.loc.s) + "px";
  /*set the position of the zoomingLens:*/
  zoomingLens.style.left = gatScreen.lens.loc.x + "px";
  zoomingLens.style.top  = gatScreen.lens.loc.y + "px";
  //console.log(gatScreen.lens.loc);
  /*display what the zoomingLens "sees":*/
  zoomedPhoto.style.backgroundPosition = "-" + (gatScreen.lens.loc.x * gatScreen.lens.loc.s) + "px -" + (gatScreen.lens.loc.y * gatScreen.lens.loc.s) + "px";

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

function moveZoomingLensByHover(event) {
  let pos;
  /*prevent any other actions that may occur when moving over the image:*/
  event.preventDefault();
  /*get the cursor's x and y positions:*/
  pos = getCursorPos(event);
  /*calculate the position of the zoomingLens:*/
  let selectedLoc = {
    x: pos.x - (zoomingLens.offsetWidth / 2),
    y: pos.y - (zoomingLens.offsetHeight / 2),
  }
  let newLoc = gatScreen.lens.checkAndSetLoc(selectedLoc);
  //console.log(selectedLoc, newLoc);
}

function moveZoomingLensByJoystick(joyNormHor, joyNormVer) {
  const scaledLoc = gatScreen.lens.getNormToScaled({"s":joyNormVer, "x":joyNormHor})
  let newLoc = gatScreen.lens.checkAndSetLoc(scaledLoc);
}
