import * as THREE from 'three';

import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {XRControllerModelFactory} from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const NUM_CUBES = 5000;

let container;
let camera: THREE.PerspectiveCamera, scene: THREE.Scene, raycaster: THREE.Raycaster, renderer: THREE.WebGLRenderer;

let room: THREE.Object3D;

let controller: THREE.XRTargetRaySpace, controllerGrip: THREE.XRGripSpace;
let INTERSECTED: any;

let foveationEnabled = true;

// From: https://cpetry.github.io/NormalMap-Online/
const ALBEDO_RIPPLE_TEXTURE_PATH = './textures/ripple_albedo.png';
const NORMAL_RIPPLE_TEXTURE_PATH = './textures/ripple_normal.png';

const buildController = (data: XRInputSource) => {
  let geometry, material;

  switch (data.targetRayMode) {
    case 'tracked-pointer':
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([ 0, 0, 0, 0, 0, - 1 ], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([ 0.5, 0.5, 0.5, 0, 0, 0 ], 3));

      material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });
      return new THREE.Line(geometry, material);

    case 'gaze':
      geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, - 1);
      material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
      return new THREE.Mesh(geometry, material);
  }
}

const init = () => {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd0d0d0);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.6, 3);
  scene.add(camera);

  room = new THREE.Object3D();
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();

  // Load the textures
  const albedoMap = textureLoader.load(ALBEDO_RIPPLE_TEXTURE_PATH);
  const normalMap = textureLoader.load(NORMAL_RIPPLE_TEXTURE_PATH);

  const cubeVertexShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `;

  // Use an inefficient shader to test foveation
  const cubeFragmentShader = `
        precision highp float;
        uniform float time;
        uniform sampler2D albedoMap;
        uniform sampler2D normalMap;
        uniform bool foveationEnabled;
        uniform vec3 selectColor;
        uniform vec3 lightPos;
        uniform vec3 viewPos;
        varying vec2 vUv;

        void main() {
          vec2 texCoord = vUv;
          vec3 color = vec3(texCoord, 0.5 + 0.5 * sin(time));

          // Sobel filter kernel
          float kernelX[9];
          kernelX[0] = -1.0; kernelX[1] = 0.0; kernelX[2] = 1.0;
          kernelX[3] = -2.0; kernelX[4] = 0.0; kernelX[5] = 2.0;
          kernelX[6] = -1.0; kernelX[7] = 0.0; kernelX[8] = 1.0;

          float kernelY[9];
          kernelY[0] = -1.0; kernelY[1] = -2.0; kernelY[2] = -1.0;
          kernelY[3] = 0.0;  kernelY[4] = 0.0;  kernelY[5] = 0.0;
          kernelY[6] = 1.0;  kernelY[7] = 2.0;  kernelY[8] = 1.0;

          vec2 texOffset = 1.0 / vec2(textureSize(albedoMap, 0)); // gets size of single texel
          vec3 texSample[9];
          texSample[0] = texture2D(albedoMap, texCoord + texOffset * vec2(-1, -1)).rgb;
          texSample[1] = texture2D(albedoMap, texCoord + texOffset * vec2( 0, -1)).rgb;
          texSample[2] = texture2D(albedoMap, texCoord + texOffset * vec2( 1, -1)).rgb;
          texSample[3] = texture2D(albedoMap, texCoord + texOffset * vec2(-1,  0)).rgb;
          texSample[4] = texture2D(albedoMap, texCoord + texOffset * vec2( 0,  0)).rgb;
          texSample[5] = texture2D(albedoMap, texCoord + texOffset * vec2( 1,  0)).rgb;
          texSample[6] = texture2D(albedoMap, texCoord + texOffset * vec2(-1,  1)).rgb;
          texSample[7] = texture2D(albedoMap, texCoord + texOffset * vec2( 0,  1)).rgb;
          texSample[8] = texture2D(albedoMap, texCoord + texOffset * vec2( 1,  1)).rgb;

          vec3 sobelX = vec3(0.0);
          vec3 sobelY = vec3(0.0);
          for (int i = 0; i < 9; i++) {
            sobelX += texSample[i] * kernelX[i];
            sobelY += texSample[i] * kernelY[i];
          }

          vec3 sobel = sqrt(sobelX * sobelX + sobelY * sobelY);
          color += sobel;

          // Normal mapping
          vec3 normal = texture2D(normalMap, texCoord).rgb;
          normal = normalize(normal * 2.0 - 1.0);

          // Lighting calculations
          vec3 lightDir = normalize(lightPos - vec3(gl_FragCoord.xy, 0.0));
          float diff = max(dot(normal, lightDir), 0.0);
          vec3 diffuse = diff * color;

          // Specular highlight
          vec3 viewDir = normalize(viewPos - vec3(gl_FragCoord.xy, 0.0));
          vec3 reflectDir = reflect(-lightDir, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          vec3 specular = vec3(0.5) * spec;

          // Combine results
          vec3 ambientStrength = vec3(0.05, 0.05, 0.05);
          ambientStrength.r += foveationEnabled ? 0.0 : 0.05;
          ambientStrength.g += foveationEnabled ? 0.05 : 0.0;

          vec3 finalColor = ambientStrength + diffuse + specular;
          
          // Override with selectColor if applicable
          finalColor.r = (selectColor.r >= 0.0) ? selectColor.r : finalColor.r;
          finalColor.g = (selectColor.g >= 0.0) ? selectColor.g : finalColor.g;
          finalColor.b = (selectColor.b >= 0.0) ? selectColor.b : finalColor.b;

          gl_FragColor = vec4(finalColor, 0.9);
        }
      `;

  const cubeMaterialData = new THREE.ShaderMaterial({
      vertexShader: cubeVertexShader,
      fragmentShader: cubeFragmentShader,
      uniforms: {
        time: {value: 0.0},
        albedoMap: {value: albedoMap},
        normalMap: {value: normalMap},
        lightPos: {value: light.position.normalize()},
        viewPos: {value: camera.position.normalize()},
        selectColor: {value: new THREE.Vector3(-1.0, -1.0, -1.0)},
        foveationEnabled: {value: foveationEnabled},
      }
  });

  // Add some cubes to the scene
  const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const instancedCubeMesh = new THREE.InstancedMesh(geometry, cubeMaterialData, NUM_CUBES);

  const cubeInstance = new THREE.Object3D();
  for (let i = 0; i < NUM_CUBES; i++) {
    let x, y, z;

    // Avoid placing cubes in the center of the room
    const xHoleRad = 2.0;
    const yHoleRad = 2.0;
    do {
      x = Math.random() * 8 - 4;
      y = Math.random() * 8 - 4;
    } while (Math.abs(x) < xHoleRad && Math.abs(y) < yHoleRad);

    // Small variance in Z, so the cubes are all displayed in front of the user
    z = -3 + Math.random() * 1 - 0.5;

    cubeInstance.position.set(x, y, z);
    cubeInstance.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
    cubeInstance.updateMatrix();

    instancedCubeMesh.setMatrixAt(i, cubeInstance.matrix);
  }

  room.add(instancedCubeMesh);

  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Create a controller and add it to the scene
  controller = renderer.xr.getController(0);

  const onSelectStart = () => {
    controller.userData.isSelecting = true;

    foveationEnabled = !foveationEnabled;
    renderer.xr.setFoveation(foveationEnabled ? 1.0 : 0.0); // Toggle foveation level

    for (let i = 0; i < room.children.length; i ++) {
      const cubeInstacedMesh = room.children[i];
  
      if (!(cubeInstacedMesh instanceof THREE.InstancedMesh)) return;
  
      if (cubeInstacedMesh.material && cubeInstacedMesh.material.uniforms && cubeInstacedMesh.material.uniforms.foveationEnabled) {
        cubeInstacedMesh.material.uniforms.foveationEnabled.value = foveationEnabled;
      }
    }
  }

  const onSelectEnd = () => {
    controller.userData.isSelecting = false;
  }

  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  controller.addEventListener('connected', (event: { data: XRInputSource }) => {
    const controllerObject = buildController(event.data);
    if (controllerObject) {
      controller.add(controllerObject);
    }
  });
  controller.addEventListener('disconnected', () => {
    controller.remove(controller.children[0]);
  });

  scene.add(controller);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip = renderer.xr.getControllerGrip(0);
  controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
  scene.add(controllerGrip);

  window.addEventListener('resize', onWindowResize);

  document.body.appendChild(VRButton.createButton(renderer, {
    'optionalFeatures': [],
  }));

}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = (time: number, frame: XRFrame) => {
  // find intersections
  raycaster.setFromXRController(controller);

  // TODO: Fix this for instanced meshes
  const intersects = raycaster.intersectObjects(room.children, false);
  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.uniforms.selectColor.value.copy(INTERSECTED.currentColor);
      }

      INTERSECTED = intersects[0].object;
      INTERSECTED.currentColor = INTERSECTED.material.uniforms.selectColor.value.clone();
      INTERSECTED.material.uniforms.selectColor.value.set(1.0, 0.1, 0.1);
    }
  } else {
    if (INTERSECTED) {
      INTERSECTED.material.uniforms.selectColor.value.copy(INTERSECTED.currentColor);
    }
    INTERSECTED = undefined;
  }

  for (let i = 0; i < room.children.length; i ++) {
    const cubeInstacedMesh = room.children[i];

    if (!(cubeInstacedMesh instanceof THREE.InstancedMesh)) return;

    if (cubeInstacedMesh.material && cubeInstacedMesh.material.uniforms && cubeInstacedMesh.material.uniforms.time) {
      cubeInstacedMesh.material.uniforms.time.value = time / 1000;
    }

    // Rotate cubes
    const cubeInstance = new THREE.Object3D();
    for (let j = 0; j < NUM_CUBES; j++) {
      cubeInstacedMesh.getMatrixAt(j, cubeInstance.matrix);
      cubeInstance.matrix.decompose(cubeInstance.position, cubeInstance.quaternion, cubeInstance.scale);

      cubeInstance.rotation.x += 0.01;
      cubeInstance.rotation.y += 0.01;
      cubeInstance.updateMatrix();

      cubeInstacedMesh.setMatrixAt(j, cubeInstance.matrix);
    }

    cubeInstacedMesh.instanceMatrix.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

init();
