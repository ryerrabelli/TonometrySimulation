
let Joy;

function setUpJoystick() {
  // Create JoyStick object into the DIV 'joyDiv'
  const joyParam = {
    "title": "joystick",
    "autoReturnToCenter": false,
    "startNormX": 0.5,
    "startNormY": 0,
  };
  Joy = new JoyStick("joyDiv", joyParam);


  const joyInputPosHor = document.getElementById("joyPositionHor");
  const joyInputPosVer = document.getElementById("joyPositionVer");
  const joyDirection = document.getElementById("joyDirection");
  const joyNormHor = document.getElementById("joyHor");
  const joyNormVer = document.getElementById("joyVer");

  setInterval(function(){ joyInputPosHor.value=Joy.GetPosX().toFixed(1);; }, 50);
  setInterval(function(){ joyInputPosVer.value=Joy.GetPosY().toFixed(1);; }, 50);
  setInterval(function(){ joyDirection.value=Joy.GetDir(); }, 50);
  setInterval(function(){ joyNormHor.value=Joy.GetNormX().toFixed(4);; }, 50);
  setInterval(function(){ joyNormVer.value=Joy.GetNormY().toFixed(4); }, 50);

}
