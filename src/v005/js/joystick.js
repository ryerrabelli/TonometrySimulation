
let Joy;
const useJoy = true;

function setUpJoystick() {
  // Create JoyStick object into the DIV 'joyDiv'
  const joyParam = {
    "title": "joystick",
    "autoReturnToCenter": false,
    "startNormX": 0.5,
    "startNormY": 0,
  };
  if (useJoy) {
    Joy = new JoyStick("joyDiv", joyParam, function(stickData) {
      let joyNormHor = stickData.xNorm;
      let joyNormVer = stickData.yNorm;
      moveZoomingLensByJoystick(joyNormHor, joyNormVer);
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
