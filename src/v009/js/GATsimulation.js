import {isNullOrUndef, areArraysEqual, numberDictToStr} from "./helper.js";
import {personModification, personModificationOptions, setUpPhotoZooming, moveZoomingLensByJoystick, updateZoom, origPhoto, zoomingLens} from "./headshot.js";
import {Joy} from "./joystick.js";

const DIAL_COEFFICIENT = 0.3;
//const CORNEAL_ABRASION_SCALE_CUTOFF = 5;
const CORNEAL_ABRASION_DISTANCE_SQ_CUTOFF = 23*23;
const MIRE_VISIBILITY_TO_BE_GREEN = 0.9;  // between 0 and 1
const MIN_S_VAL = 2;
const MAX_S_VAL = 20;

// coordinates from top left, units in pixels
export const canvasSz = {wd:360, ht:360};
const photoResSz = {wd:3600,ht:3600};  // resolution from original file
const fileScale = {x:photoResSz.wd/canvasSz.wd, y:photoResSz.ht/canvasSz.ht };

let myDial = {"dialVal": 0};  // temp value

const centerLineY = canvasSz.ht/2;  // midpoint of screen where the distinction between top and bottom mire views is

// Right vs left is the patient's left (so it is opposite from how it looks on the photo)
const R_EYE = 0, L_EYE = 1; // with respect to pupils/eyes
const pupilLocs =[
  { x:1500/fileScale.x, y:1390/fileScale.y},  // found from visually looking at the image
  { x:2150/fileScale.x, y:1420/fileScale.y},  // found from visually looking at the image
]

const MIRE_RADIUS     = 3;  // will be multiplied by s (scale)
let MIRE_LINE_WD    = 0.5;   // will be multiplied by s (scale)


const MIRE_SEPARATION = MIRE_RADIUS*4;   // distance between mire circle centers when dial pressure is not set (or set at 0)
//const DEFAULT_ZOOMING_LENS_LOC = {x:100, y:100, s:5};

// https://www.w3schools.com/graphics/game_intro.asp
// https://www.w3schools.com/howto/howto_js_image_zoom.asp
export function startGat() {
  // mireCircle = new component(30, 30, "rgba(0, 0, 255, 0.5)", 10, 120);
  let mireCircleRightEye1 = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, pupilLocs[R_EYE].x, pupilLocs[R_EYE].y, +1);
  let mireCircleRightEye2 = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, pupilLocs[R_EYE].x, pupilLocs[R_EYE].y, -1);
  let mireCircleLeftEye1  = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, pupilLocs[L_EYE].x, pupilLocs[L_EYE].y, +1);
  let mireCircleLeftEye2  = new MireCircle(MIRE_RADIUS*2, MIRE_RADIUS*2, 0, pupilLocs[L_EYE].x, pupilLocs[L_EYE].y, -1);
  gatScreen.mireCircles = [mireCircleRightEye1, mireCircleRightEye2, mireCircleLeftEye1, mireCircleLeftEye2];
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
    //this.val   = Object.assign({}, DEFAULT_ZOOMING_LENS_LOC); // Object.assign performs shallow copy
    // x->x, Deg->y, y->s
    //this.val   = {x: Joy.getRawLocX({level:0}), y: Joy.getRawLocDeg({level:0}), s: Joy.getRawLocY({level:0})};
    this.val   = {x:0, y:0, s:0};
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

    const newLoc2 = this.checkAndSetLoc(newLoc);
    //console.log( numberDictToStr(newLoc2) );
  }
  get loc() {  // top left of zoomingLens
    return this.val;
  }
  get locCenter() {
    // This is the ratio of the origPhoto (or zoomedPhoto) to the zoomingLens
    return {
      x: this.loc.x + this.sz.wd/2,
      y: this.loc.y + this.sz.ht/2
    }
  }
  get drawnLoc() {  // from top left corner
    let x = zoomingLens.computedStyleMap().get("left").value;
    let y = zoomingLens.computedStyleMap().get("top").value;
    // ss = plural of s (aka scale)
    let ss = {x:origPhoto.offsetWidth / zoomingLens.offsetWidth, y:origPhoto.offsetHeight / zoomingLens.offsetHeight}
    return {x:x, y:y, s:ss.x};
  }
  setLoc(newAmount, doUpdateZoom=true) {
    this.setValue(newAmount);
    if (doUpdateZoom) updateZoom();
  }
  // rangeConstant represents the range of values that they must NEVER go out of
  static rangeConstant = {
    /* syntax is [min, max] */
    x:[0, canvasSz.wd],
    y:[0, canvasSz.ht],
    s:[MIN_S_VAL, MAX_S_VAL],
  }
  getRangeSpecific(proposedLoc) {
    const rangeSpecific = {
      /* syntax is [min, max] */
      x:[0, canvasSz.wd - gatScreen.lens.getSzForSof(proposedLoc.s).wd],
      y:[0, canvasSz.ht - gatScreen.lens.getSzForSof(proposedLoc.s).ht],
      s:[ZoomingLensController.rangeConstant.s[0], ZoomingLensController.rangeConstant.s[1]],
    };
    return rangeSpecific;
  }
  /* Must have s in input, but x and y are optional. Will not be in output if not in input. */
  getNormToScaled(normLoc) {
    const sRange = ZoomingLensController.rangeConstant.s;  // array of [min, max]
    let scaledLoc = { s: normLoc.s * (sRange[1]-sRange[0]) + sRange[0] }
    const rangeSpecific = gatScreen.lens.getRangeSpecific({"s": scaledLoc.s});
    if ("x" in normLoc) {
      scaledLoc["x"] = normLoc.x * (rangeSpecific.x[1]-rangeSpecific.x[0]) + rangeSpecific.x[0];
    }
    if ("y" in normLoc) {
      scaledLoc["y"] = normLoc.y * (rangeSpecific.y[1]-rangeSpecific.y[0]) + rangeSpecific.y[0];
    }
    return scaledLoc
  }
  /* Must have s in input, but x and y are optional. Will not be in output if not in input. */
  getScaledToNorm(scaledLoc) {
    const rangeSpecific = gatScreen.lens.getRangeSpecific({"s": scaledLoc.s});
    let normLoc = { s: (scaledLoc.s - rangeSpecific.s[0]) / (rangeSpecific.s[1]-rangeSpecific.s[0]) }
    if ("x" in scaledLoc) {
      normLoc["x"] = (scaledLoc.x - rangeSpecific.x[0]) / (rangeSpecific.x[1]-rangeSpecific.x[0]);
    }
    if ("y" in scaledLoc) {
      normLoc["y"] = (scaledLoc.y - rangeSpecific.y[0]) / (rangeSpecific.y[1]-rangeSpecific.y[0]);
    }
    return normLoc
  }
  // # indicates a private method
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
    range = this.getRangeSpecific(proposedLocFilled1);
    let [proposedLocFilled2, changedCt2] = this.#boundWithinRange(proposedLocFilled1, range);

    if (doReturnValue) {
      return proposedLocFilled2;
    } else {
      return changedCt1+changedCt2;
    }
  }
  checkAndSetLoc(newLoc) {
    //console.log(newLoc);
    const newLoc2 = this.checkNewLoc(newLoc);
    this.setLoc(newLoc2);
    return newLoc2;
  }
}


export let gatScreen = {
  canvas : document.createElement("canvas"),
  canvasController : document.createElement("canvas"),
  lens: new ZoomingLensController(),
  mireCircles: [],
  calcDistSqFromLoc: function(compareLoc) {
    return (gatScreen.lens.locCenter.x-compareLoc.x)**2 + (gatScreen.lens.locCenter.y-compareLoc.y)**2;
  },
  getMiresVisibility: function() {
    const sigmoidCenter = 10.0;  // value at which mireVisibility will be 0.5
    const k = 0.05;  // the greater the k, the more that the effect will be dampened (aka further from sigmoidCenter to get a value of 0.000 or 1.000)
    if (this.lens.loc.s<=1) {
      // ward off against invalid values
      return 0.0;
    } else if (this.lens.loc.s>40) {
      // save calculations as the logistic function will already give a value close to 1.0
      return 1.0;
    } else {

      const x = this.lens.loc.s;
      // z is center x as a new variable to put into a normalized logistic (sigmoid) function
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
    $(".gatViewContainer").append(this.canvas);
    this.canvasController.width = canvasSz.wd;
    this.canvasController.height = canvasSz.ht;
    this.contextController = this.canvasController.getContext("2d");
    $(".GAT-controller-view").append(this.canvasController);

    this.frameNo = 0;
    // Despite what pycharm, the interval function is used
    this.interval = setInterval(this.update, 20);
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

    /*
    $(".click-to-zoom").on("mousedown", function(event) {
      let accelZoomingLens = {x:null, y:null, s:null};  // null indicates don't change current value
      const button = event.button;
      if (button==0) {  // 0 is left click, 1 is middle, 2 is right click
        accelZoomingLens.s = +0.002;
      } else if (button==2) {
        accelZoomingLens.s = -0.02;
      }
      console.log(event.button);
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
    */
  },
  creatingCornealAbrasion: false,
  mireCircleAligned: false,
  update: function() {
    gatScreen.clear();
    gatScreen.frameNo += 1;

    if (personModification == "Low Fluoroscein") MIRE_LINE_WD = 0.1
    if (personModification == "High Fluoroscein") MIRE_LINE_WD = 0.8
    
    // Arguments:  (image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // (sx, sy, sWidth, sHeight) selects the image to show
    // dx, dy, dWidth, dHeight indicates where on the canvas to draw
    gatScreen.context.drawImage(origPhoto,
      gatScreen.lens.loc.x, gatScreen.lens.loc.y, gatScreen.lens.sz.wd, gatScreen.lens.sz.ht,
      0, 0, 360, 360)


    for (let i = 0; i < gatScreen.mireCircles.length; i += 1) {
      const mireCircle = gatScreen.mireCircles[i];
      mireCircle.updatePosition();
      mireCircle.updateDrawing();
    }

    myDial.text = "Dial: " + myDial.dialVal.toFixed(1) + " mmHg";
    myDial.updatePosition();    myDial.updateDrawing();

    gatScreen.lens.updatePosition();

    // Check for Mire circle alignment
    for (let i = 0; i < gatScreen.mireCircles.length; i += 1) {
      const mireCircle = gatScreen.mireCircles[i];
      if (
        Math.abs(mireCircle.xDialAdjustment) > 0.97*mireCircle.radius &&
        Math.abs(mireCircle.xDialAdjustment) < 1.03*mireCircle.radius
      ) {
        if (!this.mireCircleAligned) {
          this.mireCircleAligned = true;
          displayOnConsole("Mires aligned!");
        }
      } else {
        if (this.mireCircleAligned) {
          this.mireCircleAligned = false;
          displayOnConsole("Mires no longer aligned.");
        }
      }
    }
    // Check for a corneal abrasion is being created
    let hasMovedByKey = gatScreen.lens.vel.x**2 + gatScreen.lens.vel.y**2 > 1e-8;

    if (
      //gatScreen.lens.loc.s > CORNEAL_ABRASION_SCALE_CUTOFF &&
      gatScreen.getMiresVisibility() > MIRE_VISIBILITY_TO_BE_GREEN &&  // corneal abrasion cutoff is the same as the Mire green cutoff
      ( hasMovedByKey || gatScreen.hasMovedByJoystick || gatScreen.hasMovedByHover ) &&
      pupilLocs.some( (pupilLoc) => gatScreen.calcDistSqFromLoc(pupilLoc) < CORNEAL_ABRASION_DISTANCE_SQ_CUTOFF )  // check if func calcDistFromPupil is true for any elements in pupilLocs
    ) {
      gatScreen.hasMovedByJoystick = false;
      gatScreen.hasMovedByHover = false;
      if (!this.creatingCornealAbrasion) {  // Don't create a duplicate message for the same abrasion
        this.creatingCornealAbrasion = true;
        displayOnConsole("Corneal abrasion! Don't move while on the cornea.");
      }
    } else {
      this.creatingCornealAbrasion = false;
    }

    $("#x-loc-displayer").html(gatScreen.lens.loc.x.toFixed(1).padStart(5).replaceAll(" ","&nbsp;"));
    $("#y-loc-displayer").html(gatScreen.lens.loc.y.toFixed(1).padStart(5).replaceAll(" ","&nbsp;"));
    $("#s-loc-displayer").html(gatScreen.lens.loc.s.toFixed(1).padStart(3).replaceAll(" ","&nbsp;"));
    $("#press-displayer").html(myDial.dialVal.toFixed(1).padStart(3).replaceAll(" ","&nbsp;")+" mmHg");


  },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
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
    this.dialVal = 0;
    this.dialSpeed = 0;
  }
  updateDrawing() {
    let ctx = gatScreen.context;
    ctx.font = this.width + " " + this.height;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
  }
  updatePosition() {  // overrides empty method in Component
    this.dialVal += this.dialSpeed
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
  get xDialAdjustment() {
    return this.direction*myDial.dialVal*DIAL_COEFFICIENT
  }
  get xDialAdjusted() {
    return this.x + this.xDialAdjustment;
  }
  get yDialAdjusted() {
    return this.y;
  }
  updateDrawing() {  // overrides empty method in Component
    let ctx = gatScreen.context;
    let lens = gatScreen.lens

    // the angle starts from rightmost point (0) to bottom (pi/2) to leftmost (pi) backup through the top
    // arc inputs: x center, y center, radius, start angle (radians), end angle (radians), counterclockwise (optional)

    let arcAngleInitial = 0;           // in radians
    let arcAngleFinal   = 1 * Math.PI;   // in radians, aka 180 degrees

    // locFromLens means the coordinates are moved to be in the plane of the screen

    // get coordinates but translated to be within the lens and scaled up (zoom)
    let locFromLens = {
      x: lens.loc.s*(this.xDialAdjusted-lens.loc.x),
      y: lens.loc.s*(this.yDialAdjusted-lens.loc.y),
    };
    const radiusScaled = this.radius * lens.loc.s;


    // Draw big blue circle around Mires
    ctx.strokeStyle = `rgba(0,0,0,0.5)`;
    ctx.fillStyle = `rgba(0,0,255,0.5)`;
    ctx.lineWidth = MIRE_LINE_WD*10;  // 10x thickness of regular since much bigger
    ctx.beginPath();
    ctx.arc(180, 180,
      180, 0, 2*Math.PI,
      (this.direction>0) );
    ctx.stroke();
    ctx.fill();


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
        const isMireGreen = miresVisibility > MIRE_VISIBILITY_TO_BE_GREEN;
        const alpha = miresVisibility;
        const thickness = 1;  //lens.loc.s/5;  // corresponds to increasing blurriness/thickness as you get closer

        // Draw outline of Mire
        if (isMireGreen) ctx.strokeStyle = `rgba(0,255,0,${alpha*0.5})`;
        else ctx.strokeStyle = `rgba(0,0,255,${alpha*0.5})`;
        ctx.fillStyle = `rgba(0,0,0,0)`;
        ctx.lineWidth = MIRE_LINE_WD * lens.loc.s * thickness * 0.5;  // half thickness of routine
        ctx.beginPath();
        ctx.arc(locFromLens.x, locFromLens.y,
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
        ctx.arc(locFromLens.x, locFromLens.y,
          radiusScaled*0.9, arcAngleInitial, arcAngleFinal, (this.direction>0) );
        ctx.stroke();
        ctx.fill();
      }
    }
  }
}



function displayOnConsole(message) {
  const time = (new Date()).toLocaleTimeString();
  const newElement = `<tr><td>${message}</td><td>${time}</td></tr>`;
  $(".GAT-console tbody").prepend(newElement);
  console.log(message);
}

function everyInterval(n) {
  return ((gatScreen.frameNo / n) % 1 === 0)
}

export function accelerateZoomingLens(accelZoomingLens) {
  gatScreen.lens.setAcceleration(accelZoomingLens);
}
function accelerateMires(x,y) {
  for (let i = 0; i < gatScreen.mireCircles.length; i += 1) {
    const mireCircle = gatScreen.mireCircles[i]
    // By allowing false check, you can change on either direction without the other
    if (!isNaN(x)) { mireCircle.lrAccel = x; }
    if (!isNaN(y)) { mireCircle.udAccel = y; }
  }
}
function stopMovementOfMires() {
  for (let i = 0; i < gatScreen.mireCircles.length; i += 1) {
    const mireCircle = gatScreen.mireCircles[i]
    mireCircle.lrSpeed = 0.0;
    mireCircle.udSpeed = 0.0;
  }
  accelerateMires(0,0);
}

export function changeDial(dialSpeed) {
  // could also test !isNaN(dialSpeed)
  if (!isNullOrUndef(dialSpeed)) { myDial.dialSpeed = dialSpeed; }
}


export let ZLC = ZoomingLensController;
export let lens = gatScreen.lens;
