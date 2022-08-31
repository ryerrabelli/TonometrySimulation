
function setUpJoystick() {
  // Create JoyStick object into the DIV 'joy2Div'
  const joy2Param = {"title": "joystick2", "autoReturnToCenter": false};
  const Joy2 = new JoyStick('joy2Div', joy2Param);

  const joy2IinputPosX = document.getElementById("joy2PosizioneX");
  const joy2InputPosY = document.getElementById("joy2PosizioneY");
  const joy2Direzione = document.getElementById("joy2Direzione");
  const joy2X = document.getElementById("joy2X");
  const joy2Y = document.getElementById("joy2Y");

  setInterval(function(){ joy2IinputPosX.value=Joy2.GetPosX(); }, 50);
  setInterval(function(){ joy2InputPosY.value=Joy2.GetPosY(); }, 50);
  setInterval(function(){ joy2Direzione.value=Joy2.GetDir(); }, 50);
  setInterval(function(){ joy2X.value=Joy2.GetX(); }, 50);
  setInterval(function(){ joy2Y.value=Joy2.GetY(); }, 50);
}
