import * as THREE from 'three';
import { GUI } from 'dat.gui';
import * as TWEEN from '@tweenjs/tween.js';

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
camera.position.z = 5;
camera.zoom = 120; // Adjust the zoom level
camera.updateProjectionMatrix(); // Update the camera's projection matrix

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
// renderer.context.enable(renderer.context.DEPTH_TEST);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var selectedPlane = null;
var hoveredPlane = null; // Variable to keep track of the plane being hovered over

// Variable to control the upper end of the speed
var speedScale = 0.007;

// Variable to control the lower end of the speed
var minSpeedScale = 0.005; // Adjust this value as needed

// Variable to control the scale of the planes
var planeScale = 1;

// Variables to control the minimum and maximum scale multipliers for the planes
var minScaleMultiplier = 0.5;
var maxScaleMultiplier = 1.5;

// Variable for the extremes
var planeDistance = 3;

// Create a new material that is green and wireframe
var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});

// Create 6 planes with unique pivot points
var pivots = [];
var planes = []; // Array to hold the planes

// Define the video data
var videosData = [
  {mp4: './public/videos/loops/loop_alle_landscape.mp4', webm: './public/videos/loops/loop_alle_landscape.webm'},
  {mp4: './public/videos/loops/loop_awui_landscape.mp4', webm: './public/videos/loops/loop_awui_landscape.webm'},
  {mp4: './public/videos/loops/loop_boy_portrait.mp4', webm: './public/videos/loops/loop_boy_portrait.webm'},
  // Add more videos here
];

for (let i = 0; i < 3; i++) {
  // Random scale for each plane, within the range defined by minScaleMultiplier and maxScaleMultiplier
  var randomScale = minScaleMultiplier + Math.random() * (maxScaleMultiplier - minScaleMultiplier);

  var videoData = videosData[i % videosData.length]; // Get the video data for this plane
  var video = document.createElement('video');
  video.src = videoData.mp4;
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.play();

  var texture = new THREE.VideoTexture(video);
  var material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: true });

  var aspectRatio = videoData.mp4.includes('_portrait') ? 9 / 16 : 16 / 9;
  var geometry = new THREE.PlaneGeometry(planeScale * aspectRatio, planeScale);

  var plane = new THREE.Mesh(geometry, material);
  plane.position.x = (Math.random() - 0.5) * planeDistance;
  plane.position.y = (Math.random() - 0.5) * planeDistance;
  plane.position.z = (Math.random() - 0.5) * planeDistance;
  plane.originalPosition = plane.position.clone(); // Store the original position
  plane.clickCount = 0; // Add this line
  plane.videoSrc = videoData.mp4; // Store the original video source
  plane.videoElement = video; // Store a reference to the video element

  var pivot = new THREE.Object3D();
  pivot.rotationSpeed = minSpeedScale + Math.random() * (speedScale - minSpeedScale); // Random speed for each pivot, scaled by speedScale
  pivot.rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(); // Random rotation axis for each pivot
  pivot.add(plane);
  pivots.push(pivot);
  planes.push(plane); // Add the plane to the planes array
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

// Add an event listener for when the mouse moves
window.addEventListener('mousemove', onMouseMove, false);

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
      new TWEEN.Tween(selectedPlane.position)
        .to({ x: selectedPlane.originalPosition.x, y: selectedPlane.originalPosition.y, z: selectedPlane.originalPosition.z }, 1000)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    }
    selectedPlane = intersects[0].object;
    selectedPlane.clickCount += 1; // Increase the click count
    // Debug: print the click count of the selected plane
    console.log('Click count for selected plane:', selectedPlane.clickCount);

    if (selectedPlane.clickCount === 1) {
      if (selectedPlane.videoSrc.includes('loop_awui_landscape')) {
        // If the plane has been clicked once, load the video and pause it
        var video = selectedPlane.videoElement;
        video.src = './public/videos/full/awuwi_full.mp4';
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.pause(); // Pause the video immediately after it's created

        var texture = new THREE.VideoTexture(video);
        selectedPlane.material.map = texture;
        selectedPlane.material.needsUpdate = true;
      }
      if (selectedPlane.videoSrc.includes('loop_boy')) {
        // If the plane has been clicked once, load the video and pause it
        var video = selectedPlane.videoElement;
        video.src = './public/videos/full/boy_full.mp4';
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.pause(); // Pause the video immediately after it's created

        var texture = new THREE.VideoTexture(video);
        selectedPlane.material.map = texture;
        selectedPlane.material.needsUpdate = true;
      }
    } else if (selectedPlane.clickCount === 2) {
      // If the plane has been clicked twice, play the video
      selectedPlane.videoElement.muted = false;
      selectedPlane.material.map.image.play();
    } else {
      // If the plane has been clicked more than twice, toggle pause/play
      if (selectedPlane.material.map.image.paused) {
        selectedPlane.material.map.image.play();
      } else {
        selectedPlane.material.map.image.pause();
      }
    }

    selectedPlane.material.depthTest = false;
    selectedPlane.material.needsUpdate = true;  // This line is needed to apply the changes to the material
    selectedPlane.renderOrder = 1; // Add this line

    // Set the renderOrder of all non-selected planes to 0
    planes.forEach(plane => {
      if (plane !== selectedPlane) {
        plane.renderOrder = 0;
      }
    });

    // Animate the clicked plane moving towards the center
    new TWEEN.Tween(selectedPlane.position)
      .to({ x: 0, y: 0, z: 0 }, 1000)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    // Animate the clicked plane scaling up
    new TWEEN.Tween(selectedPlane.scale)
      .to({ x: 3, y: 3, z: 3 }, 1000)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  } else {
    // If the click was outside a plane, return to orbiting state
    if (selectedPlane) {
      selectedPlane.material.depthTest = true;
      selectedPlane.material.needsUpdate = true;  // This line is needed to apply the changes to the material
      selectedPlane.renderOrder = 0; // Add this line
      new TWEEN.Tween(selectedPlane.position)
        .to({ x: selectedPlane.originalPosition.x, y: selectedPlane.originalPosition.y, z: selectedPlane.originalPosition.z }, 1000)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      // Animate the previously selected plane scaling down
      new TWEEN.Tween(selectedPlane.scale)
        .to({ x: 1, y: 1, z: 1 }, 1000)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      // Switch the video back to the loop if the plane leaves the selected state
      if (selectedPlane.clickCount >= 2) {
        var video = selectedPlane.videoElement;
        video.src = selectedPlane.videoSrc;
        video.muted = true; // Mute the video immediately
        video.crossOrigin = 'anonymous';
        video.loop = true; // Ensure the video loops

        video.oncanplay = function() {
          video.play(); // Play the video when it's ready
        };

        var texture = new THREE.VideoTexture(video);
        selectedPlane.material.map = texture;
        selectedPlane.material.needsUpdate = true;
      }

      // Switch the video back to the loop if the plane leaves the selected state
      if (selectedPlane.clickCount >= 2 && selectedPlane.videoSrc.includes('loop_awui_landscape')) {
        var video = selectedPlane.videoElement;
        video.src = './public/videos/loops/loop_awui_landscape.mp4';
        video.muted = true; // Mute the video immediately
        video.crossOrigin = 'anonymous';
        video.loop = true; // Ensure the video loops

        video.oncanplay = function() {
          video.play(); // Play the video when it's ready
        };

        var texture = new THREE.VideoTexture(video);
        selectedPlane.material.map = texture;
        selectedPlane.material.needsUpdate = true;
      }

      // Pause and mute the video if the plane leaves the selected state
      if (selectedPlane.clickCount >= 2) {
        selectedPlane.videoElement.pause();
        selectedPlane.videoElement.muted = true;
      }

      selectedPlane.clickCount = 0; // Reset the click count
      selectedPlane = null; // Reset the selected plane
    }
  }
}

function onMouseMove(event) {
  // Convert the mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray, including descendants of the scene's children
  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // If a plane was hovered over, change its material to the wireframe material
    if (hoveredPlane) {
      // hoveredPlane.material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide}); // Reset the material of the previously hovered plane
    }
    hoveredPlane = intersects[0].object;
    // hoveredPlane.material = wireframeMaterial; // Set the material of the hovered plane to the wireframe material
    // console.log('Plane hovered over:', hoveredPlane); // Log the hovered plane
  } else {
    // If the mouse moved off a plane, change its material back
    if (hoveredPlane) {
      // hoveredPlane.material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide}); // Reset the material to the original material
    }
    hoveredPlane = null;
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate each pivot point around its unique rotation axis
  pivots.forEach(pivot => {
    pivot.rotateOnAxis(pivot.rotationAxis, pivot.rotationSpeed);
    if (pivot.children[0] === selectedPlane) {
      // pivot.children[0].material.color.set(0xff0000); // Change the color of the currently animated plane to red
    } else if (pivot.children[0] !== hoveredPlane) {
      // pivot.children[0].material.color.set(0x00ff00); // Change the color of the other planes back to green, unless it's the hovered plane
    }
    pivot.children[0].lookAt(camera.position); // Make the plane face the camera
    if (pivot.children[0] !== hoveredPlane) {
      pivot.children[0].material.wireframe = params.wireframe; // Set the wireframe mode based on the GUI toggle, unless it's the hovered plane
    }
  });

  TWEEN.update(); // Add this line

  renderer.render(scene, camera);
}
animate();
