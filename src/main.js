import * as THREE from 'three';
import { GUI } from 'dat.gui';
import * as TWEEN from '@tweenjs/tween.js';

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
camera.position.z = 5;
camera.zoom = 82; // Adjust the zoom level
camera.updateProjectionMatrix(); // Update the camera's projection matrix

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var selectedPlane = null;

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
  plane.originalPosition = plane.position.clone(); // Store the original position

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

// Create a raycaster and a vector to hold the mouse position
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Add an event listener for when the mouse is clicked
window.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(event) {
  // Convert the mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray, including descendants of the scene's children
  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // If a plane was clicked, animate it moving towards the center
    if (selectedPlane) {
      selectedPlane.material.color.set(0x00ff00); // Change the color of the previously selected plane back to green
      new TWEEN.Tween(selectedPlane.position)
        .to({ x: selectedPlane.originalPosition.x, y: selectedPlane.originalPosition.y, z: selectedPlane.originalPosition.z }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
    selectedPlane = intersects[0].object;
    selectedPlane.material.color.set(0x0000ff); // Change the color of the clicked plane to blue

    // Animate the clicked plane moving towards the center
    new TWEEN.Tween(selectedPlane.position)
      .to({ x: 0, y: 0, z: 0 }, 2000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  } else {
    // If the click was outside a plane, return to orbiting state
    if (selectedPlane) {
      selectedPlane.material.color.set(0x00ff00); // Change the color of the previously selected plane back to green
      new TWEEN.Tween(selectedPlane.position)
        .to({ x: selectedPlane.originalPosition.x, y: selectedPlane.originalPosition.y, z: selectedPlane.originalPosition.z }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
    selectedPlane = null; // Reset the selected plane
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate each pivot point around its unique rotation axis
  pivots.forEach(pivot => {
    pivot.rotateOnAxis(pivot.rotationAxis, pivot.rotationSpeed);
    if (pivot.children[0] === selectedPlane) {
      pivot.children[0].material.color.set(0xff0000); // Change the color of the currently animated plane to red
    } else {
      pivot.children[0].material.color.set(0x00ff00); // Change the color of the other planes back to green
    }
    pivot.children[0].lookAt(camera.position); // Make the plane face the camera
    pivot.children[0].material.wireframe = params.wireframe; // Set the wireframe mode based on the GUI toggle
  });

  TWEEN.update(); // Add this line

  renderer.render(scene, camera);
}
animate();
