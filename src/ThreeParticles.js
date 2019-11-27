class ThreeParticles extends ThreeShell {
    constructor() {
        super();
        this.initImage();
    }

    initImage() {
        var _this = this;

        var planeTexture;
        var loaderPromise = new Promise(function (resolve, reject) {
            function loadDone(x) {
                resolve(x); // it went ok!
            }
            var loader = new THREE.TextureLoader();
            loader.load('/img/b.jpg', loadDone);
        });

        loaderPromise.
            then(function (response) {
                _this.texture = response; //assign loaded image data to a variable
                _this.texture.needsUpdate = true;

                initPlane(_this);
            }, function (err) {
                console.log(err);
            });

        function initPlane() {
            var planeGeometry = new THREE.PlaneGeometry(1, 1);
            // var planeTexture = new THREE.TextureLoader().load('../images/finger_print.png');
            var planeMaterial = new THREE.MeshBasicMaterial({ map: _this.texture });
            var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
            planeMesh.scale.x = _this.texture.image.width / 240;
            planeMesh.scale.y = _this.texture.image.height / 240;

            _this.imageTopLeft = [-_this.texture.image.width / 2, _this.texture.image.height / 2];
            _this.imageBottomRight = [_this.texture.image.width / 2, -_this.texture.image.height / 2];
            _this.imageBottomLeft = [-planeMesh.scale.x / 2, -planeMesh.scale.y / 2];

            _this.planeWidth = planeMesh.scale.x;
            _this.planeHeight = planeMesh.scale.y;

            // _this.scene.add(planeMesh);

            // particles only after image has been loaded
            _this.initParticles();
        }
    }


    initParticles() {
        // max 200 x 200
        // odd x odd (same numbers) for grid to be centered
        this.instancesPerRow = 150;
        this.instancesPerCol = 150;
        this.instances = this.instancesPerRow * this.instancesPerCol;

        this.squareSize = 0.005;

        // buffer geometry: instanced to efficiently redraw similar geometry multiple times
        const geometry = new THREE.InstancedBufferGeometry();
        geometry.maxInstancedCount = this.instances;

        // basic square vertex positions
        // buffer attribute (array containing value, values per element)
        // 4 sets of 3D points (x, y, z) making up a plane
        const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);

        // setXYZ(index, x, y, z)
        positions.setXYZ(0, -this.squareSize, this.squareSize, 0.0);
        positions.setXYZ(1, this.squareSize, this.squareSize, 0.0);
        positions.setXYZ(2, -this.squareSize, -this.squareSize, 0.0);
        positions.setXYZ(3, this.squareSize, -this.squareSize, 0.0);

        // standard attribute since this will be shared between instances
        geometry.setAttribute('position', positions);

        // uvs
        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0, 0.0, 0.0);
        uvs.setXYZ(1, 1.0, 0.0);
        uvs.setXYZ(2, 0.0, 1.0);
        uvs.setXYZ(3, 1.0, 1.0);

        // standard attribute since this will be shared between instances
        geometry.setAttribute('uv', uvs);

        // defines the two triangles that make up a square
        // allows repeated use of vertices shared between the triangles (efficient)
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));

        const indices = new Uint16Array(this.instances);
        const angles = new Float32Array(this.instances);
        const offsets = new Float32Array(this.instances * 3);
        const aUVs = new Float32Array(this.instances * 2);

        for (let i = 0; i < this.instances; i++) {
            indices[i] = i;
            angles[i] = Math.random() * Math.PI;
        }

        for (let i = 0; i < this.instancesPerRow; i++) {
            for (let j = 0; j < this.instancesPerCol; j++) {
                var index = (i * this.instancesPerRow) + j;

                // arrange squares over image
                offsets[index * 3 + 0] = this.map(i, 0, this.instancesPerRow - 1, this.squareSize, this.planeWidth - this.squareSize);
                offsets[index * 3 + 1] = this.map(j, 0, this.instancesPerCol - 1, this.squareSize, this.planeHeight - this.squareSize);

                offsets[index * 3 + 0] += this.imageBottomLeft[0];
                offsets[index * 3 + 1] += this.imageBottomLeft[1];

                aUVs[index * 2 + 0] = this.map(i, 0, this.instancesPerRow - 1, 0, 1);
                aUVs[index * 2 + 1] = this.map(j, 0, this.instancesPerCol - 1, 0, 1);
            }
        }

        // instanced buffer attributes since they vary between instances
        geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
        geometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));
        geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
        geometry.setAttribute('aUV', new THREE.InstancedBufferAttribute(aUVs, 2, false));

        const uniforms = {
            uTime: { value: 0 },
            uSineTime: { value: 0 },
            uRandomAmount: { value: 0.1 },
            uDepth: { value: 2.0 },
            uSize: { value: 0.0 },
            uTextureSize: { value: new THREE.Vector2(this.imgWidth, this.imgHeight) },
            uTexture: { value: this.texture },
            uTouch: { value: null },
            uMouse3D: { value: this.mouse3D }
        };

        // material
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
            // raw shader requires float definition 
            precision highp float;

            uniform float uTime;
            uniform vec2 uMouse3D;
            uniform float uRandomAmount;

            attribute float pindex;
            attribute vec3 offset;
            attribute vec2 aUV;

            vec3 vPosition;
            varying vec2 vUv;
            varying vec2 aUv;

            // Simplex 2D noise
            //
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                        dot(x12.zw,x12.zw)), 0.0);
                m = m * m;
                m = m * m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            float random (float i) {
                vec2 st = vec2(i, 0.5);
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float map(float value, float min1, float max1, float min2, float max2) {
                float returnvalue = ((value - min1) / (max1 - min1) * (max2 - min2)) + min2;
                return returnvalue;
            }

            void main() {
                vUv = uv;
                aUv = aUV;
                vPosition = position + offset;

                // vPosition.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5);
                float rndz = (random(pindex) + snoise(vec2(pindex * 0.1, uTime * 0.1)));
                vPosition.x += rndz * (random(pindex) * 2.0 * 1.0) / 100.0;
                vPosition.y += rndz * (random(pindex) * 2.0 * 1.0) / 100.0;
                vPosition.z += rndz * (random(pindex) * 2.0 * 1.0) / 20.0;

                gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
            }
             `,
            fragmentShader: `
            // raw shader requires float definition 
            precision highp float;

            varying vec2 vUv;
            varying vec2 aUv;

            uniform sampler2D uTexture;

            void main() {
                // pixel color
                vec4 colA = texture2D(uTexture, aUv);

                // greyscale
                float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
                vec4 colB = vec4(grey, grey, grey, 1.0);

                // circle
                float border = 0.3;
                float radius = 0.5;
                float dist = radius - distance(vUv, vec2(0.5));
                float t = smoothstep(0.0, border, dist);

                // final color
                vec4 color = colB;      // b & w
                // vec4 color = colA;   // color
                // color.a = t;         // circle

                gl_FragColor = vec4(color);
            }
             `,
            depthTest: false,
            transparent: true
        });

        this.particles = new THREE.Mesh(geometry, material);

        this.scene.add(this.particles);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
        this.updateUniforms();

        this.renderer.render(this.scene, this.camera);
    }

    updateUniforms() {
        // time
        var time = performance.now() / 100;
        this.particles.material.uniforms.uTime.value = time;
        this.particles.material.uniforms.uSineTime.value = (Math.sin(time) + 1) / 2;
    }

    map(value, min1, max1, min2, max2) {
        var returnvalue = ((value - min1) / (max1 - min1) * (max2 - min2)) + min2;
        return returnvalue;
    }
}