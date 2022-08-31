
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
  const joyHor = document.getElementById("joyHor");
  const joyVer = document.getElementById("joyVer");

  setInterval(function(){ joyInputPosHor.value=Joy.GetPosX().toFixed(1);; }, 50);
  setInterval(function(){ joyInputPosVer.value=Joy.GetPosY().toFixed(1);; }, 50);
  setInterval(function(){ joyDirection.value=Joy.GetDir(); }, 50);
  setInterval(function(){ joyHor.value=Joy.GetNormX().toFixed(4);; }, 50);
  setInterval(function(){ joyVer.value=Joy.GetNormY().toFixed(4); }, 50);

}
