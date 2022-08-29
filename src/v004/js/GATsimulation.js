let myDial;
const dialCoefficient = 5;

// coordinates from top left, units in pixels
const canvasSz    = {wd:360, ht:360};
const photoResSz = {wd:3600,ht:3600};  // resolution from original file
const fileScale = {x:photoResSz.wd/canvasSz.wd, y:photoResSz.ht/canvasSz.ht };
const rightPupilLoc = { x:1500/fileScale.x, y:1390/fileScale.y};  // found from visually looking at the image
const leftPupilLoc  = { x:2150/fileScale.x, y:1420/fileScale.y};  // found from visually looking at the image


const centerLineY = canvasSz.ht/2;  // midpoint of screen where the distinction between top and bottom mire views is
const MIRE_RADIUS     = 3;  // will be multipled by s (scale)
const MIRE_LINE_WD    = 0.5;   // will be multipled by s (scale)
const MIRE_SEPARATION = MIRE_RADIUS*4;   // distance between mire circle centers when dial pressure is not set (or set at 0)
const DEFAULT_ZOOMING_LENS_LOC = {x:0, y:0, s:5};

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

function assessKey(oldKeyCodes, oldKeyStrs, newKeyCodes, newKeyStrs, keyDirection) {
  let accelMire = {x:null, y:null};  // not used anymore. Mires do not move
  let accelZoomingLens = {x:null, y:null, s:null};  // null indicates don't change current value
  let dialSpeed = 0.0;
  if (keyDirection === "keyup") { stopMovementOfMires(); gatScreen.lens.stopMovement(); }

  // key codes https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  if (newKeyCodes) {
    console.assert(newKeyCodes.length === newKeyStrs.length);
    //zoomingLensController.
    for (let i = 0; i < newKeyCodes.length; i++ ) {
      const newKeyCode = newKeyCodes[i];
      const newKeyStr  = newKeyStrs[i];
      if      (newKeyStr === " "         || newKeyCode === 32) { dialSpeed = +0.1; } // space
      else if (newKeyStr === "Shift"     || newKeyCode === 16) { dialSpeed = -0.1; } // shift
      else if (newKeyStr === "ArrowLeft" || newKeyCode === 37) { accelZoomingLens.x = -0.2; } // left
      else if (newKeyStr === "ArrowRight"|| newKeyCode === 39) { accelZoomingLens.x = +0.2; } // right
      else if (newKeyStr === "ArrowDown" || newKeyCode === 40) { accelZoomingLens.y = +0.2; } // down
      else if (newKeyStr === "ArrowUp"   || newKeyCode === 38) { accelZoomingLens.y = -0.2; } // up
      // I got tired of including both value options. They should be the same anyway
      else if (newKeyStr === "a") { accelZoomingLens.x = -0.2; }  // left
      else if (newKeyStr === "d") { accelZoomingLens.x = +0.2; }  // right
      else if (newKeyStr === "s") { accelZoomingLens.s = -0.02; }  // down
      else if (newKeyStr === "w") { accelZoomingLens.s = +0.02; }  // up
    }

  }
  //console.log(oldKeyCodes, oldKeyStrs, " -> ", newKeyCodes, newKeyStrs);
  accelerateZoomingLens(accelZoomingLens);
  accelerateMires(accelMire.x, accelMire.y);
  changeDial(dialSpeed);
}


class Controller {
  val = {};    // loc  = location/position;
  vel = {};    // vel  = velocity
  accel = {};  // accel = acceleration
  setValue(newAmount) {
    for (const key in newAmount) {
      if (!isNullOrUndef(newAmount[key])) this.val[key] = newAmount[key];
    }
  }
  setVelocity(newAmount) {
    for (const key in newAmount) {
      if (!isNullOrUndef(newAmount[key])) this.vel[key] = newAmount[key];
    }
  }
  setAcceleration(newAmount) {
    for (const key in newAmount) {
      if (!isNullOrUndef(newAmount[key])) this.accel[key] = newAmount[key];
    }
  }
}
class ZoomingLensController extends Controller {
  constructor() {
    super();
    // Object.assign performs shallow copy
    this.val   = Object.assign({}, DEFAULT_ZOOMING_LENS_LOC);
    this.vel   = {x:0, y:0, s:0};
    this.accel = {x:0, y:0, s:0};
  }
  get sz() {
    return this.getSzForSof(this.loc.s);
  }
  getSzForSof(s) {
    return {wd: canvasSz.wd / s, ht: canvasSz.ht / s}
  }
  stopMovement() {
    // Note, s cannot be 0, but its velocity and acceleration can
    this.setVelocity({x:0,y:0,s:0});
    this.setAcceleration({x:0,y:0,s:0});
  }
  updatePosition() {
    let currentLoc = gatScreen.lens.loc; // this.getLoc
    let newLoc = Object.assign({},currentLoc);  // does shallow copy
    for (const key in newLoc) {
      this.vel[key] += this.accel[key];
      newLoc[key] += this.vel[key];
    }
    newLoc = this.checkAndSetLoc(newLoc);
    //console.log( newLoc );
    //console.log(this.loc)
  }
  get loc() {
    return this.val;
  }
  get locCenter() {
    // This is the ratio of the origPhoto (or zoomedPhoto) to the zoomingLens
    return {
      x: this.loc.x + sz().wd/2,
      y: this.loc.y + sz().ht/2
    }
  }
  get drawnLoc() {  // from top left corner
    let x = zoomingLens.computedStyleMap().get("left").value;
    let y = zoomingLens.computedStyleMap().get("top").value;
    // ss = plural of s (aka scale)
    let ss = {x:zoomedPhoto.offsetWidth / zoomingLens.offsetWidth, y:zoomedPhoto.offsetHeight / zoomingLens.offsetHeight}
    return {x:x, y:y, s:ss.x};
  }
  setLoc(newAmount) {
    this.setValue(newAmount);
    updateZoom();
  }
  // rangeConstant represents the range of values that they must NEVER go out of
  static rangeConstant = {
    /* syntax is [min, max] */
    x:[0, canvasSz.wd],
    y:[0, canvasSz.ht],
    s:[1, canvasSz.ht],
  }
  // # indicates a private method
  #getRangeSpecific(proposedLoc) {
    const rangeSpecific = {
      /* syntax is [min, max] */
      x:[0, canvasSz.wd - gatScreen.lens.getSzForSof(proposedLoc.s).wd],
      y:[0, canvasSz.ht - gatScreen.lens.getSzForSof(proposedLoc.s).ht],
      s:[1, Math.sqrt(canvasSz.wd/2*canvasSz.ht/2)],
    };
    return rangeSpecific;
  }
  /**
   * force proposedLoc to be between range
   * @param{object} proposedLoc
   * @param{object}
   * @return{object}
   */
  #boundWithinRange(proposedLoc, range) {
    let changedCt = 0;
    for (const key in range) {
      //console.assert(range[key][1]>=range[key][0], key + " range = [" + range[key][0] + ", " + range[key][0] + "]")
      if (proposedLoc[key] < range[key][0]) {
        proposedLoc[key] = range[key][0];
        changedCt++;
      }
      if (proposedLoc[key] > range[key][1]) {
        proposedLoc[key] = range[key][1];
        changedCt++;
      }
    }
    return [proposedLoc, changedCt];
  }
  /**
   * Check if a proposed location is valid
   * @param{object} proposedLoc
   */
  checkNewLoc(proposedLoc, doReturnValue=true) {
    /* Check if proposedLoc will cause positioning out of bounds */
    // proposedLoc will have proposedLoc value or the original value if null/undefined
    let proposedLocFilled0 = Object.assign({},proposedLoc);  // does shallow copy
    for (const key in ZoomingLensController.rangeConstant) {
      if (isNullOrUndef(proposedLoc[key])) {
        proposedLocFilled0[key] = this.loc[key];
      }
    }
    // First check if any of the proposed values are outside rangeConstant
    let range = ZoomingLensController.rangeConstant;
    let [proposedLocFilled1, changedCt1] = this.#boundWithinRange(proposedLocFilled0, range);
    // Then check if any of the proposed values are outside the range possible given the specific other proposed values
    range = this.#getRangeSpecific(proposedLocFilled1);
    let [proposedLocFilled2, changedCt2] = this.#boundWithinRange(proposedLocFilled1, range);

    if (doReturnValue) {
      return proposedLocFilled2;
    } else {
      return changedCt1+changedCt2;
    }
  }
  checkAndSetLoc(newLoc) {
    newLoc = this.checkNewLoc(newLoc);
    this.setLoc(newLoc);
    return newLoc;
  }
}


let gatScreen = {
  canvas : document.createElement("canvas"),
  lens: new ZoomingLensController(),
  getMiresVisibility: function() {
    if (this.lens.loc.s<=1) {
      // ward off against invalid values
      return 0.0;
    } else if (this.lens.loc.s>40) {
      // save calculations as the logistic function will aready give a value close to 1.0
      return 1.0;
    } else {
      //return 1/(1+(this.lens.loc.s-10))

      const x = this.lens.loc.s;
      const sigmoidCenter = 10.0;  // valye at which mireVisibility will be 0.5
      const k = 0.05;  // the greater the k, the more that the effect will be dampened (aka further from sigmoidCenter to get a value of 0.000 or 1.000)
      // center x as a new variable to put into logistic (sigmoid) function
      const z = -(Math.log10(x) - Math.log10(sigmoidCenter))/k;
      // logistic (sigmoid) function
      const mireVisibility = 1 / (1+ Math.exp( z ))
      return mireVisibility;
    }
  },
  start : function() {
    this.canvas.width = canvasSz.wd;
    this.canvas.height = canvasSz.ht;
    this.context = this.canvas.getContext("2d");
    //document.getElementById("GAT-area").insertBefore(this.canvas, document.getElementById("GAT-editor"));
    $("#GAT-view").append(this.canvas);

    this.frameNo = 0;
    // Despite what pycharm, the interval function is used
    this.interval = setInterval(updateGatScreen, 20);
    this.keyCode = false;
    this.keyStr = false;

    window.addEventListener("keydown", function (event) {
      const oldKeyCode = gatScreen.keyCode;
      const oldKeyStr = gatScreen.keyStr;
      gatScreen.keyCode = [event.keyCode];
      gatScreen.keyStr = [event.key];
      // Holding down the key eventually counts as multiple key presses
      if ( !areArraysEqual(gatScreen.keyCode, oldKeyCode) ) {
        assessKey(oldKeyCode, oldKeyStr, gatScreen.keyCode, gatScreen.keyStr, "keydown")
      }
    })
    window.addEventListener("keyup", function (event) {
      const oldKeyCode = gatScreen.keyCode;
      const oldKeyStr = gatScreen.keyStr;
      // Need to integrate event to only delete the specific key held up
      gatScreen.keyCode = false;
      gatScreen.keyStr = false;
      if ( !areArraysEqual(gatScreen.keyCode, oldKeyCode) ) {
        assessKey(oldKeyCode, oldKeyStr, gatScreen.keyCode, gatScreen.keyStr, "keyup")
      }
    })

    $(".click-to-zoom").on("mousedown", function(event) {
      let accelZoomingLens = {x:null, y:null, s:null};  // null indicates don't change current value
      if (event.button==0) {  // 0 is left, 1 is middle, 2 is right
        accelZoomingLens.s = +0.002;
      } else if (event.button==2) {
        accelZoomingLens.s = -0.002;
      }
      accelerateZoomingLens(accelZoomingLens);
    });
    $(".click-to-zoom").on("mouseup", function() {
      stopMovementOfMires();
      gatScreen.lens.stopMovement();
    });
    // Turn off right click menu
    $(".click-to-zoom").on("contextmenu", function() {
      return false;
    });
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
  /**
   * Create a Mire Circle.
   * @param {number} wd - indicates diameter of circle (wd and ht args both given to match othe rclasses)
   * @param {number} ht - indicates diameter of circle (wd and ht args both given to match othe rclasses)
   * @param {string} color - The y value.
   * @param {number} x - x component of location relative to the entire screen
   * @param {number} y - x component of location relative to the entire screen
   * @param {(number|boolean)} direction - indicates the portion of the circle on the top of the canvas will be drawn. Positive/true -> top, negative/false -> bottom
   */
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

    const miresVisibility = gatScreen.getMiresVisibility();
    if (miresVisibility > 0.01) {
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
        offsetAngle = Math.asin( (centerLineY-locFromLens.y)/radiusScaled);  // radians
      }
      if (!isNullOrUndef(offsetAngle)) {
        arcAngleInitial =    0    + offsetAngle;  // radians
        arcAngleFinal   = Math.PI - offsetAngle;  // radians
        const isMireGreen = miresVisibility>0.9;
        const alpha = miresVisibility;
        const thickness = 1;  //lens.loc.s/5;  // corresponds to increasing blurriness/thickness as you get closer


        // Draw outline of Mire
        if (isMireGreen) ctx.strokeStyle = `rgba(0,255,0,${alpha*0.5})`;
        else ctx.strokeStyle = `rgba(0,0,255,${alpha*0.5})`;
        ctx.fillStyle = `rgba(0,0,0,0)`;
        ctx.lineWidth = MIRE_LINE_WD * lens.loc.s * thickness * 0.5;  // half thickness of routine
        ctx.beginPath();
        ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
          radiusScaled, arcAngleInitial, arcAngleFinal,
          (this.direction>0) );
        ctx.stroke();
        ctx.fill();

        // Draw actual green/blue Mire circle
        if (isMireGreen) {
          ctx.strokeStyle = `rgba(0,100,0,${alpha*0.9})`;
          ctx.fillStyle = `rgba(200,255,200,${alpha*0.5})`;
        } else {
          ctx.strokeStyle = `rgba(0,0,100,${alpha*0.9})`;
          ctx.fillStyle = `rgba(200,200,255,${alpha*0.5})`;
        }
        ctx.lineWidth = MIRE_LINE_WD * lens.loc.s * thickness;
        ctx.beginPath();
        ctx.arc(locFromLens.x + this.direction*myDial.dial*dialCoefficient, locFromLens.y,
          radiusScaled*0.9, arcAngleInitial, arcAngleFinal, (this.direction>0) );
        ctx.stroke();
        ctx.fill();
      }
    }
  }
}

let creatingCornealAbrasion = false;

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
  if (gatScreen.lens.loc.s > 5 && (
    Math.abs(gatScreen.lens.vel.x) > 1e-8 ||
    Math.abs(gatScreen.lens.vel.y) > 1e-8)
  ) {
    if (!creatingCornealAbrasion) {  // Don't create a duplicate message for the same abrasion
      creatingCornealAbrasion = true;
      displayOnConsole("Corneal abrasion! Don't move while on the cornea.");
    }

  } else {
    creatingCornealAbrasion = false;
  }
  $("#x-loc-displayer").html(gatScreen.lens.loc.x.toFixed(1).padStart(5).replaceAll(" ","&nbsp;"));
  $("#y-loc-displayer").html(gatScreen.lens.loc.y.toFixed(1).padStart(5).replaceAll(" ","&nbsp;"));
  $("#s-loc-displayer").html(gatScreen.lens.loc.s.toFixed(1).padStart(3).replaceAll(" ","&nbsp;"));
  $("#press-displayer").html(myDial.dial.toFixed(1).padStart(3).replaceAll(" ","&nbsp;")+" mmHg");

}

function displayOnConsole(message) {
  const time = (new Date()).toLocaleTimeString();
  const newElement = `<tr><td>${message}</td><td>${time}</td></tr>`;
  $("#GAT-console tbody").prepend(newElement);
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
