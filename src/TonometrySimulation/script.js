var myGamePieces;
var myDial;
var dialCoefficient = 10;

var canvasWd = 480
var canvasHt = 360
var centerLineY = canvasHt/2
var radius = 100
var lineWidth = 5;


// https://www.w3schools.com/graphics/game_intro.asp
function startGame() {
  // 120
  // myGamePiece = new component(30, 30, "rgba(0, 0, 255, 0.5)", 10, 120);
  myGamePiece1 = new component(radius, radius, "rgba(128, 255, 0, 0.5)", canvasWd/2-radius, canvasHt/2, "arc", +1);
  myGamePiece2 = new component(radius, radius, "rgba(0, 255, 128, 0.5)", canvasWd/2+radius, canvasHt/2, "arc", -1);
  myGamePieces = [myGamePiece1, myGamePiece2];
  myDial = new component("30px", "Consolas", "black", 10, 40, "text");
  myGameArea.start();
}

var myGameArea = {
  canvas : document.createElement("canvas"),
  start : function() {
    this.canvas.width = 480;
    this.canvas.height = 360;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);
    },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function component(width, height, color, x, y, type, direction) {
    this.type = type;
    this.width = width;
    this.height = height;

    // below only relevant if this is a myDial component
    this.dial = 0;
    this.dialSpeed = 0;
    this.radius = this.height/2;
    // +1 -> above aka clockwise starting from rightmost point
    // -1 -> aka counterclockwise starting from rightmost point
    this.direction = direction;

    this.x = x;  // does not take into account the dial
    this.y = y;
    // below only relevant if a myGamePiece
    this.lrSpeed = 0;
    this.lrAccel = 0;
    this.udSpeed = 0;
    this.udAccel = 0;

    this.update = function() {
      ctx = myGameArea.context;
      if (this.type == "text") {
        ctx.font = this.width + " " + this.height;
        ctx.fillStyle = color;
        ctx.fillText(this.text, this.x, this.y);

      } else if (this.type == "arc") {
        // the angle starts from rightmost point (0) to bottom (pi/2) to leftmost (pi) backup through the top
        // arc inputs: x center, y center, radius, start angle (radians), end angle (radians), counterclockwise (optional)

        initialAngle = 0;           // radians
        finalAngle = 1 * Math.PI;   // radians
        if (direction <= 0 && this.y + this.radius < centerLineY) {
          // Nothing to draw
        } else if (direction > 0 && this.y - this.radius > centerLineY) {
          // Nothing to draw
        } else {

          if (direction <= 0 && this.y - this.radius > centerLineY) {
            // Draw full circle
            initialAngle = 0;
            finalAngle = 2 * Math.PI;
          } else if (direction > 0 && this.y + this.radius < centerLineY) {
            // Draw full circle
            initialAngle = 0;
            finalAngle = 2 * Math.PI;
          } else {
            // Draw part of a circle
            offsetAngle = Math.asin( (centerLineY-this.y)/this.radius)
            initialAngle = 0 + offsetAngle;          // radians
            finalAngle = 1 * Math.PI - offsetAngle;  // radians
          }
          // Draw outline
          ctx.strokeStyle = "black";
          ctx.lineWidth = lineWidth * 2;
          ctx.beginPath();
          ctx.arc(this.x + this.direction*myDial.dial*dialCoefficient, this.y,
            this.height/2, initialAngle, finalAngle, (direction>0 ? true : false));
          ctx.stroke();

          // Draw actual green circle
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.arc(this.x + this.direction*myDial.dial*dialCoefficient, this.y,
            this.radius, initialAngle, finalAngle, (direction>0 ? true : false) );
          ctx.stroke();
        }


      } else {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }

    }
    this.newPos = function() {
        this.udSpeed += this.udAccel;
        this.lrSpeed += this.lrAccel;
        this.x += this.lrSpeed;
        this.y += this.udSpeed;
        this.hitBottom();

        this.dial += this.dialSpeed
    }
    this.hitBottom = function() {
        var rockbottom = myGameArea.canvas.height - this.height;
        if (this.y > rockbottom) {
            this.y = rockbottom;
            this.udSpeed = 0;
        }
    }
    this.crashWith = function(otherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function updateGameArea() {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;
    myGameArea.clear();
    myGameArea.frameNo += 1;
    if (myGameArea.frameNo == 1 || everyinterval(150)) {
        x = myGameArea.canvas.width;
        minHeight = 20;
        maxHeight = 200;
        height = Math.floor(Math.random()*(maxHeight-minHeight+1)+minHeight);
        minGap = 50;
        maxGap = 200;
        gap = Math.floor(Math.random()*(maxGap-minGap+1)+minGap);
    }
    myDial.text="Dial: " + myDial.dial.toFixed(1) + "mmHg";
    myDial.newPos();
    myDial.update();
    for (i = 0; i < myGamePieces.length; i += 1) {
      myGamePiece = myGamePieces[i]
      myGamePiece.newPos();
      myGamePiece.update();
    }

}

function everyinterval(n) {
    if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
    return false;
}

function accelerate(x,y) {
  for (i = 0; i < myGamePieces.length; i += 1) {
    myGamePiece = myGamePieces[i]
    myGamePiece.lrSpeed = 0.0;
    myGamePiece.lrAccel = x;
    myGamePiece.udSpeed = 0.0;
    myGamePiece.udAccel = y;
  }
}
function changedial(change) {
  myDial.dialSpeed = change
}
