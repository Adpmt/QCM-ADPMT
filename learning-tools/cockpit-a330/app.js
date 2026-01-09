// Prototype Babylon.js : caméra fixe (pivot) + clic sur zones + quiz

const canvas = document.getElementById("renderCanvas");
const statusEl = document.getElementById("status");
const questionEl = document.getElementById("question");
const scoreEl = document.getElementById("score");
const missEl = document.getElementById("miss");
const btnNext = document.getElementById("btnNext");
const btnReset = document.getElementById("btnReset");

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});

let score = 0;
let miss = 0;

// --- Quiz minimal ---
// Ici, les "id" doivent correspondre à mesh.metadata.instrumentId
const QUESTIONS = [
  { id: "MCDU", label: "Trouve le MCDU" },
  { id: "ECAM_SD", label: "Trouve l’écran ECAM SD" },
  { id: "ECAM_EWD", label: "Trouve l’écran ECAM E/WD" },
  { id: "PEDESTAL", label: "Clique sur le pedestal (zone)" },
  { id: "MAIN_PANEL", label: "Clique sur le Main Panel (zone)" },
];

let current = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function setQuestion(q) {
  current = q;
  questionEl.textContent = q ? q.label : "—";
  setStatus("À toi de jouer.");
}

function nextQuestion() {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  setQuestion(q);
}

function updateScoreUI() {
  scoreEl.textContent = String(score);
  missEl.textContent = String(miss);
}

// --- Scene ---
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.45, 0.75, 0.90, 1.0);

// Lumières
const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(20,20, 30), scene);
hemi.intensity = 5;

// Caméra : ArcRotate = pivot simple (parfait pour ton mode “tourner la tête”)
const camera = new BABYLON.ArcRotateCamera(
  "cam",
  BABYLON.Tools.ToRadians(90), // alpha (gauche/droite)
  BABYLON.Tools.ToRadians(90),  // beta (haut/bas)
  0.01,                           // rayon (distance)
  new BABYLON.Vector3(0, 2.3, 2), // cible
  scene
);

camera.attachControl(canvas, true);
camera.panningSensibility = 0;
camera.wheelPrecision = 250;


// Limites de rotation (évite de regarder derrière/sol/plafond)
camera.lowerAlphaLimit = BABYLON.Tools.ToRadians(-90);
camera.upperAlphaLimit = BABYLON.Tools.ToRadians(270);
camera.lowerBetaLimit  = BABYLON.Tools.ToRadians(30);
camera.upperBetaLimit  = BABYLON.Tools.ToRadians(179);

// Limites de zoom (optionnel) — tu peux même le bloquer totalement
camera.lowerRadiusLimit = 0;
camera.upperRadiusLimit = 2;

// --- “Cockpit” simplifié : 3 grands panneaux + 3 zones instruments ---
// Sol
const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 4, height: 4 }, scene);
floor.position.y = 0;
const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
floorMat.diffuseColor = new BABYLON.Color3(0.10, 0.12, 0.16);
floor.material = floorMat;

// Main panel (plan vertical)
const mainPanel = BABYLON.MeshBuilder.CreatePlane(
  "mainPanel",
  { width: 3, height: 1.0, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
  scene
);
mainPanel.position = new BABYLON.Vector3(0, 1.4, 0);
mainPanel.rotation.y = Math.PI;
mainPanel.metadata = { instrumentId: "MAIN_PANEL" };

const mpMat = new BABYLON.StandardMaterial("mpMat", scene);
mpMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
mpMat.diffuseTexture = new BABYLON.Texture("./textures/mainpanel.png", scene);
mpMat.backFaceCulling = false;
mainPanel.material = mpMat;

// Overhead (plan horizontal au-dessus)
const overhead = BABYLON.MeshBuilder.CreatePlane("overhead", { width: 1, height: 2.5, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
overhead.position = new BABYLON.Vector3(0, 3.5, 2);

// Overhead doit être "plafond" => on le couche (rotation X)
overhead.rotation.x = BABYLON.Tools.ToRadians(90);
// et on peut aussi le tourner pour qu'il soit orienté correctement
overhead.rotation.y = Math.PI;


overhead.metadata = { instrumentId: "OVERHEAD" };

const ohMat = new BABYLON.StandardMaterial("ohMat", scene);
ohMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
ohMat.diffuseTexture = new BABYLON.Texture("./textures/overhead.png", scene); 
ohMat.useAlphaFromDiffuseTexture = true;
ohMat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
ohMat.diffuseTexture.wAng = Math.PI;
ohMat.backFaceCulling = false;
overhead.material = ohMat;
ohMat.diffuseTexture.uScale = -1;
ohMat.diffuseTexture.uOffset = 1;



// Pedestal (plan incliné)
const pedestal = BABYLON.MeshBuilder.CreatePlane("pedestal", { width: 0.9, height: 3 }, scene);
pedestal.position = new BABYLON.Vector3(0, 0.89, 1.5);
pedestal.rotation.x = BABYLON.Tools.ToRadians(87);
pedestal.rotation.y = Math.PI;
pedestal.metadata = { instrumentId: "PEDESTAL" };

const pedMat = new BABYLON.StandardMaterial("pedMat", scene);
pedMat.diffuseTexture = new BABYLON.Texture("./textures/pedestal.png", scene); 
pedMat.diffuseColor = new BABYLON.Color3(0.16, 0.18, 0.22);
pedestal.material = pedMat;



// Zones “instruments” (petits rectangles cliquables posés sur les panneaux)
// ECAM SD (sur main panel)
// const ecamSD = BABYLON.MeshBuilder.CreatePlane("ecamSD", { width: 0.42, height: 0.20 }, scene);
//ecamSD.position = new BABYLON.Vector3(-0.25, 1.05, 1.19);
//ecamSD.rotation.y = Math.PI;
//ecamSD.metadata = { instrumentId: "ECAM_SD" };

//const ecamMat = new BABYLON.StandardMaterial("ecamMat", scene);
//ecamMat.diffuseColor = new BABYLON.Color3(0.10, 0.35, 0.18);
//ecamSD.material = ecamMat;

// ECAM E/WD
//const ecamEWD = BABYLON.MeshBuilder.CreatePlane("ecamEWD", { width: 0.42, height: 0.20 }, scene);
//ecamEWD.position = new BABYLON.Vector3(0.25, 1.05, 1.19);
//ecamEWD.rotation.y = Math.PI;
//ecamEWD.metadata = { instrumentId: "ECAM_EWD" };

//const ewdMat = new BABYLON.StandardMaterial("ewdMat", scene);
//ewdMat.diffuseColor = new BABYLON.Color3(0.35, 0.20, 0.10);
//ecamEWD.material = ewdMat;

// MCDU (sur pedestal)
const mcdu = BABYLON.MeshBuilder.CreatePlane("mcdu", { width: 0.35, height: 0.22 }, scene);
mcdu.position = new BABYLON.Vector3(0, 0.80, 0.52);
mcdu.rotation.x = pedestal.rotation.x;
mcdu.rotation.y = Math.PI;
mcdu.metadata = { instrumentId: "MCDU" };

const mcduMat = new BABYLON.StandardMaterial("mcduMat", scene);
mcduMat.diffuseColor = new BABYLON.Color3(0.12, 0.22, 0.40);
mcdu.material = mcduMat;

// Petit surlignage au survol (simple)
let lastHover = null;

scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
    const pick = scene.pick(scene.pointerX, scene.pointerY);
    if (lastHover && lastHover.material && lastHover.material.emissiveColor) {
      lastHover.material.emissiveColor = BABYLON.Color3.Black();
    }
    lastHover = null;

    if (pick?.hit && pick.pickedMesh?.metadata?.instrumentId) {
      lastHover = pick.pickedMesh;
      if (lastHover.material) {
        lastHover.material.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
      }
    }
  }

  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
    const pick = scene.pick(scene.pointerX, scene.pointerY);
    if (!pick?.hit) return;

    const mesh = pick.pickedMesh;
    const clickedId = mesh?.metadata?.instrumentId;
    if (!clickedId || !current) return;

    if (clickedId === current.id) {
      score += 1;
      setStatus(`✅ Correct : ${clickedId}`);
      updateScoreUI();
      nextQuestion();
    } else {
      miss += 1;
      setStatus(`❌ Raté : tu as cliqué ${clickedId} (attendu ${current.id})`);
      updateScoreUI();
    }
  }
});

btnNext.addEventListener("click", nextQuestion);
btnReset.addEventListener("click", () => {
  score = 0;
  miss = 0;
  updateScoreUI();
  setStatus("Score remis à zéro.");
});

updateScoreUI();
nextQuestion();
setStatus("Prêt.");

// Render loop
engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => engine.resize());