var container, stats;

var camera, scene, renderer;

init();
animate();

function init() {

    container = document.body;

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10);
    camera.position.z = 2;

    scene = new THREE.Scene();

    // geometry

    var triangles = 500;

    var geometry = new THREE.BufferGeometry();

    var vertices = new THREE.Float32Attribute(triangles * 3, 3);

    for (var i = 0; i < vertices.length; i++) {

        vertices.setXYZ(i, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

    }

    geometry.addAttribute('position', vertices);

    var colors = new THREE.Float32Attribute(triangles * 3, 4);

    for (var i = 0; i < colors.length; i++) {

        colors.setXYZW(i, Math.random(), Math.random(), Math.random(), Math.random());

    }

    geometry.addAttribute('color', colors);

    // material

    var material = new THREE.RawShaderMaterial({

        uniforms: {
            time: { type: "f", value: 1.0 }
        },
        vertexShader: `
            precision mediump float;
			precision mediump int;

			uniform mat4 modelViewMatrix; // optional
			uniform mat4 projectionMatrix; // optional

			attribute vec3 position;
			attribute vec4 color;

			varying vec3 vPosition;
			varying vec4 vColor;

			void main()	{

				vPosition = position;
				vColor = color;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
             `,
        fragmentShader: `
            precision mediump float;
			precision mediump int;

			uniform float time;

			varying vec3 vPosition;
			varying vec4 vColor;

			void main()	{

				vec4 color = vec4( vColor );
				color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

				gl_FragColor = color;

			}
             `,
        side: THREE.DoubleSide,
        transparent: true

    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x101010);
    container.appendChild(renderer.domElement);

    onWindowResize();

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize(event) {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    var time = performance.now();


    var object = scene.children[0];

    object.rotation.y = time * 0.0005;
    object.material.uniforms.time.value = time * 0.005;

    renderer.render(scene, camera);

}
