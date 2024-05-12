import * as THREE from 'three';
import RENDER_VERT from './shaders/render.vert';
import RENDER_FRAG from './shaders/render.frag';

export default class Renderer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        const geometry = new THREE.PlaneGeometry(2, 2);

        this.uniforms = {
            u_resolution: { value: new THREE.Vector2(width, height) }
        };
        
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: RENDER_VERT,
            fragmentShader: RENDER_FRAG
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        document.querySelector('#canvas-container').appendChild(this.renderer.domElement);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
