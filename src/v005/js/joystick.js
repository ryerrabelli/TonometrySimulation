
function setUpJoystick() {
  // Create JoyStick object into the DIV 'joyDiv'
  const joyParam = {
    "title": "joystick",
    "autoReturnToCenter": false,
  };
  const Joy = new JoyStick("joyDiv", joyParam);


  const joyIinputPosX = document.getElementById("joyPosizioneX");
  const joyInputPosY = document.getElementById("joyPosizioneY");
  const joyDirezione = document.getElementById("joyDirezione");
  const joyX = document.getElementById("joyX");
  const joyY = document.getElementById("joyY");

  setInterval(function(){ joyIinputPosX.value=Joy.GetPosX(); }, 50);
  setInterval(function(){ joyInputPosY.value=Joy.GetPosY(); }, 50);
  setInterval(function(){ joyDirezione.value=Joy.GetDir(); }, 50);
  setInterval(function(){ joyX.value=Joy.GetX(); }, 50);
  setInterval(function(){ joyY.value=Joy.GetY(); }, 50);

}
