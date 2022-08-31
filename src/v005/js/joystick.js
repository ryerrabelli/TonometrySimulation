
function setUpJoystick() {
  // Create JoyStick object into the DIV 'joyDiv'
  const joyParam = {
    "title": "joystick",
    "autoReturnToCenter": false,
  };
  const Joy = new JoyStick("joyDiv", joyParam);


  const joyInputPosX = document.getElementById("joyPositionX");
  const joyInputPosY = document.getElementById("joyPositionY");
  const joyDirection = document.getElementById("joyDirection");
  const joyX = document.getElementById("joyX");
  const joyY = document.getElementById("joyY");

  setInterval(function(){ joyInputPosX.value=Joy.GetPosX(); }, 50);
  setInterval(function(){ joyInputPosY.value=Joy.GetPosY(); }, 50);
  setInterval(function(){ joyDirection.value=Joy.GetDir(); }, 50);
  setInterval(function(){ joyX.value=Joy.GetX(); }, 50);
  setInterval(function(){ joyY.value=Joy.GetY(); }, 50);

}
