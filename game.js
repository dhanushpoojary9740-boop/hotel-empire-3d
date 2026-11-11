import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const Game = {
    coins: 0,
    gems: 50,
    level: 1,
    rooms: 10,
    staff: 2,
    hotelName: 'Grand Palace Hotel',

    scene: null,
    camera: null,
    renderer: null,
    hotel: null,
    exterior: null,
    interior: null,
    interiorMode: false,

    rotation: 0.55,
    cameraDistance: 52,
    exteriorPitch: 0.30,

    interiorRotation: 0,
    interiorDistance: 14.5,
    interiorPitch: 0.04,

    activePointers: new Map(),
    pinchDistance: 0,

    init() {
        this.loadGame();
        this.createWorld();
        this.createHotel();
        this.createInterior();
        this.createGarden();
        this.createPool();
        this.setupLighting();
        this.setupControls();
        this.createViewButton();
        this.updateCamera();
        this.updateUI();
        this.animate();

        const loading = document.getElementById('loading-screen');

        if (loading) {
            setTimeout(() => {
                loading.style.opacity = '0';
                setTimeout(() => loading.style.display = 'none', 500);
            }, 700);
        }
    },

    material(color, options = {}) {
        return new THREE.MeshStandardMaterial({
            color,
            roughness: options.roughness ?? 0.7,
            metalness: options.metalness ?? 0
        });
    },

    box(parent, x, y, z, w, h, d, color, options = {}) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            this.material(color, options)
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    },

    cylinder(parent, x, y, z, radius, height, color) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height, 24),
            this.material(color)
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    },

    sphere(parent, x, y, z, radius, color) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 20, 16),
            this.material(color)
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
    },

    // WORLD

    createWorld() {
        const container = document.getElementById('game-canvas');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x9eb9c8);
        this.scene.fog = new THREE.Fog(0x9eb9c8, 65, 150);

        this.camera = new THREE.PerspectiveCamera(
            42,
            container.clientWidth / container.clientHeight,
            0.1,
            250
        );

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        container.appendChild(this.renderer.domElement);

        this.exterior = new THREE.Group();
        this.scene.add(this.exterior);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(180, 180),
            this.material(0x607c55)
        );

        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.2;
        ground.receiveShadow = true;
        this.exterior.add(ground);

        this.box(
            this.exterior, 0, 0.05, 0,
            30, 0.5, 26, 0x898985
        );

        this.box(
            this.exterior, 0, 0.32, 11,
            23, 0.08, 3, 0x565c60
        );
    },

    // WINDOWS

    addFrontWindow(parent, x, y, z, width = 1.15) {
        this.box(parent, x, y, z, width, 1.25, 0.14, 0x98774d);

        this.box(
            parent, x, y, z + 0.09,
            width - 0.12, 1.13, 0.045,
            0x28536a,
            { metalness: 0.45, roughness: 0.2 }
        );

        this.box(
            parent, x, y, z + 0.13,
            0.045, 1.1, 0.035, 0xc5a267
        );

        this.box(
            parent, x, y, z + 0.13,
            width - 0.12, 0.045, 0.035, 0xc5a267
        );
    },

    addSideWindow(parent, x, y, z, side) {
        this.box(parent, x, y, z, 0.14, 1.25, 1.25, 0x98774d);

        this.box(
            parent, x + side * 0.09, y, z,
            0.045, 1.13, 1.13, 0x28536a
        );
    },

    addBalcony(parent, x, y, z) {
        this.box(
            parent, x, y - 0.55, z + 0.65,
            1.85, 0.16, 1.4, 0xc8b99e
        );

        this.box(
            parent, x, y - 0.15, z + 1.3,
            1.7, 0.7, 0.07, 0x8ebac6
        );

        this.box(
            parent, x, y + 0.22, z + 1.3,
            1.85, 0.09, 0.12, 0xc6a05e
        );
    },

    // EXTERIOR HOTEL

    createHotel() {
        this.hotel = new THREE.Group();
        this.exterior.add(this.hotel);

        const floors = 10;
        const floorHeight = 2.25;
        const height = floors * floorHeight;

        this.box(
            this.hotel, 0, height / 2 + 0.3, 0,
            13, height, 8, 0xe8dcc4
        );

        for (const side of [-1, 1]) {
            this.box(
                this.hotel, side * 8.2, 6.9, -0.2,
                4, 13.2, 7.5, 0xd9c9aa
            );

            for (let floor = 0; floor < 6; floor++) {
                for (let column = 0; column < 2; column++) {
                    this.addFrontWindow(
                        this.hotel,
                        side * 8.2 + (column - 0.5) * 1.7,
                        1.5 + floor * 2.15,
                        3.6,
                        0.95
                    );
                }
            }
        }

        for (let floor = 1; floor < floors; floor++) {
            this.box(
                this.hotel, 0, floor * floorHeight + 0.3, 0,
                13.15, 0.12, 8.15, 0xb38c56
            );
        }

        for (let floor = 0; floor < floors; floor++) {
            const y = 1.45 + floor * floorHeight;

            for (let column = 0; column < 6; column++) {
                const x = -5.1 + column * 2.04;

                this.addFrontWindow(this.hotel, x, y, 4.05, 1.2);
                this.addFrontWindow(this.hotel, x, y, -4.05, 1.2);

                if ([2, 5, 8].includes(floor)) {
                    this.addBalcony(this.hotel, x, y, 4.05);
                }
            }
        }

        for (let floor = 0; floor < floors; floor++) {
            const y = 1.45 + floor * floorHeight;

            for (let column = 0; column < 3; column++) {
                const z = -2.5 + column * 2.5;

                this.addSideWindow(this.hotel, 6.55, y, z, 1);
                this.addSideWindow(this.hotel, -6.55, y, z, -1);
            }
        }

        this.box(
            this.hotel, 0, height + 0.55, 0,
            13.7, 0.55, 8.7, 0x574638
        );

        this.box(
            this.hotel, 0, height + 0.86, 0,
            13.4, 0.1, 8.4, 0xc29a61
        );

        this.box(
            this.hotel, 0, 2.1, 4.35,
            5.5, 3.8, 0.6, 0x61452f
        );

        this.box(
            this.hotel, 0, 1.8, 4.7,
            3.8, 3.2, 0.12, 0x76afbd
        );

        for (const x of [-2.8, 2.8]) {
            this.box(
                this.hotel, x, 2.2, 4.65,
                0.3, 4.3, 0.35, 0xc7a05d
            );
        }

        this.box(
            this.hotel, 0, 4.35, 5.15,
            7.2, 0.35, 2.3, 0x9b7040
        );

        this.box(
            this.hotel, 0, 4.55, 5.15,
            7.3, 0.1, 2.4, 0xd2ad6c
        );

        for (let i = 0; i < 3; i++) {
            this.box(
                this.hotel, 0, 0.35 + i * 0.12,
                5.6 + i * 0.7,
                7 + i * 0.5, 0.25, 0.8, 0xd0c5b2
            );
        }

        for (const x of [-5.5, 5.5]) {
            this.cylinder(
                this.hotel, x, 2.5, 4.7,
                0.25, 4.5, 0xe0d4bd
            );
        }
    },

    // LUXURY INTERIOR HELPERS

    addPillar(parent, x, z, height = 9) {
        this.cylinder(
            parent, x, height / 2, z,
            0.35, height, 0xe7d9c2
        );

        this.cylinder(
            parent, x, 0.18, z,
            0.58, 0.36, 0xc7a15e
        );

        this.cylinder(
            parent, x, height - 0.12, z,
            0.55, 0.25, 0xc7a15e
        );

        this.cylinder(
            parent, x, 0.42, z,
            0.43, 0.12, 0xe8d7b6
        );
    },

    addChandelier(parent, x, y, z, scale = 1) {
        this.cylinder(
            parent, x, y + 0.5 * scale, z,
            0.045, scale, 0xc5a15e
        );

        this.sphere(
            parent, x, y, z,
            0.28 * scale, 0xffe4a8
        );

        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const px = x + Math.cos(angle) * 0.65 * scale;
            const pz = z + Math.sin(angle) * 0.65 * scale;

            this.box(
                parent, px, y - 0.2 * scale, pz,
                0.12 * scale, 0.65 * scale, 0.12 * scale,
                0xd9c08a
            );

            this.sphere(
                parent, px, y - 0.55 * scale, pz,
                0.12 * scale, 0xffe3a0
            );
        }

        const light = new THREE.PointLight(
            0xffd69a, 30 * scale, 13 * scale
        );

        light.position.set(x, y, z);
        parent.add(light);
    },

    addPlant(parent, x, z, scale = 1) {
        this.cylinder(
            parent, x, 0.5 * scale, z,
            0.48 * scale, scale, 0x75503a
        );

        this.sphere(
            parent, x, 1.35 * scale, z,
            0.72 * scale, 0x397448
        );

        this.sphere(
            parent, x - 0.38 * scale, 1.8 * scale, z,
            0.48 * scale, 0x478653
        );

        this.sphere(
            parent, x + 0.38 * scale, 1.8 * scale, z,
            0.48 * scale, 0x326b41
        );
    },

    addSofa(parent, x, z, width = 3.5) {
        this.box(
            parent, x, 0.65, z,
            width, 0.55, 1.4, 0x98745e
        );

        this.box(
            parent, x, 1.25, z - 0.55,
            width, 1.1, 0.3, 0xb18c72
        );

        for (const side of [-1, 1]) {
            this.box(
                parent, x + side * (width / 2 - 0.15),
                1, z,
                0.3, 0.85, 1.4, 0x765743
            );
        }

        const cushions = Math.max(2, Math.floor(width / 1.2));

        for (let i = 0; i < cushions; i++) {
            const offset = (i - (cushions - 1) / 2) * 0.95;

            this.box(
                parent, x + offset, 1.02, z,
                0.78, 0.18, 0.9, 0xd4b99c
            );
        }
    },

    // GRAND LUXURY LOBBY

    createInterior() {
        this.interior = new THREE.Group();
        this.scene.add(this.interior);

        const lobby = new THREE.Group();
        this.interior.add(lobby);

        // Large marble floor

        this.box(
            lobby, 0, 0, 0,
            26, 0.3, 26, 0xded5c6,
            { roughness: 0.2, metalness: 0.12 }
        );

        // Marble tile grid

        for (let x = -12; x <= 12; x += 2) {
            this.box(
                lobby, x, 0.16, 0,
                0.025, 0.018, 25,
                0xb7a68a
            );
        }

        for (let z = -12; z <= 12; z += 2) {
            this.box(
                lobby, 0, 0.16, z,
                25, 0.018, 0.025,
                0xb7a68a
            );
        }

        // Gold marble floor decorations

        for (const z of [-11.5, 11.5]) {
            this.box(
                lobby, 0, 0.18, z,
                25, 0.045, 0.12, 0xc5a15e
            );
        }

        for (const x of [-11.5, 11.5]) {
            this.box(
                lobby, x, 0.18, 0,
                0.12, 0.045, 23, 0xc5a15e
            );
        }

        // Rear wall

        this.box(
            lobby, 0, 5, -12.8,
            26, 10, 0.4, 0x302a28
        );

        // Side walls

        this.box(
            lobby, -13, 5, 0,
            0.4, 10, 26, 0x39312d
        );

        this.box(
            lobby, 13, 5, 0,
            0.4, 10, 26, 0x39312d
        );

        // Decorative rear wall panels

        for (let x = -11; x <= 11; x += 3.5) {
            this.box(
                lobby, x, 5, -12.55,
                2.4, 8.7, 0.08, 0x654b38
            );

            this.box(
                lobby, x, 5, -12.45,
                0.06, 8.4, 0.05, 0xd0ad6b
            );
        }

        // Ceiling beams (open roof for better camera view)

        this.box(
            lobby, 0, 9.2, -5,
            25, 0.3, 0.3, 0x59422f
        );

        this.box(
            lobby, 0, 9.2, 5,
            25, 0.3, 0.3, 0x59422f
        );

        for (const x of [-11, -6, 0, 6, 11]) {
            this.box(
                lobby, x, 9.15, 0,
                0.25, 0.25, 23, 0xc19b5f
            );
        }

        // Grand entrance columns

        for (const x of [-10, -5, 5, 10]) {
            this.addPillar(lobby, x, 8.5, 8.7);
        }

        // Reception desk

        for (const x of [-7, 0, 7]) {
            this.box(
                lobby, x, 1.15, -9.5,
                4.4, 1.8, 1.25, 0x50372c
            );

            this.box(
                lobby, x, 2.12, -9.5,
                4.55, 0.16, 1.45, 0xd0a762,
                { metalness: 0.5 }
            );

            this.box(
                lobby, x, 1.15, -8.83,
                4.1, 1.3, 0.08, 0x98734d
            );

            this.box(
                lobby, x, 1.15, -8.76,
                0.06, 1.3, 0.04, 0xe3bd75
            );

            // Computer monitors

            this.box(
                lobby, x, 2.38, -9.5,
                0.85, 0.5, 0.12, 0x182b32
            );

            this.box(
                lobby, x, 2.12, -9.5,
                1.1, 0.06, 0.45, 0x202b30
            );
        }

        // Reception wall feature

        this.box(
            lobby, 0, 6.7, -12.5,
            7, 2.5, 0.15, 0xc4a06b
        );

        this.box(
            lobby, 0, 6.7, -12.35,
            6.5, 2.05, 0.08, 0x49382d
        );

        // Grand staircase on the left

        for (let i = 0; i < 12; i++) {
            const y = 0.25 + i * 0.36;
            const z = -1 + i * 0.62;

            this.box(
                lobby, -8.5, y, z,
                4.4, 0.35, 0.9, 0xb8a48a
            );
        }

        // Upper staircase landing

        this.box(
            lobby, -8.5, 4.7, 7,
            5.5, 0.3, 5, 0xc4b49c
        );

        // Staircase golden railings

        for (let i = 0; i < 2; i++) {
            const z = -1 + i * 0.65;

            for (let step = 0; step < 12; step++) {
                const y = 0.7 + step * 0.36;
                const positionZ = -1 + step * 0.62 + z;

                this.cylinder(
                    lobby, -6.1, y, positionZ,
                    0.055, 0.65, 0xc7a15e
                );
            }
        }

        this.box(
            lobby, -6.1, 3, 3.1,
            0.12, 0.12, 8.5, 0xd0ad6b
        );

        // Right side luxury lounge

        this.addSofa(lobby, 8.5, -1.5, 5);
        this.addSofa(lobby, 8.5, 5, 5);

        // Left side lounge

        this.addSofa(lobby, -2, 5.5, 4);

        // Coffee tables

        for (const x of [-2, 8.5]) {
            this.box(
                lobby, x, 0.75, 2,
                2.5, 0.14, 1.5, 0xa57b4d
            );

            this.box(
                lobby, x, 0.84, 2,
                2.4, 0.04, 1.4, 0xd2b88b
            );
        }

        // Elevator lobby

        for (const x of [-3, 3]) {
            this.box(
                lobby, x, 3, -12.5,
                3.5, 5.8, 0.12, 0x99734c
            );

            this.box(
                lobby, x, 3, -12.38,
                3.1, 5.4, 0.08, 0x83aeb9,
                { metalness: 0.65, roughness: 0.2 }
            );

            this.box(
                lobby, x, 5.95, -12.25,
                0.6, 0.1, 0.05, 0xc9a25e
            );
        }

        // Indoor garden

        this.addPlant(lobby, -11, 2, 1.3);
        this.addPlant(lobby, 11, 2, 1.3);
        this.addPlant(lobby, -11, -5, 1);
        this.addPlant(lobby, 11, -5, 1);

        // Large decorative indoor fountain

        this.cylinder(
            lobby, 0, 0.3, 5.5,
            2.4, 0.55, 0xc5a15e
        );

        this.cylinder(
            lobby, 0, 0.58, 5.5,
            2.15, 0.12, 0x53b5c5
        );

        this.cylinder(
            lobby, 0, 0.85, 5.5,
            0.3, 0.55, 0xc6a15e
        );

        this.sphere(
            lobby, 0, 1.25, 5.5,
            0.35, 0x6cc5d0
        );

        // Crystal chandeliers

        this.addChandelier(lobby, -7, 8, 1, 1.2);
        this.addChandelier(lobby, 0, 8, 1, 1.4);
        this.addChandelier(lobby, 7, 8, 1, 1.2);

        // Warm interior lights

        for (const x of [-9, -4, 4, 9]) {
            const light = new THREE.PointLight(
                0xffd19a, 20, 14
            );

            light.position.set(x, 7, 0);
            lobby.add(light);
        }

        // Restaurant entrance on the right

        this.box(
            lobby, 10.8, 2.5, -8,
            3.5, 5, 0.15, 0x65452e
        );

        this.box(
            lobby, 10.8, 2.5, -7.85,
            3.1, 4.6, 0.08, 0x8fb6bd,
            { metalness: 0.5 }
        );

        // Restaurant signboard

        this.box(
            lobby, 10.8, 5.6, -7.8,
            4, 0.7, 0.25, 0xc49b5d
        );

        // Entrance decorative rugs

        this.box(
            lobby, 0, 0.22, 9,
            8, 0.08, 3, 0x8d6b50
        );

        this.box(
            lobby, 0, 0.27, 9,
            7.7, 0.025, 2.7, 0xb39a7d
        );

        // Extra ambient light

        const mainLight = new THREE.PointLight(
            0xffd9a6, 65, 38
        );

        mainLight.position.set(0, 8, 1);
        lobby.add(mainLight);

        this.interior.visible = false;
    },

    // GARDEN

    createGarden() {
        const positions = [
            [-12, 7], [12, 7],
            [-12, -7], [12, -7],
            [-10, 12], [10, 12]
        ];

        positions.forEach(([x, z]) => {
            this.cylinder(
                this.exterior, x, 1, z,
                0.2, 2, 0x68452d
            );

            const tree = new THREE.Mesh(
                new THREE.SphereGeometry(1.4, 16, 12),
                this.material(0x397445)
            );

            tree.position.set(x, 2.8, z);
            tree.scale.y = 1.3;
            tree.castShadow = true;
            this.exterior.add(tree);
        });
    },

    // POOL

    createPool() {
        this.box(
            this.exterior, -10, 0.35, -7,
            6, 0.3, 5, 0xe1d5bd
        );

        this.box(
            this.exterior, -10, 0.53, -7,
            5.6, 0.08, 4.6, 0x26a9c5
        );
    },

    // LIGHTING

    setupLighting() {
        this.scene.add(
            new THREE.HemisphereLight(
                0xffffff, 0x66704e, 2
            )
        );

        const sun = new THREE.DirectionalLight(
            0xffe5bd, 3
        );

        sun.position.set(15, 25, 15);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        this.scene.add(sun);
    },

    // CAMERA

    updateCamera() {
        if (this.interiorMode) {
            const target = new THREE.Vector3(0, 3.5, -2.5);
            const distance = this.interiorDistance;

            this.camera.fov = 65;

            this.camera.position.set(
                target.x +
                    Math.sin(this.interiorRotation) *
                    Math.cos(this.interiorPitch) * distance,

                target.y +
                    Math.sin(this.interiorPitch) * distance,

                target.z +
                    Math.cos(this.interiorRotation) *
                    Math.cos(this.interiorPitch) * distance
            );

            this.camera.lookAt(target);
            this.camera.updateProjectionMatrix();
            return;
        }

        const target = new THREE.Vector3(0, 10.5, 0);
        const distance = this.cameraDistance;

        this.camera.fov = 38;

        this.camera.position.set(
            target.x + Math.sin(this.rotation) *
                Math.cos(this.exteriorPitch) * distance,

            target.y + Math.sin(this.exteriorPitch) * distance,

            target.z + Math.cos(this.rotation) *
                Math.cos(this.exteriorPitch) * distance
        );

        this.camera.lookAt(target);
        this.camera.updateProjectionMatrix();
    },

    // VIEW AND ZOOM BUTTONS

    createViewButton() {
        const container = document.getElementById('game-canvas');

        const button = document.createElement('button');

        button.textContent = '🏛️ Enter Lobby';

        button.style.cssText = `
            position:absolute;
            right:14px;
            top:145px;
            z-index:15;
            padding:13px 16px;
            border:1px solid #c6a15e;
            border-radius:12px;
            background:#192a33;
            color:#f1d49b;
            font-size:13px;
            font-weight:bold;
        `;

        button.onclick = () => {
            this.toggleInterior();

            button.textContent = this.interiorMode
                ? '🏨 Hotel Exterior'
                : '🏛️ Enter Lobby';
        };

        container.appendChild(button);

        const controls = document.createElement('div');

        controls.style.cssText = `
            position:absolute;
            right:14px;
            top:205px;
            z-index:15;
            display:flex;
            flex-direction:column;
            gap:8px;
        `;

        const addButton = (label, amount) => {
            const b = document.createElement('button');

            b.textContent = label;

            b.style.cssText = `
                width:44px;
                height:52px;
                border:1px solid #c6a15e;
                border-radius:12px;
                background:#192a33;
                color:#f1d49b;
                font-size:24px;
                touch-action:manipulation;
            `;

            b.onclick = () => this.changeZoom(amount);
            controls.appendChild(b);
        };

        addButton('+', -3);
        addButton('−', 3);

        container.appendChild(controls);
    },

    changeZoom(amount) {
        if (this.interiorMode) {
            this.interiorDistance = THREE.MathUtils.clamp(
                this.interiorDistance + amount,
                7,
                25
            );
        } else {
            this.cameraDistance = THREE.MathUtils.clamp(
                this.cameraDistance + amount,
                30,
                75
            );
        }

        this.updateCamera();
    },

    toggleInterior() {
        this.interiorMode = !this.interiorMode;

        this.exterior.visible = !this.interiorMode;
        this.interior.visible = this.interiorMode;

        // Always enter lobby facing the reception and lounge.

        if (this.interiorMode) {
            this.interiorRotation = 0;
            this.interiorPitch = 0.04;
            this.interiorDistance = 14.5;
        }

        this.activePointers.clear();
        this.pinchDistance = 0;

        this.updateCamera();
    },

    // TOUCH AND MOUSE CONTROLS

    setupControls() {
        const canvas = this.renderer.domElement;

        canvas.style.touchAction = 'none';

        const getDistance = () => {
            const points = Array.from(this.activePointers.values());

            if (points.length < 2) return 0;

            const dx = points[0].x - points[1].x;
            const dy = points[0].y - points[1].y;

            return Math.sqrt(dx * dx + dy * dy);
        };

        canvas.addEventListener('pointerdown', event => {
            event.preventDefault();

            this.activePointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
            });

            try {
                canvas.setPointerCapture(event.pointerId);
            } catch (error) {}

            if (this.activePointers.size === 2) {
                this.pinchDistance = getDistance();
            }
        });

        canvas.addEventListener('pointermove', event => {
            if (!this.activePointers.has(event.pointerId)) return;

            event.preventDefault();

            const previous = this.activePointers.get(event.pointerId);

            this.activePointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
            });

            if (this.activePointers.size >= 2) {
                const currentDistance = getDistance();

                if (this.pinchDistance > 0 && currentDistance > 0) {
                    const ratio = this.pinchDistance / currentDistance;

                    if (this.interiorMode) {
                        this.interiorDistance =
                            THREE.MathUtils.clamp(
                                this.interiorDistance * ratio,
                                7, 25
                            );
                    } else {
                        this.cameraDistance =
                            THREE.MathUtils.clamp(
                                this.cameraDistance * ratio,
                                30, 75
                            );
                    }

                    this.updateCamera();
                }

                this.pinchDistance = currentDistance;
                return;
            }

            if (this.activePointers.size === 1) {
                const dx = event.clientX - previous.x;
                const dy = event.clientY - previous.y;

                if (this.interiorMode) {
                    this.interiorRotation -= dx * 0.006;

                    this.interiorPitch = THREE.MathUtils.clamp(
                        this.interiorPitch + dy * 0.004,
                        -0.35, 0.65
                    );
                } else {
                    this.rotation -= dx * 0.006;

                    this.exteriorPitch = THREE.MathUtils.clamp(
                        this.exteriorPitch + dy * 0.004,
                        0.05, 0.65
                    );
                }

                this.updateCamera();
            }
        });

        const stopPointer = event => {
            this.activePointers.delete(event.pointerId);

            this.pinchDistance = 0;
        };

        canvas.addEventListener('pointerup', stopPointer);
        canvas.addEventListener('pointercancel', stopPointer);
        canvas.addEventListener('lostpointercapture', stopPointer);

        canvas.addEventListener('wheel', event => {
            event.preventDefault();
            this.changeZoom(event.deltaY > 0 ? 2 : -2);
        }, { passive: false });

        window.addEventListener('resize', () => {
            const container = document.getElementById('game-canvas');

            this.camera.aspect =
                container.clientWidth / container.clientHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(
                container.clientWidth,
                container.clientHeight
            );
        });
    },

    // ANIMATION

    animate() {
        requestAnimationFrame(() => this.animate());

        this.renderer.render(this.scene, this.camera);
    },

    // UI

    updateUI() {
        const coins = document.getElementById('coins');
        const gems = document.getElementById('gems');
        const name = document.getElementById('hotel-name');

        if (coins) {
            coins.textContent = this.coins.toLocaleString('en-IN');
        }

        if (gems) gems.textContent = this.gems;
        if (name) name.textContent = this.hotelName;
    },

    openMenu(type) {
        const panel = document.getElementById('menu-panel');
        const title = document.getElementById('menu-title');
        const content = document.getElementById('menu-content');

        panel.classList.remove('hidden');

        const menus = {
            rooms: {
                title: 'Hotel Rooms 🛏️',
                content: `
                    <p>Total Rooms: ${this.rooms}</p>
                    <p>Room income: 100 coins</p>
                    <button onclick="Game.upgradeRoom()">
                        Build New Room - 1000 🪙
                    </button>`
            },

            staff: {
                title: 'Hotel Staff 👨‍💼',
                content: `
                    <p>Employees: ${this.staff}</p>
                    <p>Manage your hotel employees.</p>
                    <button onclick="Game.hireStaff()">
                        Hire Employee - 500 🪙
                    </button>`
            },

            upgrade: {
                title: 'Hotel Upgrades ⬆️',
                content: `
                    <p>Hotel Level: ${this.level}</p>
                    <p>Improve your hotel business.</p>
                    <button onclick="Game.upgradeHotel()">
                        Upgrade Hotel - 2000 🪙
                    </button>`
            },

            shop: {
                title: 'Hotel Shop 🛒',
                content: `
                    <p>Coins: ${this.coins}</p>
                    <p>Gems: ${this.gems}</p>
                    <p>Premium shop will be developed later.</p>`
            }
        };

        title.textContent = menus[type].title;
        content.innerHTML = menus[type].content;
    },

    closeMenu() {
        document.getElementById('menu-panel')
            .classList.add('hidden');
    },

    // HOTEL MANAGEMENT

    upgradeRoom() {
        if (this.coins < 1000) {
            alert('Not enough coins!');
            return;
        }

        this.coins -= 1000;
        this.rooms++;

        this.saveGame();
        this.updateUI();
        this.openMenu('rooms');
    },

    hireStaff() {
        if (this.coins < 500) {
            alert('Not enough coins!');
            return;
        }

        this.coins -= 500;
        this.staff++;

        this.saveGame();
        this.updateUI();
        this.openMenu('staff');
    },

    upgradeHotel() {
        if (this.coins < 2000) {
            alert('Not enough coins!');
            return;
        }

        this.coins -= 2000;
        this.level++;

        this.saveGame();
        this.updateUI();
        this.openMenu('upgrade');
    },

    // SAVE SYSTEM

    saveGame() {
        localStorage.setItem(
            'hotelEmpireSave',
            JSON.stringify({
                coins: this.coins,
                gems: this.gems,
                level: this.level,
                rooms: this.rooms,
                staff: this.staff,
                hotelName: this.hotelName
            })
        );
    },

    loadGame() {
        const saved = localStorage.getItem('hotelEmpireSave');

        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            this.coins = data.coins ?? 0;
            this.gems = data.gems ?? 50;
            this.level = data.level ?? 1;
            this.rooms = data.rooms ?? 10;
            this.staff = data.staff ?? 2;

            this.hotelName =
                data.hotelName ?? 'Grand Palace Hotel';

        } catch (error) {
            console.error('Save data error:', error);
        }
    }
};

window.Game = Game;
Game.init();
