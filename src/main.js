import * as THREE from 'three';
import { GUI } from 'dat.gui';

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
camera.position.z = 5;
camera.zoom = 82; // Adjust the zoom level
camera.updateProjectionMatrix(); // Update the camera's projection matrix

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Variable to control the upper end of the speed
var speedScale = 0.01;

// Variable to control the scale of the planes
var planeScale = 0.1;

// Variables to control the minimum and maximum scale multipliers for the planes
var minScaleMultiplier = 0.5;
var maxScaleMultiplier = 1.5;

// Create 6 planes with unique pivot points
var pivots = [];
for (let i = 0; i < 6; i++) {
  // Random scale for each plane, within the range defined by minScaleMultiplier and maxScaleMultiplier
  var randomScale = minScaleMultiplier + Math.random() * (maxScaleMultiplier - minScaleMultiplier);

  var geometry = new THREE.PlaneGeometry(16 * planeScale * randomScale, 9 * planeScale * randomScale); // Use planeScale and randomScale to set the size of the planes
  var material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide}); // Use MeshBasicMaterial which doesn't require lighting
  var plane = new THREE.Mesh(geometry, material);
  plane.position.x = (Math.random() - 0.5) * 5;
  plane.position.y = (Math.random() - 0.5) * 5;
  plane.position.z = (Math.random() - 0.5) * 5;

  var pivot = new THREE.Object3D();
  pivot.rotationSpeed = Math.random() * speedScale; // Random speed for each pivot, scaled by speedScale
  pivot.rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(); // Random rotation axis for each pivot
  pivot.add(plane);
  pivots.push(pivot);
  scene.add(pivot);
}

// Create a GUI and add a wireframe toggle
var gui = new GUI();
var params = { wireframe: false };
gui.add(params, 'wireframe');

function animate() {
  requestAnimationFrame(animate);

  // Rotate each pivot point around its unique rotation axis
  pivots.forEach(pivot => {
    pivot.rotateOnAxis(pivot.rotationAxis, pivot.rotationSpeed);
    pivot.children[0].lookAt(camera.position); // Make the plane face the camera
    pivot.children[0].material.wireframe = params.wireframe; // Set the wireframe mode based on the GUI toggle
  });

  renderer.render(scene, camera);
}
animate();