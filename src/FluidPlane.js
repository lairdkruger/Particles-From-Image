class FluidPlane extends ThreeShell {
    constructor() {
        super();
        this.init();
    }

    init() {
        this.canvas = this.renderer.domElement;

        // (width, height, wSegments, hSegments)
        // more segments: smoother mesh distortion
        this.geometry = new THREE.PlaneBufferGeometry(10.0, 10.0, 8, 8)
        this.uniforms = {
            uTime: {
                value: 0
            },
            uTexture: {
                value: null
            },
            uPreviousTexture: {
                value: null
            },
            uMixValue: {
                value: 0.0
            },
            uOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uAlpha: {
                value: 0.0
            }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
            void main() {
                gl_Position = projectionMatrix *
                            modelViewMatrix *
                            vec4(position,1.0);
            }
        `,
            fragmentShader: `
            void main() {
                gl_FragColor = vec4(0.5,  // R
                                    0.0,  // G
                                    0.0,  // B
                                    1.0); // A
            }
        `,
        })

        this.plane = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.plane)
    }
}