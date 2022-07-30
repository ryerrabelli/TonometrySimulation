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

let zoomingLensController = {
  vel: {x:0,y:0},  // vel aka velocity
  accel: {x:0, y:0},
  setVelocity: function(x,y) {this.vel.x = x; this.vel.y = y;},
  setAcceleration: function(x,y) {this.accel.x = x; this.accel.y = y;},
  getLoc: function() {  // form top left corner
    let x = zoomingLens.computedStyleMap().get("left").value;
    let y = zoomingLens.computedStyleMap().get("top").value;
    return {x:x, y:y};
  },
  updatePosition: function() {
    this.vel.x += this.accel.x;
    this.vel.y += this.accel.y;
    let currentLoc = gatScreen.lensLoc; // this.getLoc()
    this.setLoc({
      x: currentLoc.x+this.vel.x,
      y: currentLoc.y+this.vel.y
    });
  },
  checkNewLoc: function(newLoc, doReturnValue=true) {
    /*prevent the zoomingLens from being positioned outside the image:*/
    let changedCt = 0;
    if (newLoc.x > origPhoto.width - zoomingLens.offsetWidth) {
      newLoc.x = origPhoto.width - zoomingLens.offsetWidth;
      changedCt++;
    }
    if (newLoc.x < 0) {
      newLoc.x = 0;
      changedCt++;
    }
    if (newLoc.y > origPhoto.height - zoomingLens.offsetHeight) {
      newLoc.y = origPhoto.height - zoomingLens.offsetHeight;
      changedCt++;
    }
    if (newLoc.y < 0) {
      newLoc.y = 0;
      changedCt++;
    }
    if (doReturnValue) {
      return newLoc;
    } else {
      return changedCt > 0;
    }
  },
  setLoc: function(loc) {
    /*set the position of the zoomingLens:*/
    zoomingLens.style.left = loc.x + "px";
    zoomingLens.style.top  = loc.y + "px";
    /*display what the zoomingLens "sees":*/
    zoomedPhoto.style.backgroundPosition = "-" + (loc.x * scaleRatio.x) + "px -" + (loc.y * scaleRatio.y) + "px";
    gatScreen.lensLoc.x = loc.x;
    gatScreen.lensLoc.y = loc.y;
  },
  checkAndSetLoc: function(newLoc) {
    newLoc = this.checkNewLoc(newLoc);
    this.setLoc(newLoc);
    return newLoc;
  },

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
  newLoc = zoomingLensController.checkAndSetLoc(newLoc);
  console.log("left/x: " + newLoc.x.toFixed(2) + ", top/y: " + newLoc.y.toFixed(2));
}

function moveZoomingLensByKey(dx, dy) {
  //console.assert(zoomingLens.computedStyleMap().get('left').unit === "px");
  //console.assert(zoomingLens.computedStyleMap().get('top').unit === "px");
  console.log(zoomingLens.computedStyleMap().get('left') );

  const currentLoc = zoomingLensController.getLoc();
  let newLoc = {x: currentLoc.x + dx, y: currentLoc.y + dy};

  newLoc = zoomingLensController.checkAndSetLoc(newLoc);
  //zoomingLensController.setLoc(newLoc);
  console.log("left/x: " + newLoc.x.toFixed(2) + ", top/y: " + newLoc.y.toFixed(2));
}
