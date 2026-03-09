import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x88aadd, 0.0035);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 40, 130);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 15;
controls.maxDistance = 260;

const hemi = new THREE.HemisphereLight(0xcde9ff, 0x1a1d24, 0.7);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(130, 110, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const stars = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true })
);
const starCount = 2500;
const starArray = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 700 + Math.random() * 600;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starArray[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  starArray[i * 3 + 1] = r * Math.cos(phi);
  starArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
stars.geometry.setAttribute('position', new THREE.BufferAttribute(starArray, 3));
scene.add(stars);

const globe = createEarth();
scene.add(globe);

const corsicaGroup = createCorsica();
corsicaGroup.visible = false;
scene.add(corsicaGroup);

const landButton = document.querySelector('#landButton');
let isLanding = false;
let landingProgress = 0;
let mode = 'earth';

landButton.addEventListener('click', () => {
  if (isLanding || mode === 'corsica') {
    return;
  }
  isLanding = true;
  landingProgress = 0;
  landButton.disabled = true;
  landButton.textContent = 'Transition en cours...';
});

function createEarth() {
  const group = new THREE.Group();

  const earthGeo = new THREE.SphereGeometry(26, 128, 128);
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x3169b5,
    roughness: 0.9,
    metalness: 0.02,
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;

  const continentMat = new THREE.MeshStandardMaterial({ color: 0x6e9e57, roughness: 1 });
  const continents = new THREE.Group();

  const africa = new THREE.Mesh(new THREE.SphereGeometry(26.3, 40, 40, 0.95, 0.6, 1.45, 1.1), continentMat);
  africa.scale.set(1.3, 1, 1);
  africa.rotation.y = 1.9;
  africa.rotation.z = -0.22;
  continents.add(africa);

  const europe = new THREE.Mesh(new THREE.SphereGeometry(26.4, 36, 36, 1.0, 0.42, 1.03, 0.34), continentMat);
  europe.rotation.y = 2.14;
  europe.rotation.z = -0.1;
  continents.add(europe);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(27.1, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.4 })
  );

  group.add(earthMesh, continents, clouds);
  group.userData = { clouds };

  return group;
}

function createCorsica() {
  const island = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(85, 85, 2, 120),
    new THREE.MeshStandardMaterial({ color: 0x2c73b0, roughness: 0.4, metalness: 0.08 })
  );
  water.position.y = -0.6;
  water.receiveShadow = true;
  island.add(water);

  const segments = 220;
  const terrainGeo = new THREE.PlaneGeometry(95, 160, segments, segments);
  const position = terrainGeo.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);

    const islandMask = corsicaMask(x / 45, y / 75);
    if (islandMask <= 0) {
      position.setZ(i, -5);
      continue;
    }

    const ridge =
      Math.exp(-((x - 5) ** 2) / 280 - ((y + 18) ** 2) / 900) * 18 +
      Math.exp(-((x + 10) ** 2) / 360 - ((y - 10) ** 2) / 560) * 10 +
      Math.exp(-((x - 2) ** 2) / 420 - ((y - 45) ** 2) / 700) * 12;

    const noise =
      Math.sin((x + 8) * 0.24) * 0.9 +
      Math.cos((y - 4) * 0.18) * 0.7 +
      Math.sin((x + y) * 0.12) * 0.6;

    const coastFalloff = Math.max(0, islandMask) ** 1.8;
    const z = (ridge + noise + 1.7) * coastFalloff;
    position.setZ(i, z);
  }

  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({
      color: 0x7ea86b,
      roughness: 0.95,
      metalness: 0,
      flatShading: false,
    })
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  island.add(terrain);

  addCities(island);

  const fogRing = new THREE.Mesh(
    new THREE.TorusGeometry(73, 10, 40, 220),
    new THREE.MeshStandardMaterial({ color: 0xb8d1eb, transparent: true, opacity: 0.25 })
  );
  fogRing.rotation.x = Math.PI / 2;
  fogRing.position.y = 1;
  island.add(fogRing);

  return island;
}

function corsicaMask(nx, ny) {
  const warp = Math.sin(ny * 3.2) * 0.12 + Math.cos(nx * 2.4) * 0.09;
  const x = nx + warp * 0.65 + 0.08;
  const y = ny + Math.sin(nx * 2.1) * 0.08;

  const northLobe = 1.0 - ((x + 0.02) ** 2 / 0.5 + (y - 0.45) ** 2 / 0.9);
  const southLobe = 1.0 - ((x - 0.05) ** 2 / 0.48 + (y + 0.34) ** 2 / 0.8);
  const neck = 1.0 - ((x + 0.08) ** 2 / 0.22 + (y - 0.02) ** 2 / 0.35);
  // Keep Bastia on land by extending the north-east coastline (Cap Corse).
  const capCorse = (1.0 - ((x - 0.66) ** 2 / 0.05 + (y - 0.82) ** 2 / 0.14)) * 0.42;

  return Math.max(northLobe, southLobe, neck, capCorse);
}

function addCities(island) {
  const cities = [
    { name: 'Ajaccio', x: -18, z: 34, size: 1.15 },
    { name: 'Bastia', x: 22, z: -55, size: 1.1 },
    { name: 'Calvi', x: -30, z: -22, size: 0.85 },
    { name: 'Porto-Vecchio', x: 20, z: 50, size: 0.92 },
    { name: 'Corte', x: 2, z: 4, size: 0.9 },
  ];

  const buildingPalette = [0xd6d6d6, 0xbfc2c9, 0xa8acb6, 0xc1b299];

  for (const city of cities) {
    const cityGroup = new THREE.Group();
    cityGroup.position.set(city.x, 0, city.z);

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.3, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8d17a })
    );
    marker.position.y = 0.25;
    cityGroup.add(marker);

    const count = Math.floor(40 * city.size);
    for (let i = 0; i < count; i++) {
      const w = THREE.MathUtils.randFloat(0.5, 1.9) * city.size;
      const d = THREE.MathUtils.randFloat(0.5, 1.8) * city.size;
      const h = THREE.MathUtils.randFloat(1.5, 9.5) * city.size;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: buildingPalette[Math.floor(Math.random() * buildingPalette.length)],
          roughness: 0.86,
        })
      );
      const dist = THREE.MathUtils.randFloat(1.6, 8.5) * city.size;
      const ang = Math.random() * Math.PI * 2;
      b.position.set(Math.cos(ang) * dist, h / 2 + 0.2, Math.sin(ang) * dist);
      b.castShadow = true;
      b.receiveShadow = true;
      cityGroup.add(b);
    }

    island.add(cityGroup);
  }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (mode === 'earth') {
    globe.rotation.y += 0.0014;
    globe.userData.clouds.rotation.y -= 0.0018;
  }

  if (isLanding) {
    landingProgress = Math.min(1, landingProgress + 0.008);
    const eased = 1 - (1 - landingProgress) ** 3;

    globe.scale.setScalar(1 - eased);
    globe.visible = landingProgress < 1;

    corsicaGroup.visible = true;
    corsicaGroup.scale.setScalar(0.2 + eased * 0.8);

    camera.position.lerp(new THREE.Vector3(0, 45 - eased * 28, 130 - eased * 106), 0.05);
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.06);
    controls.minDistance = 10;
    controls.maxDistance = 130;

    if (landingProgress >= 1) {
      isLanding = false;
      mode = 'corsica';
      landButton.textContent = 'Vue Corse activée';
    }
  }

  if (mode === 'corsica') {
    sun.position.x = Math.sin(t * 0.08) * 130;
    sun.position.z = Math.cos(t * 0.08) * 130;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
