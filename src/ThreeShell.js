class ThreeShell {
    /*
    class containing basic setup for threejs scenes
    tracks mouse coordinates if need be
    */
    constructor() {
        this.container = document.body;
        this.setup();
        this.addEventListeners();
    }

    setup() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio = window.devicePixelRatio;
        this.container.appendChild(this.renderer.domElement);

        this.canvas = this.renderer.domElement;

        // scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // camera
        // this.camera = new THREE.OrthographicCamera(this.width / - 100, this.width / 100, this.height / 100, this.height / -100, 0, 1000);
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);

        this.camera.position.set(0, 0, 5);

        // mouse
        this.mouse = new THREE.Vector3();
        this.mouse3D = new THREE.Vector3();


        // time
        this.time = 0;
        this.clock = new THREE.Clock();
    }

    addTestPlane() {
        this.geometry = new THREE.PlaneBufferGeometry(1.0, 1.0, 8, 8);
        this.material = new THREE.MeshBasicMaterial({ color: 'darkred' });
        this.cube = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.cube);
    }

    addEventListeners() {
        this.container.addEventListener(
            'mousemove',
            this._onMouseMove.bind(this),
            false
        )
    }

    _onMouseMove(event) {
        // get normalized mouse position on viewport
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        this.updateMouse3D();

        this.onMouseMove(event)

    }

    onMouseMove(event) { }

    updateMouse3D() {
        this.mouse.unproject(this.camera);
        this.mouse.sub(this.camera.position).normalize();
        var distance = - this.camera.position.z / this.mouse.z;
        // var distance = (targetZ - this.camera.position.z) / vec.z;

        this.mouse3D.copy(this.camera.position).add(this.mouse.multiplyScalar(distance));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    get viewSize() {
        // fit plane to screen
        // https://gist.github.com/ayamflow/96a1f554c3f88eef2f9d0024fc42940f

        let distance = this.camera.position.z;
        let vFov = (this.camera.fov * Math.PI) / 180;
        let height = 2 * Math.tan(vFov / 2) * distance;
        let width = height * window.innerWidth / window.innerHeight;
        return { width, height, vFov }
    }
}