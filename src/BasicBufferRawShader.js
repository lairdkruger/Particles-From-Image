class BufferRawShader extends ThreeShell {
    constructor() {
        super();
        this.init();
    }

    init() {
        // geometry
        var triangles = 500;

        var geometry = new THREE.BufferGeometry();

        // vertices of triangle
        var vertices = new THREE.BufferAttribute(new Float32Array(triangles * 3), 3);

        //randomly distribute vertices
        for (var i = 0; i < vertices.count; i++) {
            vertices.setXYZ(i, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }

        //'position' is commonly used to describe vertex positions
        geometry.setAttribute('position', vertices);

        // colors of each triangle
        var colors = new THREE.BufferAttribute(new Float32Array(triangles * 4), 4);

        // randomly assign colors
        for (var i = 0; i < colors.count; i++) {
            colors.setXYZW(i, Math.random(), Math.random(), Math.random(), Math.random());
        }

        geometry.setAttribute('color', colors);

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

            // to pass to fragment shader
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
				color.r += sin( vPosition.x * 10.0 + time ) * 0.3;

				gl_FragColor = color;

			}
             `,
            side: THREE.DoubleSide,
            transparent: true

        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
        this.time += this.clock.getDelta();
        var object = this.scene.children[0];
        object.rotation.y = this.time * 0.5;

        this.updateUniforms();
        this.renderer.render(this.scene, this.camera);
    }

    updateUniforms() {
        this.mesh.material.uniforms.time.value = this.time;
    }

}