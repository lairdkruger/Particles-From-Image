class InstancedBufferRawShader extends ThreeShell {
    constructor() {
        super();
        this.init();
    }

    init() {
        // geometry
        // stable upto around 50,000
        var instances = 500;

        var positions = [];
        var offsets = [];
        var colors = [];

        // basic triangle vertex positions
        var triangleSize = 0.5;
        positions.push(triangleSize, - triangleSize, 0);
        positions.push(- triangleSize, triangleSize, 0);
        positions.push(0, 0, triangleSize);

        // instanced attributes
        for (var i = 0; i < instances; i++) {
            // offsets (location)
            offsets.push(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

            // colors
            colors.push(Math.random(), Math.random(), Math.random(), Math.random());
        }

        var geometry = new THREE.InstancedBufferGeometry();
        // how many instances are drawn out of the full array
        geometry.maxInstancedCount = instances;

        // standard attribute since all instances share this
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // instanced attributes since these vary between instances
        geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
        geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));

        // material
        var material = new THREE.RawShaderMaterial({
            uniforms: {
                time: { type: 'f', value: 1.0 },
                sineTime: { type: 'f', value: 1.0 }
            },
            vertexShader: `
            // raw shader requires float definition 
            precision highp float;

            // raw shader requires these to be defined manually 
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            uniform float sineTime;

            attribute vec3 position;
            attribute vec3 offset;
            attribute vec4 color;

            varying vec3 vPosition;
            varying vec4 vColor;

            void main(){

                // position: basic triangle + offset location
                vPosition = position + offset;

                // enables color value to be passed to fragment shader
                vColor = color;

                gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
            }
             `,
            fragmentShader: `
            // raw shader requires float definition 
            precision highp float;

            uniform float time;

            varying vec3 vPosition;
            varying vec4 vColor;

            void main() {

                vec4 color = vec4( vColor );
                color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

                gl_FragColor = color;
            }
             `,
            side: THREE.DoubleSide,
            transparent: true

        });

        var mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
        var time = performance.now();

        var object = this.scene.children[0];

        object.rotation.y = time * 0.0005;
        object.material.uniforms.time.value = time * 0.005;
        object.material.uniforms.sineTime.value = Math.sin(object.material.uniforms.time.value * 0.05);

        this.renderer.render(this.scene, this.camera);
    }

}