let scaleRatio = {};
let origPhoto, zoomingLens, zoomedPhoto;

// https://www.w3schools.com/graphics/game_intro.asp
// Original source: https://www.w3schools.com/howto/howto_js_image_zoom.asp
function setUpPhotoZooming(origPhotoID, zoomedPhotoID, zoomingLensID) {
  origPhoto = document.getElementById(origPhotoID);
  zoomedPhoto = document.getElementById(zoomedPhotoID);
  zoomingLens = document.getElementById(zoomingLensID);

  /*calculate the magnification by calculating the ratio between zoomedPhoto div (output) and zoomingLens (input):*/
  scaleRatio.x = zoomedPhoto.offsetWidth / zoomingLens.offsetWidth;
  scaleRatio.y = zoomedPhoto.offsetHeight / zoomingLens.offsetHeight;

  // values depend on the defined css values
  // orig 300 40 7.5 300 40 7.5
  // changed to 360 36 10 360 36 10
  // console.log(zoomedPhoto.offsetWidth, zoomingLens.offsetWidth, scaleRatio.x, zoomedPhoto.offsetHeight, zoomingLens.offsetHeight, scaleRatio.y)

  /*set background properties for the zoomedPhoto DIV:*/
  zoomedPhoto.style.backgroundImage = "url('" + origPhoto.src + "')";
  zoomedPhoto.style.backgroundSize = (origPhoto.width * scaleRatio.x) + "px " + (origPhoto.height * scaleRatio.y) + "px";
  /*execute a function when someone moves the cursor over the image, or the zoomingLens:*/
  zoomingLens.addEventListener("mousemove", moveZoomingLensByHover);
  origPhoto.addEventListener("mousemove", moveZoomingLensByHover);
  /*and also for touch screens:*/
  zoomingLens.addEventListener("touchmove", moveZoomingLensByHover);
  origPhoto.addEventListener("touchmove", moveZoomingLensByHover);
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
  let newLoc = {
    x: pos.x - (zoomingLens.offsetWidth / 2),
    y: pos.y - (zoomingLens.offsetHeight / 2)
  }
  newLoc = gatScreen.lens.checkAndSetLoc(newLoc);
  //console.log("left/x: " + newLoc.x.toFixed(2).padStart(7," ") + ", top/y: " + newLoc.y.toFixed(2).padStart(7," "));
}

function moveZoomingLensByKey(dx, dy) {
  //console.assert(zoomingLens.computedStyleMap().get('left').unit === "px");
  //console.assert(zoomingLens.computedStyleMap().get('top').unit === "px");
  console.log(zoomingLens.computedStyleMap().get('left') );

  const currentLoc = gatScreen.lens.getLoc();
  let newLoc = {x: currentLoc.x + dx, y: currentLoc.y + dy};

  newLoc = gatScreen.lens.checkAndSetLoc(newLoc);
  //gatScreen.lens.setLoc(newLoc);
}
