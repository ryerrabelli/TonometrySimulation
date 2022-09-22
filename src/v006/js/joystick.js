//import {JoyStick} from "../../lib/JoyStick/joyV2";


let Joy;
const useJoy = true;

function setUpJoystick() {
  // Create JoyStick object into the DIV 'joyDiv'
  const joyParam = {
    title: "joystick",
    autoReturnToCenter: false,
    startNormLocX: 0.5,
    startNormLocY: 0,
    width: 360,  // can also given as "#px" in the css for the container
    height: 360,
    internalRadius: 30,
    radiiDifference: 100,
    moveRelativeToInitialMouseDown: true,
    maxMoveStickBeyondInternalRadius: 75,
    joystickLevels: 2,
  };
  if (useJoy) {
    Joy = new JoyStick("joyDiv", joyParam, function(stickStatus) {
      const joyNormHorLev0 = stickStatus.xNormLev0;
      const joyNormVerLev0 = stickStatus.yNormLev0;
      const joyNormHorLev1 = stickStatus.xNormLev1;
      const joyNormVerLev1 = stickStatus.yNormLev1;

      // create combined value, then divide by max possible value
      const relativeJoystickPower = 0.2;
      let joyNormHorCombined = (joyNormHorLev0 + joyNormHorLev1*relativeJoystickPower) / (1+relativeJoystickPower);
      let joyNormVerCombined = (joyNormVerLev0 + joyNormVerLev1*relativeJoystickPower) / (1+relativeJoystickPower);
      //const joyNormHorCombined = stickStatus.xNormLevCombined;
      //const joyNormVerCombined = stickStatus.yNormLevCombined;

      moveZoomingLensByJoystick(joyNormHorCombined, joyNormVerCombined);
    });

    const joyInputPosHor = document.getElementById("joyPositionHor");
    const joyInputPosVer = document.getElementById("joyPositionVer");
    const joyDirection = document.getElementById("joyDirection");
    const joyNormHor = document.getElementById("joyHor");
    const joyNormVer = document.getElementById("joyVer");

    setInterval(function(){ joyInputPosHor.value=Joy.GetRawLocX().toFixed(1);; }, 50);
    setInterval(function(){ joyInputPosVer.value=Joy.GetRawLocY().toFixed(1);; }, 50);
    setInterval(function(){ joyDirection.value=Joy.GetCardinalDirection(); }, 50);
    setInterval(function(){ joyNormHor.value=Joy.GetNormLocX().toFixed(4);; }, 50);
    setInterval(function(){ joyNormVer.value=Joy.GetNormLocY().toFixed(4); }, 50);
  }


}
