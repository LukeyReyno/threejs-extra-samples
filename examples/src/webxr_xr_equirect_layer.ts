import * as THREE from 'three';

import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {XRControllerModelFactory} from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const clock = new THREE.Clock();

const NUM_CUBES = 20;
const ROOM_SIZE = 1;
const SKYBOX_PATH = './textures/mono_equirect_test.png';

let container;
let camera: THREE.PerspectiveCamera, scene: THREE.Scene, raycaster: THREE.Raycaster, renderer: THREE.WebGLRenderer;

let room: THREE.Object3D;

let skyBoxTexture: THREE.Texture;
let skyBox: THREE.Mesh | null;
let equirectLayer: XREquirectLayer | null;

let controller: THREE.XRTargetRaySpace, controllerGrip: THREE.XRGripSpace;
let INTERSECTED: any;

let firstFrameOfXrSessionStart = false;

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

const setUpSkyboxGeometry = async () => {
  const textureLoader = new THREE.TextureLoader();
  skyBoxTexture = await textureLoader.loadAsync(SKYBOX_PATH);
  const geometry = new THREE.SphereGeometry(1000);

  const material = new THREE.MeshBasicMaterial({map: skyBoxTexture, side: THREE.BackSide}); 

  skyBox = new THREE.Mesh(geometry, material);
  scene.add(skyBox);
}

const tearDownSkyboxGeometry = () => {
  if (skyBox) {
    scene.remove(skyBox);
    skyBox.geometry.dispose();
    if (Array.isArray(skyBox.material)) {
      skyBox.material.forEach(material => material.dispose());
    } else {
      skyBox.material.dispose();
    }
    skyBox = null;
  }
}

const trySetUpEquirectLayerSkybox = async () => {
  const xrSession = renderer.xr.getSession();

  if (!xrSession || !xrSession.renderState.layers) {
    // Keep the original geometric skybox
    return;
  } else {
    // Tear down the geometric skybox
    tearDownSkyboxGeometry();

    if (!skyBoxTexture) {
      const textureLoader = new THREE.TextureLoader();
      skyBoxTexture = await textureLoader.loadAsync(SKYBOX_PATH);
    }

    xrSession.requestReferenceSpace('local-floor').then((refSpace) => {
      // Load a texture for the WebXR equirect layer
      equirectLayer = renderer.xr.getBinding()
        .createEquirectLayer({
            space: refSpace,
            viewPixelWidth: skyBoxTexture.image.width,
            viewPixelHeight: skyBoxTexture.image.height,
            textureType: 'texture',
            layout: 'mono',
        });

      const currentLayers = xrSession.renderState.layers || [];
      const newLayers = [equirectLayer, ...currentLayers];
      console.log('New layers:', newLayers);
      xrSession?.updateRenderState({
        layers: newLayers,
      });
    });
  }
}

const onXrSessionStart = () => {
  firstFrameOfXrSessionStart = true;
}

const init = () => {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x006090);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.6, 3);
  scene.add(camera);

  room = new THREE.Object3D();
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

  for (let i = 0; i < NUM_CUBES; i ++) {
    const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

    object.position.x = Math.random() * 4 - 2;
    object.position.y = Math.random() * 4;
    object.position.z = Math.random() * 4 - 2;

    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;

    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;

    object.userData.velocity = new THREE.Vector3();
    object.userData.velocity.x = Math.random() * 0.01 - 0.005;
    object.userData.velocity.y = Math.random() * 0.01 - 0.005;
    object.userData.velocity.z = Math.random() * 0.01 - 0.005;

    room.add(object);
  }

  setUpSkyboxGeometry();

  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.autoClearColor = false;
  renderer.xr.enabled = true;
  renderer.xr.addEventListener('sessionstart', onXrSessionStart);
  container.appendChild(renderer.domElement);

  // Create a controller and add it to the scene
  controller = renderer.xr.getController(0);

  const onSelectStart = () => {
    controller.userData.isSelecting = true;
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
  const delta = clock.getDelta() * 60;

  if (firstFrameOfXrSessionStart) {
    trySetUpEquirectLayerSkybox();
    firstFrameOfXrSessionStart = false;
  }

  if (equirectLayer && equirectLayer.needsRedraw) {
    let glayer = renderer.xr.getBinding().getSubImage(equirectLayer, frame);
    let gl = renderer.getContext();

    gl.bindTexture(gl.TEXTURE_2D, glayer.colorTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, skyBoxTexture!.image);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  // find intersections
  raycaster.setFromXRController(controller);

  const intersects = raycaster.intersectObjects(room.children, false);
  if (intersects.length > 0) {
    if (INTERSECTED != intersects[ 0 ].object) {
      if (INTERSECTED) {
        INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      }
  
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex(0xff0000);
    }
  } else {
    if (INTERSECTED) {
      INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    }
    INTERSECTED = undefined;
  }

  // Keep cubes inside room
  for (let i = 0; i < room.children.length; i ++) {
    const cube = room.children[ i ];

    cube.userData.velocity.multiplyScalar(1 - (0.001 * delta));

    cube.position.add(cube.userData.velocity);

    const halfRoom = ROOM_SIZE / 2;
    if (cube.position.x < -halfRoom || cube.position.x > halfRoom) {
      cube.position.x = THREE.MathUtils.clamp(cube.position.x, -halfRoom, halfRoom);
      cube.userData.velocity.x = - cube.userData.velocity.x;
    }

    if (cube.position.y < 0 || cube.position.y > ROOM_SIZE) {
      cube.position.y = THREE.MathUtils.clamp(cube.position.y, 0, ROOM_SIZE);
      cube.userData.velocity.y = - cube.userData.velocity.y;
    }

    if (cube.position.z < -halfRoom || cube.position.z > halfRoom) {
      cube.position.z = THREE.MathUtils.clamp(cube.position.z, -halfRoom, halfRoom);
      cube.userData.velocity.z = - cube.userData.velocity.z;
    }

    cube.rotation.x += cube.userData.velocity.x * 2 * delta;
    cube.rotation.y += cube.userData.velocity.y * 2 * delta;
    cube.rotation.z += cube.userData.velocity.z * 2 * delta;
  }
  renderer.render(scene, camera);
}

init();
