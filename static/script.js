let scene, camera, renderer, planeMesh;
const imageContainer = document.getElementById("imageContainer");
const imageElement = document.getElementById("myImage");

let currentState = { mousePosition: { x: 0, y: 0 }, waveIntensity: 0.005 };
let targetState = { mousePosition: { x: 0, y: 0 }, waveIntensity: 0.005 };

const ANIMATION_CONFIG = {
    transitionSpeed: 0.03,
    baseIntensity: 0.005,
    hoverIntensity: 0.009
};

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_intensity;
    uniform sampler2D u_texture;
    varying vec2 vUv;

    void main() {
        vec2 uv = vUv;
        float wave1 = sin(uv.x * 10.0 + u_time * 0.5 + u_mouse.x * 5.0) * u_intensity;
        float wave2 = sin(uv.y * 12.0 + u_time * 0.8 + u_mouse.y * 4.0) * u_intensity;
        float wave3 = cos(uv.x * 8.0 + u_time * 0.5 + u_mouse.x * 3.0) * u_intensity;
        float wave4 = cos(uv.y * 9.0 + u_time * 0.7 + u_mouse.y * 3.5) * u_intensity;

        uv.y += wave1 + wave2;
        uv.x += wave3 + wave4;
        
        gl_FragColor = texture2D(u_texture, uv);
    }
`;

function initializeScene(texture) {
    camera = new THREE.PerspectiveCamera(
        75,
        imageContainer.offsetWidth / imageContainer.offsetHeight,
        0.1,
        1000
    );
    camera.position.z = 1;

    scene = new THREE.Scene();

    const shaderUniforms = {
        u_time: { type: "f", value: 1.0 },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        u_intensity: { type: "f", value: currentState.waveIntensity },
        u_texture: { type: "t", value: texture }
    };

    planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
            uniforms: shaderUniforms,
            vertexShader,
            fragmentShader
        })
    );

    scene.add(planeMesh);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(imageContainer.offsetWidth, imageContainer.offsetHeight);

    imageContainer.appendChild(renderer.domElement);
}

function animateScene() {
    requestAnimationFrame(animateScene);

    currentState.mousePosition.x = updateValue(
        targetState.mousePosition.x,
        currentState.mousePosition.x,
        ANIMATION_CONFIG.transitionSpeed
    );

    currentState.mousePosition.y = updateValue(
        targetState.mousePosition.y,
        currentState.mousePosition.y,
        ANIMATION_CONFIG.transitionSpeed
    );

    currentState.waveIntensity = updateValue(
        targetState.waveIntensity,
        currentState.waveIntensity,
        ANIMATION_CONFIG.transitionSpeed
    );

    const uniforms = planeMesh.material.uniforms;

    uniforms.u_intensity.value = currentState.waveIntensity;
    uniforms.u_time.value += 0.005;
    uniforms.u_mouse.value.set(currentState.mousePosition.x, currentState.mousePosition.y);

    renderer.render(scene, camera);
}

function updateValue(targetState, current, transitionSpeed) {
    return current + (targetState - current) * transitionSpeed;
}

function handleMouseMove(event) {
    const rect = imageContainer.getBoundingClientRect();
    targetState.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    targetState.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleMouseOver() {
    targetState.waveIntensity = ANIMATION_CONFIG.hoverIntensity;
}

function handleMouseOut() {
    targetState.waveIntensity = ANIMATION_CONFIG.baseIntensity;
    targetState.mousePosition = { x: 0, y: 0 };
}

// Load the SVG as a texture
const loader = new THREE.TextureLoader();
loader.load(imageElement.src, (texture) => {
    initializeScene(texture);
    animateScene();

    imageContainer.addEventListener("mousemove", handleMouseMove, false);
    imageContainer.addEventListener("mouseover", handleMouseOver, false);
    imageContainer.addEventListener("mouseout", handleMouseOut, false);

    // Hide the original image
    imageElement.style.display = 'none';
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = imageContainer.offsetWidth / imageContainer.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(imageContainer.offsetWidth, imageContainer.offsetHeight);
});