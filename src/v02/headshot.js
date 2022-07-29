// Original source: https://www.w3schools.com/howto/howto_js_image_zoom.asp
function setUpPhotoZooming(origPhotoID, zoomedPhotoID) {
  var origPhoto, zoomingLens, zoomedPhoto, cx, cy;
  origPhoto = document.getElementById(origPhotoID);
  zoomedPhoto = document.getElementById(zoomedPhotoID);

  /*create  and insertzoomingLens:*/
  zoomingLens = document.createElement("div");
  zoomingLens.setAttribute("class", "img-zooming-lens");
  /*insert zoomingLens:*/
  origPhoto.parentElement.insertBefore(zoomingLens, origPhoto);
  /*calculate the magnification by calculating the ratio between zoomedPhoto div (output) and zoomingLens (input):*/
  cx = zoomedPhoto.offsetWidth / zoomingLens.offsetWidth;
  cy = zoomedPhoto.offsetHeight / zoomingLens.offsetHeight;

  // values depend on the defined css values
  // orig 300 40 7.5 300 40 7.5
  // changed to 360 36 10 360 36 10
  // console.log(zoomedPhoto.offsetWidth, zoomingLens.offsetWidth, cx, zoomedPhoto.offsetHeight, zoomingLens.offsetHeight, cy)

  /*set background properties for the zoomedPhoto DIV:*/
  zoomedPhoto.style.backgroundImage = "url('" + origPhoto.src + "')";
  zoomedPhoto.style.backgroundSize = (origPhoto.width * cx) + "px " + (origPhoto.height * cy) + "px";
  /*execute a function when someone moves the cursor over the image, or the zoomingLens:*/
  zoomingLens.addEventListener("mousemove", moveZoomingLens);
  origPhoto.addEventListener("mousemove", moveZoomingLens);
  /*and also for touch screens:*/
  zoomingLens.addEventListener("touchmove", moveZoomingLens);
  origPhoto.addEventListener("touchmove", moveZoomingLens);

  function moveZoomingLens(e) {
    var pos, x, y;
    /*prevent any other actions that may occur when moving over the image:*/
    e.preventDefault();
    /*get the cursor's x and y positions:*/
    pos = getCursorPos(e);
    /*calculate the position of the zoomingLens:*/
    x = pos.x - (zoomingLens.offsetWidth / 2);
    y = pos.y - (zoomingLens.offsetHeight / 2);
    /*prevent the zoomingLens from being positioned outside the image:*/
    if (x > origPhoto.width - zoomingLens.offsetWidth) {x = origPhoto.width - zoomingLens.offsetWidth;}
    if (x < 0) {x = 0;}
    if (y > origPhoto.height - zoomingLens.offsetHeight) {y = origPhoto.height - zoomingLens.offsetHeight;}
    if (y < 0) {y = 0;}

    /*set the position of the zoomingLens:*/
    zoomingLens.style.left = x + "px";
    zoomingLens.style.top = y + "px";
    /*display what the zoomingLens "sees":*/
    zoomedPhoto.style.backgroundPosition = "-" + (x * cx) + "px -" + (y * cy) + "px";
  }
  function getCursorPos(e) {
    var a, x = 0, y = 0;
    e = e || window.event;
    /*get the x and y positions of the image:*/
    a = origPhoto.getBoundingClientRect();
    /*calculate the cursor's x and y coordinates, relative to the image:*/
    x = e.pageX - a.left;
    y = e.pageY - a.top;
    /*consider any page scrolling:*/
    x = x - window.pageXOffset;
    y = y - window.pageYOffset;
    return {x : x, y : y};
  }
}
