gsap.registerPlugin(ScrollTrigger);

// Loader
window.addEventListener('load', () => {
    gsap.to('#loader', {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            document.getElementById('loader').style.display = 'none';
        }
    });
});

// Enhanced Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Create raycaster for mouse interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(25, 50, 25);
scene.add(pointLight);

// Create geometries
const torusKnot = createTorusKnot();
const particles = createParticles();
const floatingItems = createFloatingItems();
scene.add(torusKnot, particles, ...floatingItems);

camera.position.z = 30;

// Geometry creation functions
function createTorusKnot() {
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff88,
        wireframe: true,
        emissive: 0x00ff88,
        emissiveIntensity: 0.2
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    return torusKnot;
}

function createParticles() {
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const posArray = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: 0x00ff88,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
}

function createFloatingItems() {
    const items = [];
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0)
    ];
    
    for(let i = 0; i < 15; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.7
        });
        const item = new THREE.Mesh(geometry, material);
        
        item.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        );
        item.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        item.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            originalPosition: item.position.clone(),
            originalScale: item.scale.clone()
        };
        items.push(item);
    }
    return items;
}

// Animation and interaction
let scrollPercent = 0;
window.addEventListener('scroll', () => {
    scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate torus knot
    torusKnot.rotation.x += 0.01;
    torusKnot.rotation.y += 0.01;
    
    // Animate particles
    particles.rotation.y += 0.001;
    
    // Animate floating items
    floatingItems.forEach((item, index) => {
        // Rotate
        item.rotation.x += item.userData.rotationSpeed.x;
        item.rotation.y += item.userData.rotationSpeed.y;
        item.rotation.z += item.userData.rotationSpeed.z;
        
        // Float movement
        const time = Date.now() * 0.001;
        const floatOffset = Math.sin(time + index) * 0.5;
        item.position.y = item.userData.originalPosition.y + floatOffset;
        
        // Scale based on mouse proximity
        raycaster.setFromCamera(mouse, camera);
        const intersection = raycaster.intersectObject(item);
        if(intersection.length > 0) {
            gsap.to(item.scale, {
                x: item.userData.originalScale.x * 1.5,
                y: item.userData.originalScale.y * 1.5,
                z: item.userData.originalScale.z * 1.5,
                duration: 0.3
            });
        } else {
            gsap.to(item.scale, {
                x: item.userData.originalScale.x,
                y: item.userData.originalScale.y,
                z: item.userData.originalScale.z,
                duration: 0.3
            });
        }
    });
    
    // Camera movement based on scroll
    camera.position.z = 30 + scrollPercent * 20;
    camera.rotation.y = scrollPercent * Math.PI * 2;
    
    renderer.render(scene, camera);
}
animate();

// Enhanced cursor
const cursorDot = document.getElementById('cursor-dot');
const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    
    cursorDot.style.transform = `translate(${posX - 4}px, ${posY - 4}px)`;
    
    gsap.to(cursor, {
        x: posX - 15,
        y: posY - 15,
        duration: 0.15
    });
});

document.querySelectorAll('a, button').forEach(item => {
    item.addEventListener('mouseenter', () => {
        cursor.style.width = '50px';
        cursor.style.height = '50px';
        cursorDot.style.opacity = '0';
    });
    
    item.addEventListener('mouseleave', () => {
        cursor.style.width = '30px';
        cursor.style.height = '30px';
        cursorDot.style.opacity = '1';
    });
});

// Theme toggle enhancement
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const newColor = document.body.classList.contains('light-mode') ? 0x00aa55 : 0x00ff88;
    
    // Update all 3D object colors
    torusKnot.material.color.setHex(newColor);
    torusKnot.material.emissive.setHex(newColor);
    particles.material.color.setHex(newColor);
    floatingItems.forEach(item => {
        item.material.color.setHex(newColor);
    });
});
// Initial animations
gsap.to('h1', {
    opacity: 1,
    y: 0,
    duration: 1,
    delay: 0.5
});

gsap.to('.hero p', {
    opacity: 1,
    y: 0,
    duration: 1,
    delay: 0.7
});

gsap.to('.cta-button', {
    opacity: 1,
    y: 0,
    duration: 1,
    delay: 0.9
});

// Scroll-triggered animations
gsap.utils.toArray('section').forEach(section => {
    gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1
        }
    });
});

// Project card hover effects
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            scale: 1.05,
            duration: 0.3
        });
    });
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            scale: 1,
            duration: 0.3
        });
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});