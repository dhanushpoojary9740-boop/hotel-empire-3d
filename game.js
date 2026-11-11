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

    rotation: 0.65,
    cameraDistance: 30,
    cameraMinDistance: 19,
    cameraMaxDistance: 45,

    cameraTarget: new THREE.Vector3(0, 3.5, 0),

    dragging: false,
    lastPointerX: 0,

    init() {

        this.loadGame();

        this.createWorld();
        this.createHotel();
        this.createGarden();
        this.createPool();
        this.setupLighting();
        this.setupControls();

        this.updateCamera();
        this.updateUI();
        this.animate();

        const loading =
            document.getElementById('loading-screen');

        setTimeout(() => {

            loading.style.opacity = '0';

            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);

        }, 700);
    },

    // =================================
    // WORLD
    // =================================

    createWorld() {

        const container =
            document.getElementById('game-canvas');

        this.scene = new THREE.Scene();

        this.scene.background =
            new THREE.Color(0x9eb7c7);

        this.scene.fog = new THREE.Fog(
            0x9eb7c7, 35, 100
        );

        this.camera = new THREE.PerspectiveCamera(
            38,
            container.clientWidth / container.clientHeight,
            0.1,
            200
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

        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.15;

        container.appendChild(this.renderer.domElement);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({
                color: 0x526d4e,
                roughness: 1
            })
        );

        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.15;
        ground.receiveShadow = true;

        this.scene.add(ground);

        this.addWorldBox(
            0, 0.05, 0,
            13, 0.35, 11,
            0x777b7d
        );
    },

    // =================================
    // BOX CREATOR
    // =================================

    addBox(parent, x, y, z, w, h, d, color, options = {}) {

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({
                color: color,
                roughness: options.roughness ?? 0.75,
                metalness: options.metalness ?? 0
            })
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        parent.add(mesh);

        return mesh;
    },

    addWorldBox(x, y, z, w, h, d, color) {

        return this.addBox(
            this.scene,
            x, y, z, w, h, d, color
        );
    },

    // =================================
    // WINDOW CREATOR
    // =================================

    addWindow(parent, x, y, z, w, h, depth, side) {

        const glass = new THREE.MeshStandardMaterial({
            color: 0x376c83,
            metalness: 0.45,
            roughness: 0.18
        });

        const gold = new THREE.MeshStandardMaterial({
            color: 0xb58b50,
            metalness: 0.55,
            roughness: 0.35
        });

        if (side === 'front' || side === 'back') {

            this.addBox(
                parent,
                x, y, z,
                w, h, depth,
                0x9d7545
            );

            this.addBox(
                parent,
                x, y, z + (side === 'front' ? 0.055 : -0.055),
                w - 0.12, h - 0.12, 0.045,
                0x376c83,
                { metalness: 0.45, roughness: 0.18 }
            );

            // Window vertical divider

            this.addBox(
                parent,
                x, y, z + (side === 'front' ? 0.09 : -0.09),
                0.055, h - 0.12, 0.04,
                0xb58b50,
                { metalness: 0.55 }
            );

            // Window horizontal divider

            this.addBox(
                parent,
                x, y, z + (side === 'front' ? 0.09 : -0.09),
                w - 0.12, 0.045, 0.04,
                0xb58b50,
                { metalness: 0.55 }
            );

        } else {

            this.addBox(
                parent,
                x, y, z,
                depth, h, w,
                0x9d7545
            );

            this.addBox(
                parent,
                x + (side === 'right' ? 0.055 : -0.055),
                y, z,
                0.045, h - 0.12, w - 0.12,
                0x376c83,
                { metalness: 0.45, roughness: 0.18 }
            );

            this.addBox(
                parent,
                x + (side === 'right' ? 0.09 : -0.09),
                y, z,
                0.04, h - 0.12, 0.055,
                0xb58b50
            );

            this.addBox(
                parent,
                x + (side === 'right' ? 0.09 : -0.09),
                y, z,
                0.04, 0.045, w - 0.12,
                0xb58b50
            );
        }
    },

    // =================================
    // BALCONY
    // =================================

    addBalcony(parent, x, y, z, width, side) {

        const gold = 0xc59a53;
        const glass = 0x91bdc9;

        if (side === 'front' || side === 'back') {

            const direction = side === 'front' ? 1 : -1;

            this.addBox(
                parent,
                x,
                y - 0.65,
                z + direction * 0.65,
                width + 0.4,
                0.16,
                1.25,
                0xc5b69e
            );

            // Glass railing

            this.addBox(
                parent,
                x,
                y - 0.12,
                z + direction * 1.2,
                width,
                0.75,
                0.07,
                glass,
                { metalness: 0.3, roughness: 0.25 }
            );

            this.addBox(
                parent,
                x,
                y + 0.28,
                z + direction * 1.2,
                width + 0.08,
                0.09,
                0.12,
                gold,
                { metalness: 0.6 }
            );

            for (const offset of [-width / 2, width / 2]) {

                this.addBox(
                    parent,
                    x + offset,
                    y - 0.12,
                    z + direction * 1.2,
                    0.09,
                    0.85,
                    0.12,
                    gold
                );
            }

        } else {

            const direction = side === 'right' ? 1 : -1;

            this.addBox(
                parent,
                x + direction * 0.65,
                y - 0.65,
                z,
                1.25,
                0.16,
                width + 0.4,
                0xc5b69e
            );

            this.addBox(
                parent,
                x + direction * 1.2,
                y - 0.12,
                z,
                0.07,
                0.75,
                width,
                glass
            );

            this.addBox(
                parent,
                x + direction * 1.2,
                y + 0.28,
                z,
                0.12,
                0.09,
                width + 0.08,
                gold
            );
        }
    },

    // =================================
    // HOTEL BUILDING
    // =================================

    createHotel() {

        this.hotel = new THREE.Group();

        this.scene.add(this.hotel);

        // Main building

        this.addBox(
            this.hotel,
            0, 4.25, 0,
            8, 8, 5,
            0xe7d6b7
        );

        // Decorative floor lines

        for (let floor = 1; floor <= 3; floor++) {

            this.addBox(
                this.hotel,
                0, floor * 2 + 0.25, 0,
                8.08, 0.12, 5.08,
                0x92704c
            );
        }

        // Front and back windows

        for (let floor = 0; floor < 4; floor++) {

            const y = 1.3 + floor * 2;

            for (let column = 0; column < 4; column++) {

                const x = -3 + column * 2;

                this.addWindow(
                    this.hotel,
                    x, y, 2.54,
                    1.1, 1.15, 0.09,
                    'front'
                );

                this.addWindow(
                    this.hotel,
                    x, y, -2.54,
                    1.1, 1.15, 0.09,
                    'back'
                );

                // Balconies on selected floors

                if (floor === 1 || floor === 2) {

                    this.addBalcony(
                        this.hotel,
                        x, y, 2.54,
                        1.1, 'front'
                    );
                }
            }
        }

        // Left and right windows

        for (let floor = 0; floor < 4; floor++) {

            const y = 1.3 + floor * 2;

            for (let column = 0; column < 2; column++) {

                const z = -1.2 + column * 2.4;

                this.addWindow(
                    this.hotel,
                    -4.04, y, z,
                    1.1, 1.15, 0.09,
                    'left'
                );

                this.addWindow(
                    this.hotel,
                    4.04, y, z,
                    1.1, 1.15, 0.09,
                    'right'
                );
            }
        }

        // Roof

        this.addBox(
            this.hotel,
            0, 8.45, 0,
            8.5, 0.4, 5.5,
            0x59483c
        );

        // Roof decorative edge

        this.addBox(
            this.hotel,
            0, 8.68, 0,
            8.25, 0.12, 5.25,
            0x806348
        );

        // Entrance

        this.addBox(
            this.hotel,
            0, 1.15, 2.58,
            2.1, 2.3, 0.25,
            0x563b2b
        );

        // Glass entrance door

        this.addBox(
            this.hotel,
            0, 1.1, 2.75,
            1.2, 2, 0.08,
            0x80b7c7,
            { metalness: 0.5, roughness: 0.2 }
        );

        // Golden entrance pillars

        for (const x of [-1.35, 1.35]) {

            this.addBox(
                this.hotel,
                x, 1.5, 2.65,
                0.18, 3, 0.18,
                0xc59a53,
                { metalness: 0.6 }
            );
        }

        // Entrance canopy

        this.addBox(
            this.hotel,
            0, 3.15, 3.1,
            3.6, 0.25, 1.4,
            0x59483c
        );

        this.addBox(
            this.hotel,
            0, 3.3, 3.1,
            3.7, 0.08, 1.45,
            0xc59a53,
            { metalness: 0.5 }
        );

        // Hotel name sign

        this.addBox(
            this.hotel,
            0, 3.65, 2.7,
            3, 0.45, 0.12,
            0xc59a53,
            { metalness: 0.5 }
        );

        // Steps

        this.addBox(
            this.hotel,
            0, 0.35, 3.3,
            3.5, 0.3, 1,
            0xaaa6a0
        );

        this.addBox(
            this.hotel,
            0, 0.2, 4,
            4.2, 0.2, 0.7,
            0xbcb7af
        );
    },

    // =================================
    // GARDEN
    // =================================

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

        this.addWorldBox(
            -5, 0.04, 0,
            2, 0.1, 5,
            0x66804b
        );

        this.addWorldBox(
            5, 0.04, 0,
            2, 0.1, 5,
            0x66804b
        );
    },

    // =================================
    // SWIMMING POOL
    // =================================

    createPool() {

        this.addWorldBox(
            -4.3, 0.16, -5.3,
            4.2, 0.25, 3.2,
            0xe5d8c0
        );

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

        for (let i = 0; i < 2; i++) {

            this.addWorldBox(
                -7 + i * 1.2,
                0.35,
                -2.7,
                0.8, 0.15, 1.5,
                0xd9c59f
            );
        }
    },

    // =================================
    // LIGHTING
    // =================================

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

    // =================================
    // CAMERA
    // =================================

    updateCamera() {

        const distance = this.cameraDistance;

        this.camera.position.set(
            Math.sin(this.rotation) * distance,
            3.5 + distance * 0.38,
            Math.cos(this.rotation) * distance
        );

        this.camera.lookAt(this.cameraTarget);
    },

    setupControls() {

        const canvas = this.renderer.domElement;

        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', event => {

            this.dragging = true;
            this.lastPointerX = event.clientX;

            canvas.setPointerCapture(event.pointerId);
        });

        canvas.addEventListener('pointermove', event => {

            if (!this.dragging) return;

            const deltaX =
                event.clientX - this.lastPointerX;

            this.rotation += deltaX * 0.006;

            this.lastPointerX = event.clientX;

            this.updateCamera();
        });

        const stopDragging = () => {
            this.dragging = false;
        };

        canvas.addEventListener('pointerup', stopDragging);
        canvas.addEventListener('pointercancel', stopDragging);
        canvas.addEventListener('lostpointercapture', stopDragging);

        canvas.addEventListener('wheel', event => {

            event.preventDefault();

            this.cameraDistance += event.deltaY * 0.025;

            this.cameraDistance = THREE.MathUtils.clamp(
                this.cameraDistance,
                this.cameraMinDistance,
                this.cameraMaxDistance
            );

            this.updateCamera();

        }, { passive: false });

        window.addEventListener('resize', () => {

            const container =
                document.getElementById('game-canvas');

            this.camera.aspect =
                container.clientWidth /
                container.clientHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(
                container.clientWidth,
                container.clientHeight
            );
        });
    },

    // =================================
    // ANIMATION
    // =================================

    animate() {

        requestAnimationFrame(() => this.animate());

        this.renderer.render(
            this.scene,
            this.camera
        );
    },

    // =================================
    // UI
    // =================================

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

    // =================================
    // BUSINESS
    // =================================

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

    // =================================
    // SAVE SYSTEM
    // =================================

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

window.Game = Game;

Game.init();
