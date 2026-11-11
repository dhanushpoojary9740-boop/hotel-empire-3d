import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const Game = {
    coins: 5000,
    gems: 50,
    level: 1,
    rooms: 5,
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
    interiorDistance: 24,
    interiorPitch: 0.18,

    dragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
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
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
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
            new THREE.CylinderGeometry(radius, radius, height, 20),
            this.material(color)
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
    },

    sphere(parent, x, y, z, radius, color) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 12),
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
            38,
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
            this.exterior,
            0, 0.05, 0,
            30, 0.5, 26,
            0x898985
        );

        this.box(
            this.exterior,
            0, 0.32, 11,
            23, 0.08, 3,
            0x565c60
        );
    },

    // WINDOWS

    addFrontWindow(parent, x, y, z, width = 1.15) {
        this.box(
            parent, x, y, z,
            width, 1.25, 0.14,
            0x98774d
        );

        this.box(
            parent, x, y, z + 0.09,
            width - 0.12, 1.13, 0.045,
            0x28536a,
            { metalness: 0.45, roughness: 0.2 }
        );

        this.box(
            parent, x, y, z + 0.13,
            0.045, 1.1, 0.035,
            0xc5a267
        );

        this.box(
            parent, x, y, z + 0.13,
            width - 0.12, 0.045, 0.035,
            0xc5a267
        );
    },

    addSideWindow(parent, x, y, z, side) {
        this.box(
            parent, x, y, z,
            0.14, 1.25, 1.25,
            0x98774d
        );

        this.box(
            parent,
            x + side * 0.09, y, z,
            0.045, 1.13, 1.13,
            0x28536a,
            { metalness: 0.45, roughness: 0.2 }
        );
    },

    addBalcony(parent, x, y, z) {
        this.box(
            parent, x, y - 0.55, z + 0.65,
            1.85, 0.16, 1.4,
            0xc8b99e
        );

        this.box(
            parent, x, y - 0.15, z + 1.3,
            1.7, 0.7, 0.07,
            0x8ebac6,
            { metalness: 0.3, roughness: 0.2 }
        );

        this.box(
            parent, x, y + 0.22, z + 1.3,
            1.85, 0.09, 0.12,
            0xc6a05e,
            { metalness: 0.65 }
        );

        for (const offset of [-0.85, 0.85]) {
            this.box(
                parent, x + offset, y - 0.15, z + 1.3,
                0.08, 0.82, 0.12,
                0xc6a05e
            );
        }
    },

    // HOTEL EXTERIOR

    createHotel() {
        this.hotel = new THREE.Group();
        this.exterior.add(this.hotel);

        const floors = 10;
        const floorHeight = 2.25;
        const height = floors * floorHeight;

        this.box(
            this.hotel,
            0, height / 2 + 0.3, 0,
            13, height, 8,
            0xe8dcc4
        );

        for (const side of [-1, 1]) {
            this.box(
                this.hotel,
                side * 8.2, 6.9, -0.2,
                4, 13.2, 7.5,
                0xd9c9aa
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
                this.hotel,
                0, floor * floorHeight + 0.3, 0,
                13.15, 0.12, 8.15,
                0xb38c56
            );
        }

        for (let floor = 0; floor < floors; floor++) {
            const y = 1.45 + floor * floorHeight;

            for (let column = 0; column < 6; column++) {
                const x = -5.1 + column * 2.04;

                this.addFrontWindow(
                    this.hotel, x, y, 4.05, 1.2
                );

                this.addFrontWindow(
                    this.hotel, x, y, -4.05, 1.2
                );

                if (floor === 2 || floor === 5 || floor === 8) {
                    this.addBalcony(this.hotel, x, y, 4.05);
                }
            }
        }

        for (let floor = 0; floor < floors; floor++) {
            const y = 1.45 + floor * floorHeight;

            for (let column = 0; column < 3; column++) {
                const z = -2.5 + column * 2.5;

                this.addSideWindow(
                    this.hotel, 6.55, y, z, 1
                );

                this.addSideWindow(
                    this.hotel, -6.55, y, z, -1
                );
            }
        }

        this.box(
            this.hotel,
            0, height + 0.55, 0,
            13.7, 0.55, 8.7,
            0x574638
        );

        this.box(
            this.hotel,
            0, height + 0.86, 0,
            13.4, 0.1, 8.4,
            0xc29a61
        );

        this.box(
            this.hotel,
            0, 2.1, 4.35,
            5.5, 3.8, 0.6,
            0x61452f
        );

        this.box(
            this.hotel,
            0, 1.8, 4.7,
            3.8, 3.2, 0.12,
            0x76afbd,
            { metalness: 0.45 }
        );

        for (const x of [-2.8, 2.8]) {
            this.box(
                this.hotel,
                x, 2.2, 4.65,
                0.3, 4.3, 0.35,
                0xc7a05d
            );
        }

        this.box(
            this.hotel,
            0, 4.35, 5.15,
            7.2, 0.35, 2.3,
            0x9b7040
        );

        this.box(
            this.hotel,
            0, 4.55, 5.15,
            7.3, 0.1, 2.4,
            0xd2ad6c
        );

        for (let i = 0; i < 3; i++) {
            this.box(
                this.hotel,
                0,
                0.35 + i * 0.12,
                5.6 + i * 0.7,
                7 + i * 0.5,
                0.25, 0.8,
                0xd0c5b2
            );
        }

        for (const x of [-5.5, 5.5]) {
            this.cylinder(
                this.hotel,
                x, 2.5, 4.7,
                0.25, 4.5,
                0xe0d4bd
            );
        }
    },

    // GRAND LUXURY INTERIOR

    createInterior() {
        this.interior = new THREE.Group();
        this.scene.add(this.interior);

        const lobby = new THREE.Group();
        this.interior.add(lobby);

        // Luxury marble floor

        this.box(
            lobby,
            0, 0, 0,
            20, 0.25, 16,
            0xd8d0c2,
            { roughness: 0.2, metalness: 0.12 }
        );

        // Marble floor tiles

        for (let x = -8; x <= 8; x += 2) {
            this.box(
                lobby,
                x, 0.14, 0,
                0.035, 0.025, 15.5,
                0xb9a889
            );
        }

        for (let z = -6; z <= 6; z += 2) {
            this.box(
                lobby,
                0, 0.14, z,
                19.5, 0.025, 0.035,
                0xb9a889
            );
        }

        // Gold floor border

        for (const z of [-7.5, 7.5]) {
            this.box(
                lobby,
                0, 0.16, z,
                19.5, 0.04, 0.09,
                0xc5a15e
            );
        }

        for (const x of [-9.5, 9.5]) {
            this.box(
                lobby,
                x, 0.16, 0,
                0.09, 0.04, 15,
                0xc5a15e
            );
        }

        // Double-height rear wall

        this.box(
            lobby,
            0, 5, -8,
            20, 10, 0.35,
            0x302b2a
        );

        // Side walls

        this.box(
            lobby,
            -10, 5, 0,
            0.35, 10, 16,
            0x39312d
        );

        this.box(
            lobby,
            10, 5, 0,
            0.35, 10, 16,
            0x39312d
        );

        // Ceiling

        this.box(
            lobby,
            0, 10, 0,
            20, 0.3, 16,
            0x302b2a
        );

        // Decorative wall panels

        for (let x = -8; x <= 8; x += 2.7) {
            this.box(
                lobby,
                x, 5, -7.78,
                1.9, 8.5, 0.08,
                0x614936
            );

            this.box(
                lobby,
                x, 5, -7.7,
                0.06, 8.2, 0.05,
                0xd0ad6b
            );
        }

        // Luxury reception counter

        for (const x of [-4.2, 0, 4.2]) {
            this.box(
                lobby,
                x, 1.15, -5,
                3.6, 1.8, 1.25,
                0x50372c
            );

            this.box(
                lobby,
                x, 2.1, -5,
                3.8, 0.16, 1.45,
                0xc9a362,
                { metalness: 0.55 }
            );

            this.box(
                lobby,
                x, 1.15, -4.34,
                3.3, 1.3, 0.07,
                0x94734c
            );

            this.box(
                lobby,
                x, 1.15, -4.28,
                0.05, 1.3, 0.04,
                0xe3bd75
            );

            // Reception computer

            this.box(
                lobby,
                x, 2.28, -5,
                0.85, 0.08, 0.5,
                0x202b30
            );
        }

        // Reception flower arrangements

        for (const x of [-7, 7]) {
            this.cylinder(
                lobby,
                x, 0.55, -4.5,
                0.45, 1.1, 0x75533c
            );

            this.sphere(
                lobby,
                x, 1.35, -4.5,
                0.65, 0x3c7a4b
            );
        }

        // Luxury lounge sofas

        for (const x of [-6.2, 6.2]) {
            this.box(
                lobby,
                x, 0.7, 1.3,
                4, 0.55, 1.5,
                0xb58d70
            );

            this.box(
                lobby,
                x, 1.35, 1.9,
                4, 0.95, 0.35,
                0x8f6a56
            );

            for (const offset of [-1.7, 1.7]) {
                this.box(
                    lobby,
                    x + offset, 1.05, 1.3,
                    0.35, 0.85, 1.5,
                    0x765747
                );
            }

            // Sofa cushions

            for (const offset of [-1, 0, 1]) {
                this.box(
                    lobby,
                    x + offset, 1.02, 1.25,
                    0.85, 0.2, 1,
                    0xd7b89a
                );
            }
        }

        // Central coffee tables

        this.box(
            lobby,
            0, 0.65, 1.3,
            3.2, 0.15, 1.5,
            0x9c754d
        );

        this.box(
            lobby,
            0, 0.75, 1.3,
            3, 0.05, 1.3,
            0xd2b88b,
            { metalness: 0.25 }
        );

        // Additional lounge chairs

        for (const x of [-7, 7]) {
            this.box(
                lobby,
                x, 0.65, 4.5,
                1.8, 0.5, 1.7,
                0x80614c
            );

            this.box(
                lobby,
                x, 1.1, 5.15,
                1.8, 0.9, 0.3,
                0xb58d70
            );
        }

        // Decorative marble pillars

        for (const x of [-8, -4, 4, 8]) {
            this.cylinder(
                lobby,
                x, 5, 6,
                0.35, 9.5,
                0xcbb99b
            );

            this.cylinder(
                lobby,
                x, 9.8, 6,
                0.55, 0.3,
                0xc5a15e
            );

            this.cylinder(
                lobby,
                x, 0.25, 6,
                0.55, 0.3,
                0xc5a15e
            );
        }

        // Elevator entrance

        for (const x of [-5.5, -2.5, 2.5, 5.5]) {
            this.box(
                lobby,
                x, 2.5, -7.55,
                0.12, 5, 0.16,
                0xc6a15e
            );
        }

        for (const x of [-4, 4]) {
            this.box(
                lobby,
                x, 2.5, -7.5,
                2.6, 4.8, 0.16,
                0x91b5c0,
                { metalness: 0.6, roughness: 0.2 }
            );

            this.box(
                lobby,
                x, 4.95, -7.35,
                0.8, 0.12, 0.06,
                0xc7a15e
            );
        }

        // Crystal chandeliers

        for (const x of [-6, 0, 6]) {
            this.cylinder(
                lobby,
                x, 9.5, -0.5,
                0.045, 0.9,
                0xc5a15e
            );

            this.sphere(
                lobby,
                x, 8.85, -0.5,
                0.5,
                0xf5d58b
            );

            // Chandelier crystals

            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;

                this.box(
                    lobby,
                    x + Math.cos(angle) * 0.55,
                    8.6,
                    -0.5 + Math.sin(angle) * 0.55,
                    0.1, 0.45, 0.1,
                    0xd9c5a0
                );
            }
        }

        // Indoor decorative plants

        for (const x of [-8.5, 8.5]) {
            this.cylinder(
                lobby,
                x, 0.5, 3,
                0.55, 1,
                0x76523a
            );

            this.sphere(
                lobby,
                x, 1.8, 3,
                0.9,
                0x397348
            );

            this.sphere(
                lobby,
                x - 0.35, 2.3, 3,
                0.55,
                0x477d4a
            );

            this.sphere(
                lobby,
                x + 0.35, 2.3, 3,
                0.55,
                0x477d4a
            );
        }

        // Lobby feature wall artwork

        this.box(
            lobby,
            0, 7, -7.55,
            4.5, 2.1, 0.12,
            0xc1a06c,
            { metalness: 0.35 }
        );

        this.box(
            lobby,
            0, 7, -7.45,
            4.1, 1.7, 0.05,
            0x45372f
        );

        // Welcome desk flower vase

        this.cylinder(
            lobby,
            0, 2.5, -5,
            0.2, 0.5,
            0x98764d
        );

        // Lobby lighting

        const lobbyLight = new THREE.PointLight(
            0xffd69a, 55, 35
        );

        lobbyLight.position.set(0, 8.5, 0);
        lobby.add(lobbyLight);

        const receptionLight = new THREE.PointLight(
            0xffd49b, 22, 20
        );

        receptionLight.position.set(0, 4, -3);
        lobby.add(receptionLight);

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
                this.exterior,
                x, 1, z,
                0.2, 2,
                0x68452d
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
            this.exterior,
            -10, 0.35, -7,
            6, 0.3, 5,
            0xe1d5bd
        );

        this.box(
            this.exterior,
            -10, 0.53, -7,
            5.6, 0.08, 4.6,
            0x26a9c5,
            { metalness: 0.3, roughness: 0.2 }
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
            const target = new THREE.Vector3(0, 4.2, -1.5);
            const distance = this.interiorDistance;

            this.camera.fov = 55;
            this.camera.position.set(
                target.x + Math.sin(this.interiorRotation) *
                    Math.cos(this.interiorPitch) * distance,
                target.y + Math.sin(this.interiorPitch) * distance,
                target.z + Math.cos(this.interiorRotation) *
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

    // VIEW BUTTON

    createViewButton() {
        const container =
            document.getElementById('game-canvas');

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
            cursor:pointer;
        `;

        button.onclick = () => {
            this.toggleInterior();

            button.textContent = this.interiorMode
                ? '🏨 Hotel Exterior'
                : '🏛️ Enter Lobby';
        };

        container.appendChild(button);

        // Zoom controls for both views

        const zoomControls = document.createElement('div');

        zoomControls.style.cssText = `
            position:absolute;
            right:14px;
            top:205px;
            z-index:15;
            display:flex;
            flex-direction:column;
            gap:8px;
        `;

        const makeZoomButton = (label, amount, accessibleName) => {
            const zoomButton = document.createElement('button');

            zoomButton.textContent = label;
            zoomButton.setAttribute('aria-label', accessibleName);

            zoomButton.style.cssText = `
                width:44px;
                height:44px;
                border:1px solid #c6a15e;
                border-radius:12px;
                background:#192a33;
                color:#f1d49b;
                font-size:25px;
                font-weight:bold;
                cursor:pointer;
                touch-action:manipulation;
            `;

            zoomButton.onclick = () => this.changeZoom(amount);

            zoomControls.appendChild(zoomButton);
        };

        makeZoomButton('+', -3, 'Zoom in');
        makeZoomButton('−', 3, 'Zoom out');

        container.appendChild(zoomControls);
    },

    changeZoom(amount) {
        if (this.interiorMode) {
            this.interiorDistance = THREE.MathUtils.clamp(
                this.interiorDistance + amount,
                12,
                38
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

        this.activePointers.clear();
        this.dragging = false;
        this.pinchDistance = 0;

        this.updateCamera();
    },

    // CAMERA CONTROLS
    // One finger: rotate the view.
    // Two fingers: pinch to zoom.
    // Mouse: drag to rotate and use the wheel to zoom.

    setupControls() {
        const canvas = this.renderer.domElement;

        canvas.style.touchAction = 'none';

        const getPointerDistance = () => {
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
            } catch (error) {
                // Pointer capture may not be available in every browser.
            }

            if (this.activePointers.size === 1) {
                this.dragging = true;
                this.lastPointerX = event.clientX;
                this.lastPointerY = event.clientY;
            } else if (this.activePointers.size === 2) {
                this.dragging = false;
                this.pinchDistance = getPointerDistance();
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

            // Two-finger pinch zoom

            if (this.activePointers.size >= 2) {
                const currentDistance = getPointerDistance();

                if (this.pinchDistance > 0 && currentDistance > 0) {
                    const zoomRatio =
                        this.pinchDistance / currentDistance;

                    if (this.interiorMode) {
                        this.interiorDistance =
                            THREE.MathUtils.clamp(
                                this.interiorDistance * zoomRatio,
                                12,
                                38
                            );
                    } else {
                        this.cameraDistance =
                            THREE.MathUtils.clamp(
                                this.cameraDistance * zoomRatio,
                                30,
                                75
                            );
                    }

                    this.updateCamera();
                }

                this.pinchDistance = currentDistance;
                return;
            }

            // One-finger camera rotation

            if (this.activePointers.size === 1) {
                const deltaX = event.clientX - previous.x;
                const deltaY = event.clientY - previous.y;

                if (this.interiorMode) {
                    this.interiorRotation -= deltaX * 0.006;

                    this.interiorPitch =
                        THREE.MathUtils.clamp(
                            this.interiorPitch + deltaY * 0.004,
                            -0.25,
                            0.55
                        );
                } else {
                    this.rotation -= deltaX * 0.006;

                    this.exteriorPitch =
                        THREE.MathUtils.clamp(
                            this.exteriorPitch + deltaY * 0.004,
                            0.05,
                            0.65
                        );
                }

                this.updateCamera();
            }
        });

        const stopPointer = event => {
            this.activePointers.delete(event.pointerId);

            if (this.activePointers.size === 1) {
                const remaining = Array.from(
                    this.activePointers.values()
                )[0];

                this.lastPointerX = remaining.x;
                this.lastPointerY = remaining.y;
                this.dragging = true;
                this.pinchDistance = 0;
            } else {
                this.dragging = false;
                this.pinchDistance = 0;
            }
        };

        canvas.addEventListener('pointerup', stopPointer);
        canvas.addEventListener('pointercancel', stopPointer);
        canvas.addEventListener('lostpointercapture', stopPointer);

        // Mouse wheel zoom

        canvas.addEventListener('wheel', event => {
            event.preventDefault();

            const amount = event.deltaY > 0 ? 2 : -2;

            this.changeZoom(amount);
        }, { passive: false });

        // Screen resizing

        window.addEventListener('resize', () => {
            const container =
                document.getElementById('game-canvas');

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

        this.renderer.render(
            this.scene,
            this.camera
        );
    },

    // UI

    updateUI() {
        const coins = document.getElementById('coins');
        const gems = document.getElementById('gems');
        const name = document.getElementById('hotel-name');

        if (coins) {
            coins.textContent =
                this.coins.toLocaleString('en-IN');
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

    // MANAGEMENT

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
        const saved =
            localStorage.getItem('hotelEmpireSave');

        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            this.coins = data.coins ?? 5000;
            this.gems = data.gems ?? 50;
            this.level = data.level ?? 1;
            this.rooms = data.rooms ?? 5;
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
