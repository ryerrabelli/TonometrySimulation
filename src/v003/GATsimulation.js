let mireCircles;
let myDial;
const dialCoefficient = 5;

// coordinates from top left, units in pixels
const canvasSz    = {wd:360, ht:360};
const photoResSz = {wd:3600,ht:3600};  // resolution from original file
const fileScale = {x:canvasSz.wd/photoResSz.wd, y:canvasSz.ht/photoResSz.ht };
const rightPupilLoc = { x:1500/fileScale.x, y:1390/fileScale.y};  // found from visually looking at the image
const leftPupilLoc  = { x:2150/fileScale.x, y:1420/fileScale.y};  // found from visually looking at the image
const centerLineY = canvasSz.ht/2;  // midpoint of screen where the distinction between top and bottom mire views is
const MIRE_RADIUS     = 3;  // will be multipled by s (scale)
const MIRE_LINE_WD    = 0.5;   // will be multipled by s (scale)
const MIRE_SEPARATION = MIRE_RADIUS*2;   // distance between mire circles when dial is not set

// https://www.w3schools.com/graphics/game_intro.asp
// https://www.w3schools.com/howto/howto_js_image_zoom.asp
function startGat() {
  // mireCircle = new component(30, 30, "rgba(0, 0, 255, 0.5)", 10, 120);
  let mireCircleRightEye1 = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, rightPupilLoc.x, rightPupilLoc.y, +1);
  let mireCircleRightEye2 = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, rightPupilLoc.x, rightPupilLoc.y, -1);
  let mireCircleLeftEye1  = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0,  leftPupilLoc.x,  leftPupilLoc.y, +1);
  let mireCircleLeftEye2  = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0,  leftPupilLoc.x,  leftPupilLoc.y, -1);
  mireCircles = [mireCircleRightEye1, mireCircleRightEye2, mireCircleLeftEye1, mireCircleLeftEye2];
  myDial = new Dial("30px", "Consolas", "rgba(255,255,255,0.5)", 10, 40, "text");
  gatScreen.start();
}

function assessKey(oldKeyCodes, oldKeyVals, newKeyCodes, newKeyVals, keyDirection) {
  let accelMire = {x:null, y:null};  // not used anymore. Mires do not move
  let accelZoomingLens = {x:null, y:null, s:null};  // null indicates don't change current value
  let dialSpeed = 0.0;
  if (keyDirection === "keyup") { stopMovementOfMires(); gatScreen.lens.stopMovement(); }

  // key codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  if (newKeyCodes) {
    console.assert(newKeyCodes.length === newKeyVals.length);
    //zoomingLensController.
    for (let i = 0; i < newKeyCodes.length; i++ ) {
      const newKeyCode = newKeyCodes[i];
      const newKeyVal  = newKeyVals[i];
      if      (newKeyVal === " "         || newKeyCode === 32) { dialSpeed = +0.1; } // space
      else if (newKeyVal === "Shift"     || newKeyCode === 16) { dialSpeed = -0.1; } // shift
      else if (newKeyVal === "ArrowLeft" || newKeyCode === 37) { accelZoomingLens.x = -0.2; } // left
      else if (newKeyVal === "ArrowRight"|| newKeyCode === 39) { accelZoomingLens.x = +0.2; } // right
      else if (newKeyVal === "ArrowDown" || newKeyCode === 40) { accelZoomingLens.y = +0.2; } // down
      else if (newKeyVal === "ArrowUp"   || newKeyCode === 38) { accelZoomingLens.y = -0.2; } // up
      // I got tired of including both value options. They should be the same anyway
      else if (newKeyVal === "a") { accelZoomingLens.x = -0.2; }  // left
      else if (newKeyVal === "d") { accelZoomingLens.x = +0.2; }  // right
      else if (newKeyVal === "s") { accelZoomingLens.s = -0.02; }  // down
      else if (newKeyVal === "w") { accelZoomingLens.s = +0.02; }  // up
    }

  }
  //console.log(oldKeyCodes, oldKeyVals, " -> ", newKeyCodes, newKeyVals);
  accelerateZoomingLens(accelZoomingLens);
  accelerateMires(accelMire.x, accelMire.y);
  changeDial(dialSpeed);
}



let zoomingLensController = {
  get sz() {
    return this.getSzForSof(this.loc.s);
  },
  getSzForSof(s) {
    return {wd: canvasSz.wd / s, ht: canvasSz.ht / s}
  },
  loc: {x:0,y:0,s:10},  // loc = location/position;  s stands for scale (aka zoom or how far into the screen you are)
  vel: {x:0,y:0,s:0},  // vel = velocity
  accel: {x:0, y:0, s:0},
  get locCenter() {
    // This is the ratio of the origPhoto (or zoomedPhoto) to the zoomingLens
    return {x:this.loc.x, y:this.loc.y}  // in case I ever want to implement separate scale for different axes
  },
  setVelocity: function(newVal) {
    for (const key in newVal) {
      if (!isNullOrUndef(newVal[key])) this.vel[key] = newVal[key];
    }
  },
  setAcceleration: function(newVal) {
    for (const key in newVal) {
      if (!isNullOrUndef(newVal[key])) this.accel[key] = newVal[key];
    }
  },
  setLoc: function(newVal) {
    for (const key in newVal) {
      if (!isNullOrUndef(newVal[key])) gatScreen.lens.loc[key] = newVal[key];
    }
    updateZoom();
  },
  stopMovement: function() {
    this.setVelocity({x:0,y:0,s:0});
    this.setAcceleration({x:0,y:0,s:0});
  },
  get drawnLoc() {  // from top left corner
    let x = zoomingLens.computedStyleMap().get("left").value;
    let y = zoomingLens.computedStyleMap().get("top").value;
    // ss = plural of s (aka scale)
    let ss = {x:zoomedPhoto.offsetWidth / zoomingLens.offsetWidth, y:zoomedPhoto.offsetHeight / zoomingLens.offsetHeight}
    return {x:x, y:y, s:ss.x};
  },
  updatePosition: function() {
    let currentLoc = gatScreen.lens.loc; // this.getLoc
    let newLoc = Object.assign({},currentLoc);  // does copy
    for (const key in newLoc) {
      this.vel[key] += this.accel[key];
      newLoc[key] += this.vel[key];
    }
    this.checkAndSetLoc(newLoc);
  },

  checkNewLoc: function(newLoc, doReturnValue=true) {
    /* Check if newLoc will cause positioning out of bounds */
    const newS = ( isNullOrUndef(newLoc.s) ? gatScreen.lens.loc.s : newLoc.s);
    const range = {
      x:[0, canvasSz.wd - gatScreen.lens.getSzForSof(newS).wd],
      y:[0, canvasSz.ht - gatScreen.lens.getSzForSof(newS).ht],
      s:[1, Math.sqrt(canvasSz.wd/2*canvasSz.ht/2)],
    };

    let changedCt = 0;
    for (const key in range) {
      if (newLoc[key] < range[key][0]) {
        newLoc[key] = range[key][0];
        changedCt++;
      }
      if (newLoc[key] >  range[key][1]) {
        newLoc[key] = range[key][1];
        changedCt++;
      }
    }

    if (doReturnValue) {
      return newLoc;
    } else {
      return changedCt > 0;
    }
  },
  checkAndSetLoc: function(newLoc) {
    newLoc = this.checkNewLoc(newLoc);
    this.setLoc(newLoc);
    return newLoc;
  },
}

let gatScreen = {
  canvas : document.createElement("canvas"),
  lens: zoomingLensController,
  start : function() {
    this.canvas.width = canvasSz.wd;
    this.canvas.height = canvasSz.ht;
    this.context = this.canvas.getContext("2d");
    document.getElementById("GAT-area").insertBefore(this.canvas, document.getElementById("GAT-controls"));
    this.frameNo = 0;
    // Despite what pycharm, the interval function is used
    this.interval = setInterval(updateGatScreen, 20);
    this.keyCode = false;
    this.key = false;

    window.addEventListener('keydown', function (event) {
      const oldKeyCode = gatScreen.keyCode;
      const oldKey = gatScreen.key;
      gatScreen.keyCode = [event.keyCode];
      gatScreen.key = [event.key];
      // Holding down the key eventually counts as multiple key presses
      if ( !areArraysEqual(gatScreen.keyCode, oldKeyCode) ) {
        assessKey(oldKeyCode, oldKey, gatScreen.keyCode, gatScreen.key, "keydown")
      }
    })
    window.addEventListener('keyup', function (event) {
      const oldKeyCode = gatScreen.keyCode;
      const oldKey = gatScreen.key;
      // Need to integrate event to only delete the specific key held up
      gatScreen.keyCode = false;
      gatScreen.key = false;
      if ( !areArraysEqual(gatScreen.keyCode, oldKeyCode) ) {
        assessKey(oldKeyCode, oldKey, gatScreen.keyCode, gatScreen.key, "keyup")
      }
    })
    },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function isNullOrUndef(myvar) {
  return myvar === null || myvar === undefined;
}

function areArraysEqual(firstArr, seconArr) {
  if (firstArr === seconArr) return true;  // <- what happens if both are false or many other same non-array values
  if (isNullOrUndef(firstArr) || isNullOrUndef(seconArr)) return false;
  if (firstArr.length !== seconArr.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < firstArr.length; ++i) {
    if (firstArr[i] !== seconArr[i]) return false;
  }
  return true;
}

class Component {
  constructor(wd, ht, color, x, y) {
    this.width = wd;
    this.height = ht;
    this.color = color;

    this.x = x;  // does not take into account the dial
    this.y = y;
  }
  updateDrawing() {}
  updatePosition() {}
}
class Dial extends Component {
  constructor(wd, ht, color, x, y) {
    super(wd, ht, color, x, y);
    this.dial = 0;
    this.dialSpeed = 0;
  }
  updateDrawing() {
    let ctx = gatScreen.context;
    ctx.font = this.width + " " + this.height;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
  }
  updatePosition() {  // overrides empty method in Component
    this.dial += this.dialSpeed
  }
}
class MovingComponent extends Component {
  constructor(wd, ht, color, x, y) {
    super(wd, ht, color, x, y);
    this.lrSpeed = 0;
    this.lrAccel = 0;
    this.udSpeed = 0;
    this.udAccel = 0;
  }
  updatePosition() {  // overrides empty method in Component
    super.updatePosition();  // does nothing currently
    this.udSpeed += this.udAccel;
    this.lrSpeed += this.lrAccel;
    this.x += this.lrSpeed;
    this.y += this.udSpeed;
  }
}
class Rectangle extends MovingComponent {
  updateDrawing() {  // overrides empty method in Component
    let ctx = gatScreen.context;
    let lens = gatScreen.lens;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-lens.loc.x, this.y-lens.loc.y, this.width, this.height);
  }
}
class MireCircle extends MovingComponent {
  constructor(wd, ht, color, x, y, direction) {
    super(wd, ht, color, x-direction*MIRE_SEPARATION/2, y);
    this.radius = this.height/2;
    // +1 -> above aka clockwise starting from rightmost point
    // -1 -> aka counterclockwise starting from rightmost point
    this.direction = direction;
  }
  updateDrawing() {  // overrides empty method in Component
    let ctx = gatScreen.context;
    let lens = gatScreen.lens

    // the angle starts from rightmost point (0) to bottom (pi/2) to leftmost (pi) backup through the top
    // arc inputs: x center, y center, radius, start angle (radians), end angle (radians), counterclockwise (optional)

    let arcAngleInitial = 0;           // radians
    let arcAngleFinal   = 1 * Math.PI;   // radians, aka 180 degrees

    // locFromLens means the coordinates are moved to be in the plane of the screen

    // get coordinates but translated to be within the lens and scaled up (zoom)
    let locFromLens = {
      x:(this.x-lens.loc.x)*lens.loc.s,
      y:(this.y-lens.loc.y)*lens.loc.s
    };
    const radiusScaled = this.radius * lens.loc.s;

    let offsetAngle = null;  // indicates how much of the arc should NOT be drawn on ea (radians)

    // Don't really have to separate out the first two conditions
    // However, need to put the full circles in separate code because otherwise the nature of arc sin (asin) will
    // cause the circle to not be drawn at all (0->0 instead of 0->2pi)
    if (this.direction <= 0 && locFromLens.y + radiusScaled < centerLineY) {
      // Nothing to draw as entire circle is NOT in its correct half of the canvas
    } else if (this.direction > 0 && locFromLens.y - radiusScaled > centerLineY) {
      // Nothing to draw as entire circle is NOT in its correct half of the canvas
    } else if (this.direction <= 0 && locFromLens.y - radiusScaled > centerLineY) {
      // Draw full circle as entire circle is on its correct half of the canvas
      offsetAngle = - Math.PI/2;  // -90 degrees, but in radian units
    } else if (this.direction > 0 && locFromLens.y + radiusScaled < centerLineY) {
      // Draw full circle as entire circle is on its correct half of the canvas
      offsetAngle = - Math.PI/2;  // -90 degrees, but in radian units
    } else {
      // Draw only the part of the circle that is on its correct half of the canvas
      offsetAngle = Math.asin( (centerLineY-locFromLens.y)/radiusScaled)  // radians
    }
    if (!isNullOrUndef(offsetAngle)) {
      arcAngleInitial =    0    + offsetAngle;  // radians
      arcAngleFinal   = Math.PI - offsetAngle;  // radians

      // Draw outline
      ctx.strokeStyle = "rgba(0,255,0,0.5)";
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineWidth = MIRE_LINE_WD * lens.loc.s * 0.5;  // half thickness of routline
      ctx.beginPath();
      ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
        radiusScaled, arcAngleInitial, arcAngleFinal,
        (this.direction>0) );
      ctx.stroke();
      ctx.fill();

      // Draw actual green circle
      ctx.strokeStyle = "rgba(0,100,0,0.9)";
      ctx.fillStyle = "rgba(200,255,200,0.4)";
      ctx.lineWidth = MIRE_LINE_WD * lens.loc.s;
      ctx.beginPath();
      ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
        radiusScaled*0.9, arcAngleInitial, arcAngleFinal, (this.direction>0) );
      ctx.stroke();
      ctx.fill();
    }
  }
}

function updateGatScreen() {
  gatScreen.clear();
  gatScreen.frameNo += 1;

  myDial.text="Dial: " + myDial.dial.toFixed(1) + " mmHg";
  myDial.updatePosition();
  myDial.updateDrawing();
  for (let i = 0; i < mireCircles.length; i += 1) {
    let mireCircle = mireCircles[i]
    mireCircle.updatePosition();
    mireCircle.updateDrawing();
  }
  gatScreen.lens.updatePosition();
  $("#xLocDisplayer").html(gatScreen.lens.loc.x.toFixed(2).padStart(7," ").replace(" ","&nbsp;"));
  $("#yLocDisplayer").html(gatScreen.lens.loc.y.toFixed(2).padStart(7," ").replace(" ","&nbsp;"));
  $("#sLocDisplayer").html(gatScreen.lens.loc.s.toFixed(1).padStart(3," ").replace(" ","&nbsp;"));
}

function everyInterval(n) {
  return ((gatScreen.frameNo / n) % 1 === 0)
}

function accelerateZoomingLens(accelZoomingLens) {
  gatScreen.lens.setAcceleration(accelZoomingLens);
}
function accelerateMires(x,y) {
  for (let i = 0; i < mireCircles.length; i += 1) {
    const mireCircle = mireCircles[i]
    // By allowing false check, you can change on either direction without the other
    if (!isNaN(x)) { mireCircle.lrAccel = x; }
    if (!isNaN(y)) { mireCircle.udAccel = y; }
  }
}
function stopMovementOfMires() {
  for (let i = 0; i < mireCircles.length; i += 1) {
    const mireCircle = mireCircles[i]
    mireCircle.lrSpeed = 0.0;
    mireCircle.udSpeed = 0.0;
  }
  accelerateMires(0,0);
}

function changeDial(dialSpeed) {
  // could also test !isNaN(dialSpeed)
  if (!isNullOrUndef(dialSpeed)) { myDial.dialSpeed = dialSpeed; }
}
