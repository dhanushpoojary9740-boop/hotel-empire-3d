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
    interior: null,
    interiorMode: false,

    rotation: 0.55,
    cameraDistance: 44,
    dragging: false,
    lastPointerX: 0,

    cameraTarget: new THREE.Vector3(0, 9, 0),

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

    // MATERIAL AND BOX SYSTEM

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
            new THREE.CylinderGeometry(
                radius, radius, height, 20
            ),
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

        // Large hotel property platform

        this.box(
            this.exterior,
            0, 0.05, 0,
            30, 0.5, 26,
            0x898985
        );

        // Driveway

        this.box(
            this.exterior,
            0, 0.32, 11,
            23, 0.08, 3,
            0x565c60
        );
    },

    // HOTEL WINDOW

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
            0xc5a267,
            { metalness: 0.55 }
        );

        this.box(
            parent, x, y, z + 0.13,
            width - 0.12, 0.045, 0.035,
            0xc5a267,
            { metalness: 0.55 }
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
            x + side * 0.09,
            y, z,
            0.045, 1.13, 1.13,
            0x28536a,
            { metalness: 0.45, roughness: 0.2 }
        );
    },

    // BALCONY

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
                parent,
                x + offset,
                y - 0.15,
                z + 1.3,
                0.08, 0.82, 0.12,
                0xc6a05e
            );
        }
    },

    // MASSIVE HOTEL

    createHotel() {
        this.hotel = new THREE.Group();
        this.exterior.add(this.hotel);

        const floors = 10;
        const floorHeight = 2.25;
        const height = floors * floorHeight;

        // Main tower

        this.box(
            this.hotel,
            0, height / 2 + 0.3, 0,
            13, height, 8,
            0xe8dcc4
        );

        // Left and right hotel wings

        for (const side of [-1, 1]) {
            this.box(
                this.hotel,
                side * 8.2,
                6.9,
                -0.2,
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

        // Floor separation lines

        for (let floor = 1; floor < floors; floor++) {
            this.box(
                this.hotel,
                0,
                floor * floorHeight + 0.3,
                0,
                13.15, 0.12, 8.15,
                0xb38c56
            );
        }

        // Front and back windows

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
                    this.addBalcony(
                        this.hotel, x, y, 4.05
                    );
                }
            }
        }

        // Side windows

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

        // Luxury rooftop

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

        // Grand entrance structure

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
            { metalness: 0.45, roughness: 0.2 }
        );

        // Entrance gold pillars

        for (const x of [-2.8, 2.8]) {
            this.box(
                this.hotel,
                x, 2.2, 4.65,
                0.3, 4.3, 0.35,
                0xc7a05d,
                { metalness: 0.6 }
            );
        }

        // Grand entrance canopy

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
            0xd2ad6c,
            { metalness: 0.4 }
        );

        // Entrance steps

        for (let i = 0; i < 3; i++) {
            this.box(
                this.hotel,
                0,
                0.35 + i * 0.12,
                5.6 + i * 0.7,
                7 + i * 0.5,
                0.25,
                0.8,
                0xd0c5b2
            );
        }

        // Side entrance pillars

        for (const x of [-5.5, 5.5]) {
            this.cylinder(
                this.hotel,
                x, 2.5, 4.7,
                0.25, 4.5,
                0xe0d4bd
            );
        }
    },

    // LUXURY LOBBY INTERIOR

    createInterior() {
        this.interior = new THREE.Group();
        this.scene.add(this.interior);

        // Lobby dimensions

        const width = 15;
        const depth = 12;
        const height = 8;

        // Marble floor

        this.box(
            this.interior,
            0, 0, 0,
            width, 0.25, depth,
            0xd8d0c2,
            { roughness: 0.2, metalness: 0.12 }
        );

        // Gold floor border

        this.box(
            this.interior,
            0, 0.14, -5.65,
            14.5, 0.06, 0.12,
            0xc5a15e,
            { metalness: 0.6 }
        );

        // Back and side walls

        this.box(
            this.interior,
            0, height / 2, -6,
            width, height, 0.3,
            0x302b2a
        );

        this.box(
            this.interior,
            -7.5, height / 2, 0,
            0.3, height, depth,
            0x39312d
        );

        this.box(
            this.interior,
            7.5, height / 2, 0,
            0.3, height, depth,
            0x39312d
        );

        // Decorative wall panels

        for (let x = -5; x <= 5; x += 2.5) {
            this.box(
                this.interior,
                x, 3.8, -5.78,
                1.8, 5.5, 0.08,
                0x614936
            );

            this.box(
                this.interior,
                x, 3.8, -5.7,
                0.06, 5.3, 0.05,
                0xd0ad6b,
                { metalness: 0.5 }
            );
        }

        // Reception desk

        this.box(
            this.interior,
            0, 1.1, -3.8,
            6.5, 1.8, 1.3,
            0x50372c
        );

        this.box(
            this.interior,
            0, 2.05, -3.8,
            6.7, 0.15, 1.45,
            0xc9a362,
            { metalness: 0.55 }
        );

        // Reception front panel

        this.box(
            this.interior,
            0, 1.1, -3.1,
            5.8, 1.25, 0.08,
            0x94734c
        );

        // Gold reception details

        for (const x of [-2.7, 2.7]) {
            this.box(
                this.interior,
                x, 1.1, -3.03,
                0.08, 1.3, 0.08,
                0xe3bd75
            );
        }

        // Reception computers

        for (const x of [-1.7, 1.7]) {
            this.box(
                this.interior,
                x, 2.3, -3.8,
                0.8, 0.08, 0.55,
                0x202b30
            );
        }

        // Luxury sofas

        for (const x of [-4.5, 4.5]) {
            this.box(
                this.interior,
                x, 0.75, 1.2,
                3.2, 0.55, 1.25,
                0xb58d70
            );

            this.box(
                this.interior,
                x, 1.35, 1.55,
                3.2, 0.9, 0.35,
                0x8f6a56
            );

            for (const offset of [-1.35, 1.35]) {
                this.box(
                    this.interior,
                    x + offset, 1.1, 1.2,
                    0.35, 0.85, 1.3,
                    0x765747
                );
            }
        }

        // Coffee tables

        this.box(
            this.interior,
            0, 0.7, 1.2,
            2.5, 0.15, 1.2,
            0x9c754d,
            { metalness: 0.25 }
        );

        // Decorative columns

        for (const x of [-6, -3, 3, 6]) {
            this.cylinder(
                this.interior,
                x, 3.8, 4.5,
                0.3, 7.5,
                0xcbb99b
            );

            this.cylinder(
                this.interior,
                x, 7.55, 4.5,
                0.48, 0.25,
                0xc5a15e
            );

            this.cylinder(
                this.interior,
                x, 0.25, 4.5,
                0.48, 0.25,
                0xc5a15e
            );
        }

        // Elevators

        for (const x of [-5, 5]) {
            this.box(
                this.interior,
                x, 2.3, -5.55,
                2, 4.4, 0.15,
                0x9b9d9b,
                { metalness: 0.65 }
            );

            this.box(
                this.interior,
                x, 2.3, -5.43,
                1.7, 4.1, 0.06,
                0x42616c,
                { metalness: 0.5 }
            );

            this.box(
                this.interior,
                x, 4.6, -5.35,
                0.7, 0.12, 0.06,
                0xc7a15e
            );
        }

        // Chandelier ceiling fixtures

        for (const x of [-4, 0, 4]) {
            this.cylinder(
                this.interior,
                x, 7.7, -0.5,
                0.045, 0.5,
                0xc5a15e
            );

            this.sphere(
                this.interior,
                x, 7.35, -0.5,
                0.38,
                0xf5d58b
            );
        }

        // Indoor plants

        for (const x of [-6.5, 6.5]) {
            this.cylinder(
                this.interior,
                x, 0.5, 3,
                0.55, 1,
                0x76523a
            );

            this.sphere(
                this.interior,
                x, 1.8, 3,
                0.85,
                0x397348
            );
        }

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

    // SWIMMING POOL

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

        const lobbyLight = new THREE.PointLight(
            0xffd69a, 35, 25
        );

        lobbyLight.position.set(0, 6, 0);
        this.interior.add(lobbyLight);
    },

    // CAMERA

    updateCamera() {
        if (this.interiorMode) {
            this.camera.position.set(0, 5.2, 11.5);
            this.camera.lookAt(0, 3.2, -2);
            return;
        }

        this.camera.position.set(
            Math.sin(this.rotation) * this.cameraDistance,
            12 + this.cameraDistance * 0.25,
            Math.cos(this.rotation) * this.cameraDistance
        );

        this.camera.lookAt(this.cameraTarget);
    },

    // VIEW SWITCHER

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
            cursor:pointer;
        `;

        button.onclick = () => {
            this.toggleInterior();
            button.textContent = this.interiorMode
                ? '🏨 Hotel Exterior'
                : '🏛️ Enter Lobby';
        };

        container.appendChild(button);
    },

    toggleInterior() {
        this.interiorMode = !this.interiorMode;

        this.hotel.visible = !this.interiorMode;
        this.exterior.visible = !this.interiorMode;
        this.interior.visible = this.interiorMode;

        this.cameraTarget.set(0, 3.2, 0);
        this.updateCamera();
    },

    // CAMERA CONTROLS

    setupControls() {
        const canvas = this.renderer.domElement;

        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', event => {
            this.dragging = true;
            this.lastPointerX = event.clientX;

            canvas.setPointerCapture(event.pointerId);
        });

        canvas.addEventListener('pointermove', event => {
            if (!this.dragging || this.interiorMode) return;

            const deltaX = event.clientX - this.lastPointerX;

            this.rotation += deltaX * 0.005;
            this.lastPointerX = event.clientX;

            this.updateCamera();
        });

        const stop = () => {
            this.dragging = false;
        };

        canvas.addEventListener('pointerup', stop);
        canvas.addEventListener('pointercancel', stop);
        canvas.addEventListener('lostpointercapture', stop);

        canvas.addEventListener('wheel', event => {
            if (this.interiorMode) return;

            event.preventDefault();

            this.cameraDistance = THREE.MathUtils.clamp(
                this.cameraDistance + event.deltaY * 0.03,
                29,
                55
            );

            this.updateCamera();
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

        this.renderer.render(
            this.scene,
            this.camera
        );
    },

    // USER INTERFACE

    updateUI() {
        const coins = document.getElementById('coins');
        const gems = document.getElementById('gems');
        const name = document.getElementById('hotel-name');

        if (coins) coins.textContent =
            this.coins.toLocaleString('en-IN');

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
