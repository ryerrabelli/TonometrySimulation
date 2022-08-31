
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


  const joyInputPosX = document.getElementById("joyPositionX");
  const joyInputPosY = document.getElementById("joyPositionY");
  const joyDirection = document.getElementById("joyDirection");
  const joyX = document.getElementById("joyX");
  const joyY = document.getElementById("joyY");

  setInterval(function(){ joyInputPosX.value=Joy.GetPosX().toFixed(1);; }, 50);
  setInterval(function(){ joyInputPosY.value=Joy.GetPosY().toFixed(1);; }, 50);
  setInterval(function(){ joyDirection.value=Joy.GetDir(); }, 50);
  setInterval(function(){ joyX.value=Joy.GetNormX().toFixed(4);; }, 50);
  setInterval(function(){ joyY.value=Joy.GetNormY().toFixed(4); }, 50);

}
