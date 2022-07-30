let mireCircles;
let myDial;
const dialCoefficient = 5;

// coordinates from top left, units in pixels
let canvasSz      = {wd:360, ht:360};
let totalScreenSz = {wd:3600,ht:3600};
const rightPupilLoc = { x:1500, y:1390};  // found from visually looking at the image
const leftPupilLoc  = { x:2150, y:1420};  // found from visually looking at the image
const centerLineY = canvasSz.ht/2;  // midpoint of screen where the distinction between top and bottom mire views is
const MIRE_RADIUS = 100;
const MIRE_LINE_WD = 5;
const MIRE_SEPARATION = MIRE_RADIUS*2;   // distance between mire circles when dial is not set

//import {moveZoomingLensByKey} from './headshot.js';

// https://www.w3schools.com/graphics/game_intro.asp
// https://www.w3schools.com/howto/howto_js_image_zoom.asp
function startGat() {
  // mireCircle = new component(30, 30, "rgba(0, 0, 255, 0.5)", 10, 120);
  let mireCircleRightEye1 = new MireCircle(MIRE_RADIUS, MIRE_RADIUS, 0, rightPupilLoc.x, rightPupilLoc.y, +1);
  let mireCircleRightEye2 = new MireCircle(MIRE_RADIUS, MIRE_RADIUS, 0, rightPupilLoc.x, rightPupilLoc.y, -1);
  let mireCircleLeftEye1 = new MireCircle(MIRE_RADIUS, MIRE_RADIUS, 0,  leftPupilLoc.x,  leftPupilLoc.y, +1);
  let mireCircleLeftEye2 = new MireCircle(MIRE_RADIUS, MIRE_RADIUS, 0,  leftPupilLoc.x,  leftPupilLoc.y, -1);
  mireCircles = [mireCircleRightEye1, mireCircleRightEye2, mireCircleLeftEye1, mireCircleLeftEye2];
  myDial = new Dial("30px", "Consolas", "black", 10, 40, "text");
  gatScreen.start();
}

function assessKey(oldKeyCodes, oldKeyVals, newKeyCodes, newKeyVals, keyDirection) {
  let accel = {x:NaN, y:NaN};
  let dialSpeed = 0.0;
  if (keyDirection == "keyup") { stopMovement(); }

  // key codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  if (newKeyCodes) {
    console.assert(newKeyCodes.length === newKeyVals.length);
    for (let i = 0; i < newKeyCodes.length; i++ ) {
      const newKeyCode = newKeyCodes[i];
      const newKeyVal = newKeyVals[i];
      if (     newKeyVal === "ArrowLeft" || newKeyCode == 37) { accel.x    =-0.2; } // right
      else if (newKeyVal === "ArrowRight"|| newKeyCode == 39) { accel.x    =+0.2; } // left
      else if (newKeyVal === "ArrowDown" || newKeyCode == 40) { accel.y    =+0.2; } // down
      else if (newKeyVal === "ArrowUp"   || newKeyCode == 38) { accel.y    =-0.2; } // up
      else if (newKeyVal === " "         || newKeyCode == 32) { dialSpeed =+0.1; } // space
      else if (newKeyVal === "Shift"     || newKeyCode == 16) { dialSpeed =-0.1; } // shift
      // I got tired of including both value options. They should be the same anyway
      else if (newKeyVal === "a") { moveZoomingLensByKey(-10,  0); }  // left
      else if (newKeyVal === "d") { moveZoomingLensByKey(+10,  0); }
      else if (newKeyVal === "s") { moveZoomingLensByKey(  0,-10); }  // down
      else if (newKeyVal === "w") { moveZoomingLensByKey(  0,+10); }
    }

  }
  console.log(oldKeyCodes, oldKeyVals, " -> ", newKeyCodes, newKeyVals);
  accelerate(accel.x, accel.y);
  changeDial(dialSpeed);
}

let gatScreen = {
  canvas : document.createElement("canvas"),
  start : function() {
    this.canvas.width = canvasSz.wd;
    this.canvas.height = canvasSz.ht;
    this.context = this.canvas.getContext("2d");
    document.getElementById("GAT-area").insertBefore(this.canvas, document.getElementById("GAT-controls"));
    this.frameNo = 0;
    this.interval = setInterval(updateGatScreen, 20);
    this.keyCode = false;
    this.key = false;
    this.lensLoc = {x:0, y:0}

    window.addEventListener('keydown', function (e) {
      oldKeyCode = gatScreen.keyCode;
      oldKey = gatScreen.key;
      gatScreen.keyCode = [e.keyCode];
      gatScreen.key = [e.key];
      // Holding down the key eventually counts as multiple key presses
      if ( !areArraysEqual(gatScreen.keyCode, oldKeyCode) ) {
        assessKey(oldKeyCode, oldKey, gatScreen.keyCode, gatScreen.key, "keydown")
      }
    })
    window.addEventListener('keyup', function (e) {
      oldKeyCode = gatScreen.keyCode;
      oldKey = gatScreen.key;
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

function areArraysEqual(firstArr, seconArr) {
  if (firstArr === seconArr) return true;  // <- what happens if both are false or many other same non-array values
  if (firstArr == null || seconArr == null) return false;
  if (firstArr.length !== seconArr.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
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
    let lensLoc = gatScreen.lensLoc;
    //let lensLoc = {x:gatScreen.lensLoc.x, y:gatScreen.lensLoc.y};
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x-lensLoc.x*10, this.y-lensLoc.y*10, this.width, this.height);
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
    let lensLoc = gatScreen.lensLoc
    //let lensLoc = {x:gatScreen.lensLoc.x, y:gatScreen.lensLoc.y};

    // the angle starts from rightmost point (0) to bottom (pi/2) to leftmost (pi) backup through the top
    // arc inputs: x center, y center, radius, start angle (radians), end angle (radians), counterclockwise (optional)

    let arcAngleInitial = 0;           // radians
    let arcAngleFinal   = 1 * Math.PI;   // radians

    // translated means the coordinates are moved to be in the plane of the screen
    let locFromLens = {x:this.x-lensLoc.x*10,  y:this.y-lensLoc.y*10};
    //locFromLens.x = this.x-lensLoc.x*10;
    //locFromLens.y = this.y-lensLoc.y*10;

    // Don't really have to separate out these conditions
    if (this.direction <= 0 && locFromLens.y + this.radius < centerLineY) {
      // Nothing to draw as entire circle is not in its correct half of the canvas
    } else if (this.direction > 0 && locFromLens.y - this.radius > centerLineY) {
      // Nothing to draw as entire circle is not in its correct half of the canvas
    } else {
      // Put the separate circles out here because otherwise the nature of arc sin will cause the circle to not be drawn at all (0->0 instead of 0->2pi)
      let offsetAngle = undefined;
      if (this.direction <= 0 && locFromLens.y - this.radius > centerLineY) {
        // Draw full circle as entire circle is on its correct half of the canvas
        offsetAngle = - Math.PI/2  // radians
      } else if (this.direction > 0 && locFromLens.y + this.radius < centerLineY) {
        // Draw full circle as entire circle is on its correct half of the canvas
        offsetAngle = - Math.PI/2  // radians
      } else {
        // Draw only the part of the circle on its correct half of the canvas
        offsetAngle = Math.asin( (centerLineY-locFromLens.y)/this.radius)  // radians
      }
      arcAngleInitial =    0    + offsetAngle;  // radians
      arcAngleFinal   = Math.PI - offsetAngle;  // radians

      //console.log("Drawing Mire at (" + (this.x-lensLoc.x*10) + ", " + (this.y-lensLoc.y*10) + ")")
      //console.log("Drawing Mire at (" + (this.x-lensLoc.x*10 + this.direction*myDial.dial*dialCoefficient) + ", " + (this.y-lensLoc.y*10) + "), direction=" + this.direction + ", angles=[" + initialAngle*180/Math.PI + "," + finalAngle*180/Math.PI + "]" )
      //console.log("Drawing Mire at (" + (this.x-lensLoc.x*10 + this.direction*myDial.dial*dialCoefficient) + ", " + (this.y-lensLoc.y*10) + "), direction=" + this.direction + ", offset_angle=" + offsetAngle*180/Math.PI + "" )

      // Draw outline
      ctx.strokeStyle = "rgba(0,255,0,0.5)";
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineWidth = MIRE_LINE_WD * 0.5;
      ctx.beginPath();
      ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
        this.height/2, arcAngleInitial, arcAngleFinal,
        (this.direction>0 ? true : false));
      ctx.stroke();
      ctx.fill();

      // Draw actual green circle
      ctx.strokeStyle = "rgba(0,100,0,0.9)";
      ctx.fillStyle = "rgba(200,255,200,0.4)";
      ctx.lineWidth = MIRE_LINE_WD;
      ctx.beginPath();
      ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
        this.radius*0.9, arcAngleInitial, arcAngleFinal,
        (this.direction>0 ? true : false) );
      ctx.stroke();
      ctx.fill();
    }
  }
}

function updateGatScreen() {
  let x, height, gap, minHeight, maxHeight, minGap, maxGap;
  gatScreen.clear();
  gatScreen.frameNo += 1;
  zoomingLens = document.getElementById("zoomingLens");
  gatScreen.lensLoc = {
    x:zoomingLens.computedStyleMap().get('left').value,
    y:zoomingLens.computedStyleMap().get('top').value
  };
  if (gatScreen.frameNo == 1 || everyInterval(150)) {
    x = gatScreen.canvas.width;
    minHeight = 20;
    maxHeight = 200;
    height = Math.floor(Math.random()*(maxHeight-minHeight+1)+minHeight);
    minGap = 50;
    maxGap = 200;
    gap = Math.floor(Math.random()*(maxGap-minGap+1)+minGap);
  }
  myDial.text="Dial: " + myDial.dial.toFixed(1) + " mmHg";
  myDial.updatePosition();
  myDial.updateDrawing();
  for (let i = 0; i < mireCircles.length; i += 1) {
    let mireCircle = mireCircles[i]
    mireCircle.updatePosition();
    mireCircle.updateDrawing();
  }

}

function everyInterval(n) {
  if ((gatScreen.frameNo / n) % 1 == 0) {return true;}
  return false;
}

function accelerate(x,y) {
  for (let i = 0; i < mireCircles.length; i += 1) {
    const mireCircle = mireCircles[i]
    // By allowing false check, you can change on either direction without the other
    if (!isNaN(x)) { mireCircle.lrAccel = x; }
    if (!isNaN(y)) { mireCircle.udAccel = y; }
  }
}
function stopMovement() {
  for (let i = 0; i < mireCircles.length; i += 1) {
    const mireCircle = mireCircles[i]
    mireCircle.lrSpeed = 0.0;
    mireCircle.udSpeed = 0.0;
  }
  accelerate(0,0);
}
function changeDial(dialSpeed) {
  if (!isNaN(dialSpeed)) { myDial.dialSpeed = dialSpeed; }
}
