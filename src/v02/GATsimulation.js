let mireCircles;
let myDial;
const dialCoefficient = 5;

// coordinates from top left, units in pixels
let canvasSz = {wd: 360, ht: 360};
let totalScreenSz = {wd: 3600, ht: 3600};
let rightPupilLoc = {x:1500, y:1390};  // found from visually looking at the image
let leftPupilLoc = {x:2150, y:1420};  // found from visually looking at the image
let centerLineY = canvasSz.ht/2;  // midpoint of screen where the distinction between top and bottom mire views is
let mireRadius = 100;
let mireLineWidth = 5;
let mireSeparation = mireRadius*2;   // distance between mire circles when dial is not set

//import {moveZoomingLensByKey} from './headshot.js';

// https://www.w3schools.com/graphics/game_intro.asp
function startGat() {
  // 120
  // mireCircle = new component(30, 30, "rgba(0, 0, 255, 0.5)", 10, 120);
  let mireCircle1 = new component(mireRadius, mireRadius, 0, rightPupilLoc.x-mireSeparation/2, rightPupilLoc.y, "arc", +1);
  let mireCircle2 = new component(mireRadius, mireRadius, 0, rightPupilLoc.x+mireSeparation/2, rightPupilLoc.y, "arc", -1);
  mireCircles = [mireCircle1, mireCircle2];
  myDial = new component("30px", "Consolas", "black", 10, 40, "text");
  gatScreen.start();
}

function assessKey(oldKeyCodes, oldKeyVals, newKeyCodes, newKeyVals, keydirection) {
  let accel = {x:NaN, y:NaN};
  let dialSpeed = 0.0
  if (keydirection == "keyup") { stopMovement(); }
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
  accelerate(accel.x,accel.y);
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
    this.lensX = 0;
    this.lensY = 0;

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

function component(wd, ht, color, x, y, type, direction) {
    this.type = type;
    this.width = wd;
    this.height = ht;

    // below only relevant if this is a myDial component
    this.dial = 0;
    this.dialSpeed = 0;



    this.x = x;  // does not take into account the dial
    this.y = y;
    // below only relevant if a mireCircle object
    this.lrSpeed = 0;
    this.lrAccel = 0;
    this.udSpeed = 0;
    this.udAccel = 0;
    this.radius = this.height/2;
    // +1 -> above aka clockwise starting from rightmost point
    // -1 -> aka counterclockwise starting from rightmost point
    this.direction = direction;
    console.log(direction)
    this.update = function() {
      let ctx = gatScreen.context;
      let lensX = gatScreen.lensX;
      let lensY = gatScreen.lensY;
      if (this.type == "text") {
        ctx.font = this.width + " " + this.height;
        ctx.fillStyle = color;
        ctx.fillText(this.text, this.x, this.y);

      } else if (this.type == "arc") {
        // the angle starts from rightmost point (0) to bottom (pi/2) to leftmost (pi) backup through the top
        // arc inputs: x center, y center, radius, start angle (radians), end angle (radians), counterclockwise (optional)

        initialAngle = 0;           // radians
        finalAngle = 1 * Math.PI;   // radians

        // translated means the coordinates are moved to be in the plane of the screen
        translatedX = this.x-lensX*10;
        translatedY = this.y-lensY*10;



        // Don't really have to separate out these conditions
        if (direction <= 0 && translatedY + this.radius < centerLineY) {
          // Nothing to draw as entire circle is not in its correct half of the canvas
        } else if (direction > 0 && translatedY - this.radius > centerLineY) {
          // Nothing to draw as entire circle is not in its correct half of the canvas
        } else {
          // Put the separate circles out here because otherwise the nature of arc sin will cause the circle to not be drawn at all (0->0 instead of 0->2pi)
          if (direction <= 0 && translatedY - this.radius > centerLineY) {
            // Draw full circle as entire circle is on its correct half of the canvas
            offsetAngle = - Math.PI/2  // radians
          } else if (direction > 0 && translatedY + this.radius < centerLineY) {
            // Draw full circle as entire circle is on its correct half of the canvas
            offsetAngle = - Math.PI/2  // radians
          } else {
            // Draw only the part of the circle on its correct half of the canvas
            offsetAngle = Math.asin( (centerLineY-translatedY)/this.radius)  // radians
          }
          initialAngle = 0 + offsetAngle;          // radians
          finalAngle = 1 * Math.PI - offsetAngle;  // radians

          //console.log("Drawing Mire at (" + (this.x-lensX*10) + ", " + (this.y-lensY*10) + ")")
          //console.log("Drawing Mire at (" + (this.x-lensX*10 + this.direction*myDial.dial*dialCoefficient) + ", " + (this.y-lensY*10) + "), direction=" + direction + ", angles=[" + initialAngle*180/Math.PI + "," + finalAngle*180/Math.PI + "]" )
          //console.log("Drawing Mire at (" + (this.x-lensX*10 + this.direction*myDial.dial*dialCoefficient) + ", " + (this.y-lensY*10) + "), direction=" + direction + ", offset_angle=" + offsetAngle*180/Math.PI + "" )

          // Draw outline
          ctx.strokeStyle = "rgba(0,255,0,0.5)";
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.lineWidth = mireLineWidth * 0.5;
          ctx.beginPath();
          ctx.arc(translatedX + this.direction*myDial.dial*dialCoefficient, translatedY,
            this.height/2, initialAngle, finalAngle,
            (direction>0 ? true : false));
          ctx.stroke();
          ctx.fill();

          // Draw actual green circle
          ctx.strokeStyle = "rgba(0,100,0,0.9)";
          ctx.fillStyle = "rgba(200,255,200,0.4)";
          ctx.lineWidth = mireLineWidth;
          ctx.beginPath();
          ctx.arc(translatedX + this.direction*myDial.dial*dialCoefficient, translatedY,
            this.radius*0.9, initialAngle, finalAngle,
            (direction>0 ? true : false) );
          ctx.stroke();
          ctx.fill();
        }

      } else {
        ctx.fillStyle = color;
        ctx.fillRect(this.x-lensX*10, this.y-lensY*10, this.width, this.height);
      }

    }
    this.newPos = function() {
        this.udSpeed += this.udAccel;
        this.lrSpeed += this.lrAccel;
        this.x += this.lrSpeed;
        this.y += this.udSpeed;

        this.dial += this.dialSpeed
    }
}

function updateGatScreen() {
    let x, height, gap, minHeight, maxHeight, minGap, maxGap;
    gatScreen.clear();
    gatScreen.frameNo += 1;
    zoomingLens = document.getElementById("zoomingLens");
    gatScreen.lensX = zoomingLens.computedStyleMap().get('left').value;
    gatScreen.lensY = zoomingLens.computedStyleMap().get('top').value;
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
    myDial.newPos();
    myDial.update();
    for (i = 0; i < mireCircles.length; i += 1) {
      mireCircle = mireCircles[i]
      mireCircle.newPos();
      mireCircle.update();
    }

}

function everyInterval(n) {
    if ((gatScreen.frameNo / n) % 1 == 0) {return true;}
    return false;
}

function accelerate(x,y) {
  for (let i = 0; i < mireCircles.length; i += 1) {
    const mireCircle = mireCircles[i]
    // By allowing false check, you can change on edirection without the other
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
