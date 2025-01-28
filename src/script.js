import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

THREE.ColorManagement.enabled = false;

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 300 });

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const parameters = {};
parameters.count = 100000;
parameters.size = 0.01;
parameters.radius = 5;
parameters.branches = 3;
parameters.spin = 1;
parameters.randomness = 0.02;
parameters.randomnessPower = 3.5;
parameters.innerColor = "#ff6030";
parameters.outerColor = "#1b3984";
parameters.animationSpeed = 0.3;
parameters.motionRadius = 0.1;

let geometry = null;
let material = null;
let points = null;
let initialPositions = null;

const generateGalaxy = () => {
  if (points !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(points);
  }

  /**
   * Geometry
   */
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  const innerColor = new THREE.Color(parameters.innerColor);
  const outerColor = new THREE.Color(parameters.outerColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    // Color
    const mixedColor = innerColor.clone();
    mixedColor.lerp(outerColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Store initial positions
  initialPositions = positions.slice();

  /**
   * Material
   */
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  /**
   * Points
   */
  points = new THREE.Points(geometry, material);
  scene.add(points);
};

generateGalaxy();

// Add GUI controls
gui
  .add(parameters, "animationSpeed", 0, 2, 0.01)
  .onFinishChange(generateGalaxy)
  .name("Animation speed");
gui
  .add(parameters, "motionRadius", 0, 0.5, 0.01)
  .onFinishChange(generateGalaxy)
  .name("Motion radius");

gui
  .add(parameters, "count")
  .min(100)
  .max(300000)
  .step(50)
  .onFinishChange(generateGalaxy)
  .name("Paticles count");
gui
  .add(parameters, "size")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .onFinishChange(generateGalaxy)
  .name("Particles size");
gui
  .add(parameters, "radius")
  .min(0.01)
  .max(20)
  .step(0.01)
  .onFinishChange(generateGalaxy)
  .name("Branch radius");
gui
  .add(parameters, "branches")
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy)
  .name("Branch count");
gui
  .add(parameters, "spin")
  .min(-5)
  .max(5)
  .step(0.001)
  .onFinishChange(generateGalaxy)
  .name("Spin angle");
gui
  .add(parameters, "randomness")
  .min(0)
  .max(2)
  .step(0.001)
  .onFinishChange(generateGalaxy)
  .name("Randomness");
gui
  .add(parameters, "randomnessPower")
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(generateGalaxy)
  .name("Randomness power");
gui.addColor(parameters, "innerColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outerColor").onFinishChange(generateGalaxy);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.x = 5;
camera.position.y = 3;
camera.position.z = 3.5;

scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (points) {
    const positions = points.geometry.attributes.position.array;

    points.rotation.y = elapsedTime * 0.02;

    // Update each particle position
    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;

      // Create random motion using sine and cosine with different frequencies
      const noise1 =
        Math.sin(elapsedTime * parameters.animationSpeed + i * 0.1) *
        parameters.motionRadius;
      const noise2 =
        Math.cos(elapsedTime * parameters.animationSpeed + i * 0.1) *
        parameters.motionRadius;
      const noise3 =
        Math.sin(elapsedTime * parameters.animationSpeed + i * 0.2) *
        parameters.motionRadius;

      // Add noise to original positions
      positions[i3] = initialPositions[i3] + noise1;
      positions[i3 + 1] = initialPositions[i3 + 1] + noise2;
      positions[i3 + 2] = initialPositions[i3 + 2] + noise3;
    }

    points.geometry.attributes.position.needsUpdate = true;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
