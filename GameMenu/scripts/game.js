/*
Les collisions sont tirées du code de la vidéo suivante :
https://youtu.be/XYzA_kPWyJ8

A chaque clic de souris, une nouvelle balle est générée. 
Il est possible de sélectionner une balle et de la faire entrer en collision 
avec d'autres balles en la déplaçant ou en la jetant
Les collisions peuvent également être générées en déplaçant la fenêtre
Les balles seront progressivement supprimées en fonction de l'espace que prend le total de toutes les balles

*/

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const mouse = {
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  movement: { x: 0, y: 0 },
};

const win = {
  history: [new Position(window.screenX, window.screenY)],
  delta: new Position(0, 0),
};

const balls = {
  stack: [], // tableau dans lequel toutes les balles seront contenues
  focused: { click: undefined, hover: undefined }, // balle cliquée et ciblée
};

// Event Listeners
addEventListener('mousemove', (event) => {
  mouse.position.x = event.clientX;
  mouse.position.y = event.clientY;
  mouse.movement.x = event.movementX;
  mouse.movement.y = event.movementY;

  balls.focused.hover = undefined;
  balls.stack.forEach((ball) => {
    if (ball.isTouched(event.x, event.y, ball.radius)) {
      balls.focused.hover = ball;
    }
  });
});

addEventListener('resize', () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

addEventListener('mousedown', (event) => {
  balls.stack.forEach((ball) => {
    if (ball.isTouched(event.x, event.y, ball.radius)) {
      balls.focused.click = ball;
    }
  });
});

function winMovement(position) {
  if (win.history.length == 2) {
    lastPosition = win.history.pop();
    win.delta = new Position(
      position.x - lastPosition.x,
      position.y - lastPosition.y
    );
  }
  win.history.unshift(position);
}

/* Génération d'un nombre dans une plage donnée */
function randomIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/* Génération d'une couleur aléatoire */
function randomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/* Distance entre 2 balles */
function distance(x1, y1, x2, y2) {
  const xDist = x2 - x1;
  const yDist = y2 - y1;

  return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

/* Merci les mathématiques */
function rotate(velocity, angle) {
  const rotatedVelocities = {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
  };

  return rotatedVelocities;
}

/* Merci les mathématiques */
function resolveCollision(particle, otherParticle) {
  const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
  const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

  const xDist = otherParticle.x - particle.x;
  const yDist = otherParticle.y - particle.y;

  // prevent accidental overlap of balls
  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    // grab angle between the two colliding balls
    const angle = -Math.atan2(yDist, xDist);

    // store mass in var for better readability in collision equation
    const m1 = particle.mass;
    const m2 = otherParticle.mass;

    // velocity before equation
    const u1 = rotate(particle.velocity, angle);
    const u2 = rotate(otherParticle.velocity, angle);

    // velocity after 1d collision equation
    const v1 = {
      x: (u1.x * (m1 - m2)) / (m1 + m2) + (u2.x * 2 * m2) / (m1 + m2),
      y: u1.y,
    };
    const v2 = {
      x: (u2.x * (m1 - m2)) / (m1 + m2) + (u1.x * 2 * m2) / (m1 + m2),
      y: u2.y,
    };

    // final velocity after rotating axis to original location
    const vFinal1 = rotate(v1, -angle);
    const vFinal2 = rotate(v2, -angle);

    // swap particle velocities for realistic bounce effect
    particle.velocity.x = vFinal1.x;
    particle.velocity.y = vFinal1.y;

    otherParticle.velocity.x = vFinal2.x;
    otherParticle.velocity.y = vFinal2.y;
  }
}

/* Balle générique */
function Ball(x, y, radius, mass, color) {
  this.x = x;
  this.y = y;
  this.velocity = {
    x: Math.floor(Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1),
    y: Math.floor(Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1),
  };
  this.radius = radius;
  this.color = color;
  this.mass = mass;
  this.opacity = 0.3;
  this.gravity = 0.2;
  this.damping = 0.9;
  this.traction = 0.98;

  /* Update des éléments de la balle en fonction de la collision avec une autre balle ou un mur */
  this.update = () => {
    let collision;
    this.draw();

    if (this === balls.focused.click) {
      this.x = mouse.position.x;
      this.y = mouse.position.y;
      this.velocity.x = mouse.movement.x;
      this.velocity.y = mouse.movement.y;
    }
    if (this === balls.focused.hover && this.opacity < 0.6) {
      this.glowUp();
    } else if (this.opacity > 0.25) {
      this.glowDown();
    }

    collision = this.collide();
    this.checkWalls();

    if (!collision) {
      this.velocity.y += this.gravity;
      this.winMove();
    }
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  };

  this.winMove = () => {
    this.x -= Math.floor(win.delta.x / 4);
    this.y -= Math.floor(win.delta.y / 4);
    this.velocity.x += Math.abs(win.delta.x / 100);
    this.velocity.y += Math.abs(win.delta.y / 100);
  };

  this.collide = () => {
    let collision = false;
    balls.stack.forEach((ball) => {
      if (this === ball) return;
      if (this.isTouched(ball.x, ball.y, this.radius * 2)) {
        collision = true;
        resolveCollision(this, ball);
      }
    });
    return collision;
  };

  /* Vérification si collision avec un mur et update des vitesses */
  this.checkWalls = () => {
    if (this.x + this.radius > canvas.width) {
      this.velocity.x = -this.velocity.x * this.damping;
      this.x = canvas.width - this.radius;
    }
    if (this.x - this.radius < 0) {
      this.velocity.x = -this.velocity.x * this.damping;
      this.x = this.radius;
    }

    if (this.y + this.radius > canvas.height) {
      this.velocity.y = -this.velocity.y * this.damping;
      this.y = canvas.height - this.radius;
      this.velocity.x *= this.traction;
    }
    if (this.y - this.radius < 0) {
      this.velocity.y = -this.velocity.y * this.damping;
      this.y = this.radius;
    }
  };

  this.glowUp = () => {
    this.opacity += 0.01;
  };

  this.glowDown = () => {
    this.opacity -= 0.01;
    this.opacity = Math.max(0, this.opacity);
  };

  this.isTouched = (x, y, radius) =>
    distance(x, y, this.x, this.y) - radius < 0;

  /* Dessin de la balle */
  this.draw = () => {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.save();
    context.globalAlpha = this.opacity;
    context.fillStyle = color;
    context.fill();
    context.restore();
    context.strokeStyle = this.color;
    context.stroke();
    context.closePath();
  };
}

function Position(x, y) {
  this.x = x;
  this.y = y;
}

// Implementation
function init() {
  canvas.width = innerWidth;
  canvas.height = document.getElementById('navbar')
    ? innerHeight - document.getElementById('navbar').offsetHeight
    : innerHeight;
  canvas.addEventListener('click', handleMouseClick);
}

// Animation
function animate() {
  requestAnimationFrame(animate);
  context.clearRect(0, 0, canvas.width, canvas.height);

  winMovement(new Position(window.screenX, window.screenY));

  /* Update la position de toutes les balles */
  balls.stack.forEach((ball) => {
    ball.update();
  });
}

/* Générer une nouvelle balle à chaque clic de souris */
function handleMouseClick(event) {
  if (balls.focused.click) {
    balls.focused.click = undefined;
    return;
  }

  /* Si plusieurs balles ont été crées, checker s'il n'est pas nécessaire d'en supprimer */
  if (balls.stack.length >= 2) {
    let sumRadius = balls.stack.reduce(function (a, b) {
      return {
        radius: a.radius + b.radius,
      };
    });
    if (sumRadius.radius * 3 >= canvas.width) {
      balls.stack.shift(); // suppression de la première balle de la pile
    }
  }
  /* Génération d'une balle de rayon, couleur et masse aléatoires */
  let radius = randomIntFromRange(20, 50);
  let color = randomColor();
  let mass = randomIntFromRange(10, 15);

  balls.stack.push(new Ball(event.x, event.y, radius, mass, color));
}

init();
animate();
