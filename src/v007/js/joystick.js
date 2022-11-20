//import {JoyStick} from "../../lib/JoyStick/joy.js";
import {JoyStick} from "https://ryerrabelli.github.io/JoyStick/joy.js"
import {setUpPhotoZooming, moveZoomingLensByJoystick, updateZoom} from "./headshot.js";
import {lens, ZLC, gatScreen, canvasSz} from "./GATsimulation.js";
import {isNullOrUndef, areArraysEqual, numberDictToStr} from "./helper.js";


export let Joy;
const useJoy = true;

const DEG = "\u00B0";   // can't just console.log the ° symbol, have to use the unicode symbol to format correctly
//const DEG = "°";

function onJoyStickUpdate(stickStatus) {
  const joyNormHorLev0 = stickStatus.normLocXLev0;
  const joyNormVerLev0 = stickStatus.normLocYLev0;
  const joyNormHorLev1 = stickStatus.normLocXLev1;
  const joyNormVerLev1 = stickStatus.normLocYLev1;
  const joyNormDir = 1-stickStatus.normLocDeg;   // apply 1- so that bottom of the screen becomes top

  // create combined value, then divide by max possible value
  const relativeJoystickPower = 0.2;
  let joyNormHorCombined = (joyNormHorLev0 + joyNormHorLev1*relativeJoystickPower) / (1+relativeJoystickPower);
  let joyNormVerCombined = (joyNormVerLev0 + joyNormVerLev1*relativeJoystickPower) / (1+relativeJoystickPower);
  //const joyNormHorCombined = stickStatus.xNormLevCombined;
  //const joyNormVerCombined = stickStatus.yNormLevCombined;
  //console.log(joyNormHorLev0, joyNormVerLev0);
  moveZoomingLensByJoystick(joyNormHorCombined, joyNormVerCombined, joyNormDir);
}

function onTimerUpdate() {
  const joyRawHors = [document.getElementById("joyRawHor0"), document.getElementById("joyRawHor1")];
  const joyRawVers = [document.getElementById("joyRawVer0"), document.getElementById("joyRawVer1")];
  const joyNormHors = [document.getElementById("joyNormHor0"), document.getElementById("joyNormHor1")];
  const joyNormVers = [document.getElementById("joyNormVer0"), document.getElementById("joyNormVer1")];
  const joyCardinalDirection = document.getElementById("joyCardinalDirection");
  const joyDeg = document.getElementById("joyDeg");

  for (let level=0; level<=1; level++) {
    joyRawHors[level].value=Joy.getRawLocX({level: level}).toFixed(1);
    joyRawVers[level].value=Joy.getRawLocY({level: level}).toFixed(1);
    joyNormHors[level].value=Joy.getNormLocX({level: level}).toFixed(4);
    joyNormVers[level].value=Joy.getNormLocY({level: level}).toFixed(4);
  }
  joyCardinalDirection.value=Joy.getCardinalDirection();
  joyDeg.value=Joy.getRawLocDeg().toFixed(1)+DEG;
}

export function setUpJoystick() {
  if (useJoy) {


    // Create JoyStick object into the DIV 'joyDiv'
    const joyParam = {
      title: "joystick",
      autoReturnToCenter: false,
      width: 360,  // can also given as "#px" in the css for the container
      height: 360,
      internalRadius: 30,
      radiiDifference: 225,
      moveRelativeToInitialMouseDown: true,
      maxMoveStickBeyondInternalRadius: 75,
      joystickLevels: 2,
      arrowCount: 1,
      minArrowLocDegrees: 0,
      maxArrowLocDegrees: 720,
      // Math.random() gives value in range [0,1)
      // Make it so there is some randomness but it never starts near the edge
      startArrowLocDegrees: 180+360*Math.random(),  // start somewhere in the middle
      // Although Lev0 can be on the edge, the combination with Lev1 won't be
      startNormLocXLev0: Math.random(),
      startNormLocYLev0: 0.1,
      startNormLocXLev1: 0.5,
      startNormLocYLev1: 0.5,
    };
    Joy = new JoyStick("joyDiv", joyParam, onJoyStickUpdate);

    // x->x, Deg->y, y->s
    let newLoc = {x:Joy.getNormLocX(), y:Joy.getNormLocDeg(), s:Joy.getNormLocY()};
    const scaledLoc = gatScreen.lens.getNormToScaled(newLoc);  // convert to scaling of the UI
    gatScreen.lens.setLoc(scaledLoc);


    setInterval(onTimerUpdate, 50)
  }


}
