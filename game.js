
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// =====================================
// HOTEL EMPIRE 3D - GAME ENGINE
// =====================================

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

    touchStart: null,
    rotation: 0,

    init() {
        this.loadGame();
        this.createWorld();
        this.createHotel();
        this.createGarden();
        this.createPool();
        this.setupLighting();
        this.setupControls();
        this.updateUI();
        this.animate();

        const loading = document.getElementById('loading-screen');

        setTimeout(() => {
            loading.style.opacity = '0';

            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);

        }, 700);
    },

    // =====================================
    // CREATE 3D WORLD
    // =====================================

    createWorld() {

        const container = document.getElementById('game-canvas');

        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0x9eb7c7);

        this.scene.fog = new THREE.Fog(
            0x9eb7c7,
            25,
            85
        );

        this.camera = new THREE.PerspectiveCamera(
            42,
            container.clientWidth / container.clientHeight,
            0.1,
            200
        );

        this.camera.position.set(13, 11, 17);

        this.camera.lookAt(0, 3, 0);

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

        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.15;

        container.appendChild(this.renderer.domElement);

        // Ground

        const groundGeometry = new THREE.PlaneGeometry(
            100,
            100
        );

        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x526d4e,
            roughness: 1
        });

        const ground = new THREE.Mesh(
            groundGeometry,
            groundMaterial
        );

        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.15;
        ground.receiveShadow = true;

        this.scene.add(ground);

        // Hotel platform

        this.box(
            0, 0.05, 0,
            13, 0.35, 11,
            0x777b7d
        );
    },

    // =====================================
    // BASIC 3D OBJECT CREATOR
    // =====================================

    box(x, y, z, width, height, depth, color, options = {}) {

        const geometry = new THREE.BoxGeometry(
            width,
            height,
            depth
        );

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: options.roughness ?? 0.75,
            metalness: options.metalness ?? 0
        });

        const object = new THREE.Mesh(
            geometry,
            material
        );

        object.position.set(x, y, z);

        object.castShadow = true;
        object.receiveShadow = true;

        this.scene.add(object);

        return object;
    },

    // =====================================
    // CREATE HOTEL BUILDING
    // =====================================

    createHotel() {

        this.hotel = new THREE.Group();

        this.scene.add(this.hotel);

        // Main building

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(8, 8, 5),
            new THREE.MeshStandardMaterial({
                color: 0xe7d6b7,
                roughness: 0.8
            })
        );

        building.position.set(0, 4.25, 0);
        building.castShadow = true;
        building.receiveShadow = true;

        this.hotel.add(building);

        // Floor separation lines

        for (let floor = 1; floor <= 3; floor++) {

            const line = new THREE.Mesh(
                new THREE.BoxGeometry(8.08, 0.12, 5.08),
                new THREE.MeshStandardMaterial({
                    color: 0x92704c
                })
            );

            line.position.set(0, floor * 2 + 0.25, 0);

            this.hotel.add(line);
        }

        // Windows

        for (let floor = 0; floor < 4; floor++) {

            for (let column = 0; column < 4; column++) {

                const x = -3 + column * 2;

                const windowMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1.1, 1.15, 0.09),
                    new THREE.MeshStandardMaterial({
                        color: 0x456f87,
                        metalness: 0.5,
                        roughness: 0.2
                    })
                );

                windowMesh.position.set(
                    x,
                    1.3 + floor * 2,
                    2.54
                );

                this.hotel.add(windowMesh);

                // Window frames

                const frame = new THREE.Mesh(
                    new THREE.BoxGeometry(1.22, 1.27, 0.07),
                    new THREE.MeshStandardMaterial({
                        color: 0xb58b50,
                        metalness: 0.5
                    })
                );

                frame.position.set(
                    x,
                    1.3 + floor * 2,
                    2.48
                );

                frame.scale.z = 0.5;

                this.hotel.add(frame);
            }
        }

        // Roof

        this.box(
            0, 8.45, 0,
            8.5, 0.4, 5.5,
            0x59483c
        );

        // Main entrance

        this.box(
            0, 1.15, 2.58,
            2.1, 2.3, 0.25,
            0x563b2b
        );

        // Entrance glass door

        this.box(
            0, 1.1, 2.75,
            1.2, 2, 0.08,
            0x80b7c7,
            { metalness: 0.5, roughness: 0.2 }
        );

        // Golden entrance pillars

        for (const x of [-1.35, 1.35]) {

            this.box(
                x, 1.5, 2.65,
                0.18, 3, 0.18,
                0xc59a53,
                { metalness: 0.6 }
            );
        }

        // Hotel sign

        this.box(
            0, 3.2, 2.7,
            3, 0.45, 0.12,
            0xc59a53,
            { metalness: 0.5 }
        );

        // Front steps

        this.box(
            0, 0.35, 3.3,
            3.5, 0.3, 1,
            0xaaa6a0
        );

        this.box(
            0, 0.2, 4,
            4.2, 0.2, 0.7,
            0xbcb7af
        );

        // Side windows

        for (let floor = 0; floor < 4; floor++) {

            for (const side of [-1, 1]) {

                this.box(
                    side * 4.04,
                    1.3 + floor * 2,
                    0,
                    0.08,
                    1.1,
                    1.1,
                    0x456f87
                );
            }
        }
    },

    // =====================================
    // GARDEN AND TREES
    // =====================================

    createGarden() {

        const positions = [
            [-6, 4],
            [6, 4],
            [-6, -4],
            [6, -4],
            [-5, -7],
            [5, -7]
        ];

        positions.forEach(([x, z]) => {

            // Tree trunk

            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.15, 0.22, 1.8, 8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x68452d
                })
            );

            trunk.position.set(x, 0.9, z);
            trunk.castShadow = true;

            this.scene.add(trunk);

            // Tree leaves

            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.15, 10, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x356d3c
                })
            );

            leaves.position.set(x, 2.4, z);
            leaves.scale.y = 1.25;
            leaves.castShadow = true;

            this.scene.add(leaves);
        });

        // Garden grass patches

        this.box(
            -5, 0.04, 0,
            2, 0.1, 5,
            0x66804b
        );

        this.box(
            5, 0.04, 0,
            2, 0.1, 5,
            0x66804b
        );
    },

    // =====================================
    // SWIMMING POOL
    // =====================================

    createPool() {

        // Pool border

        this.box(
            -4.3, 0.16, -5.3,
            4.2, 0.25, 3.2,
            0xe5d8c0
        );

        // Water

        const water = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 0.08, 2.8),
            new THREE.MeshStandardMaterial({
                color: 0x27a8c5,
                metalness: 0.3,
                roughness: 0.2
            })
        );

        water.position.set(-4.3, 0.31, -5.3);

        this.scene.add(water);

        // Poolside lounge chairs

        for (let i = 0; i < 2; i++) {

            this.box(
                -7 + i * 1.2,
                0.35,
                -2.7,
                0.8,
                0.15,
                1.5,
                0xd9c59f
            );
        }
    },

    // =====================================
    // LIGHTING
    // =====================================

    setupLighting() {

        const ambient = new THREE.HemisphereLight(
            0xffffff,
            0x65704f,
            2
        );

        this.scene.add(ambient);

        const sunlight = new THREE.DirectionalLight(
            0xffe4b5,
            3
        );

        sunlight.position.set(10, 18, 10);

        sunlight.castShadow = true;

        sunlight.shadow.mapSize.set(1024, 1024);

        sunlight.shadow.camera.left = -20;
        sunlight.shadow.camera.right = 20;
        sunlight.shadow.camera.top = 20;
        sunlight.shadow.camera.bottom = -20;

        this.scene.add(sunlight);
    },

    // =====================================
    // CAMERA TOUCH CONTROLS
    // =====================================

    setupControls() {

        const canvas = this.renderer.domElement;

        canvas.addEventListener('pointerdown', (event) => {

            this.touchStart = {
                x: event.clientX,
                y: event.clientY
            };

        });

        canvas.addEventListener('pointermove', (event) => {

            if (!this.touchStart) return;

            const deltaX =
                event.clientX - this.touchStart.x;

            this.rotation += deltaX * 0.008;

            this.touchStart = {
                x: event.clientX,
                y: event.clientY
            };

            const distance = 21;

            this.camera.position.x =
                Math.sin(this.rotation) * distance;

            this.camera.position.z =
                Math.cos(this.rotation) * distance;

            this.camera.lookAt(0, 3, 0);

        });

        const stopTouch = () => {
            this.touchStart = null;
        };

        canvas.addEventListener('pointerup', stopTouch);
        canvas.addEventListener('pointercancel', stopTouch);

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

    // =====================================
    // GAME ANIMATION
    // =====================================

    animate() {

        requestAnimationFrame(() => this.animate());

        this.renderer.render(
            this.scene,
            this.camera
        );
    },

    // =====================================
    // USER INTERFACE
    // =====================================

    updateUI() {

        document.getElementById('coins').textContent =
            this.coins.toLocaleString('en-IN');

        document.getElementById('gems').textContent =
            this.gems;

        document.getElementById('hotel-name').textContent =
            this.hotelName;
    },

    openMenu(type) {

        const panel =
            document.getElementById('menu-panel');

        const title =
            document.getElementById('menu-title');

        const content =
            document.getElementById('menu-content');

        panel.classList.remove('hidden');

        const menus = {

            rooms: {
                title: 'Hotel Rooms 🛏️',
                content: `
                    <p>Total Rooms: ${this.rooms}</p>
                    <p>Room income: 100 coins</p>
                    <button onclick="Game.upgradeRoom()">
                        Build New Room - 1000 🪙
                    </button>
                `
            },

            staff: {
                title: 'Hotel Staff 👨‍💼',
                content: `
                    <p>Employees: ${this.staff}</p>
                    <p>Manage your hotel employees.</p>
                    <button onclick="Game.hireStaff()">
                        Hire Employee - 500 🪙
                    </button>
                `
            },

            upgrade: {
                title: 'Hotel Upgrades ⬆️',
                content: `
                    <p>Hotel Level: ${this.level}</p>
                    <p>Improve your hotel business.</p>
                    <button onclick="Game.upgradeHotel()">
                        Upgrade Hotel - 2000 🪙
                    </button>
                `
            },

            shop: {
                title: 'Hotel Shop 🛒',
                content: `
                    <p>Coins: ${this.coins}</p>
                    <p>Gems: ${this.gems}</p>
                    <p>Premium shop will be developed later.</p>
                `
            }

        };

        title.textContent = menus[type].title;
        content.innerHTML = menus[type].content;
    },

    closeMenu() {

        document.getElementById('menu-panel')
            .classList.add('hidden');
    },

    // =====================================
    // HOTEL BUSINESS FUNCTIONS
    // =====================================

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

    // =====================================
    // OFFLINE SAVE SYSTEM
    // =====================================

    saveGame() {

        const data = {
            coins: this.coins,
            gems: this.gems,
            level: this.level,
            rooms: this.rooms,
            staff: this.staff,
            hotelName: this.hotelName
        };

        localStorage.setItem(
            'hotelEmpireSave',
            JSON.stringify(data)
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

// Make game functions accessible to HTML buttons

window.Game = Game;

// Start game

Game.init();
