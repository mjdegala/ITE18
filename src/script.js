import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import GUI from 'lil-gui'

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Parameters
 */
const parameters = {
    // Text
    text: 'MJ Degala',
    textSize: 0.5,
    textColor: '#ffffff',

    // Objects
    objectCount: 100,
    spread: 10,
    objectColor: '#ffffff',
    animateObjects: true,
    shapes: {
        'Donut': true,
        'Sphere': true,
        'Cube': true,
        'Pyramid': true,
        'Cone': false,
        'Octahedron': false,
        'Torus Knot': false
    },
    regenerate: () => createObjects(),

    // Look
    matcap: 'Bronze',
    wireframe: false
}

/**
 * Matcap textures
 */
const textureLoader = new THREE.TextureLoader()

function makeMatcap(stops) {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 128
    const ctx = c.getContext('2d')
    const gradient = ctx.createRadialGradient(48, 48, 8, 64, 64, 64)
    stops.forEach(([pos, color]) => gradient.addColorStop(pos, color))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
}

// Neutral grey matcap: best for colors, because the tint shows up true
const neutralTexture = makeMatcap([
    [0, '#ffffff'],
    [0.5, '#a8a8a8'],
    [1, '#2b2b2b']
])

// Bronze matcap: static/textures/matcaps/1.png, with a procedural fallback
let bronzeTexture = textureLoader.load(
    '/textures/matcaps/1.png',
    undefined,
    undefined,
    () => {
        bronzeTexture = makeMatcap([
            [0, '#f9ecd0'],
            [0.5, '#c78443'],
            [1, '#3b1c08']
        ])
        applyMatcap()
    }
)

/**
 * Materials (separate so text and objects can have different colors)
 */
const textMaterial = new THREE.MeshMatcapMaterial({ matcap: bronzeTexture })
const objectMaterial = new THREE.MeshMatcapMaterial({ matcap: bronzeTexture })

function applyMatcap() {
    const texture = parameters.matcap === 'Neutral' ? neutralTexture : bronzeTexture
    textMaterial.matcap = texture
    objectMaterial.matcap = texture
    textMaterial.needsUpdate = true
    objectMaterial.needsUpdate = true
}


/**
 * Shape geometries (created once and shared by all objects of that shape)
 */
const pyramidGeometry = new THREE.ConeGeometry(0.45, 0.7, 4)
pyramidGeometry.rotateY(Math.PI / 4)

const shapeGeometries = {
    'Donut': new THREE.TorusGeometry(0.3, 0.2, 20, 45),
    'Sphere': new THREE.SphereGeometry(0.4, 32, 32),
    'Cube': new THREE.BoxGeometry(0.6, 0.6, 0.6),
    'Pyramid': pyramidGeometry,
    'Cone': new THREE.ConeGeometry(0.35, 0.7, 32),
    'Octahedron': new THREE.OctahedronGeometry(0.4),
    'Torus Knot': new THREE.TorusKnotGeometry(0.25, 0.08, 100, 16)
}

/**
 * Objects
 */
let objects = []

function createObjects() {
    // Remove old objects (geometries are shared, so no dispose needed)
    objects.forEach((obj) => scene.remove(obj))
    objects = []

    const enabledShapes = Object.keys(parameters.shapes).filter((name) => parameters.shapes[name])
    if (enabledShapes.length === 0) return

    for (let i = 0; i < parameters.objectCount; i++) {
        const shapeName = enabledShapes[Math.floor(Math.random() * enabledShapes.length)]
        const mesh = new THREE.Mesh(shapeGeometries[shapeName], objectMaterial)

        mesh.position.x = (Math.random() - 0.5) * parameters.spread
        mesh.position.y = (Math.random() - 0.5) * parameters.spread
        mesh.position.z = (Math.random() - 0.5) * parameters.spread

        mesh.rotation.x = Math.random() * Math.PI
        mesh.rotation.y = Math.random() * Math.PI

        const scale = Math.random()
        mesh.scale.set(scale, scale, scale)

        mesh.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.4,
            rotSpeedY: (Math.random() - 0.5) * 0.4
        }

        objects.push(mesh)
        scene.add(mesh)
    }
}

/**
 * Text
 */
let font = null
let textMesh = null

function createText() {
    if (!font) return

    // Remove the old text
    if (textMesh) {
        scene.remove(textMesh)
        textMesh.geometry.dispose()
        textMesh = null
    }

    if (parameters.text.trim() === '') return

    const textGeometry = new TextGeometry(parameters.text, {
        font: font,
        size: parameters.textSize,
        height: 0.2,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    })
    textGeometry.center()

    textMesh = new THREE.Mesh(textGeometry, textMaterial)
    scene.add(textMesh)
}

const fontLoader = new FontLoader()
fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (loadedFont) => {
        font = loadedFont
        createText()
    },
    undefined,
    (error) => {
        console.error('Font failed to load. Check static/fonts/helvetiker_regular.typeface.json', error)
    }
)

createObjects()

/**
 * Debug UI
 */
const gui = new GUI({ title: 'Activity 1.11 - 3D Text' })

const textFolder = gui.addFolder('Text')
textFolder.add(parameters, 'text').name('Text (press Enter)').onFinishChange(createText)
textFolder.add(parameters, 'textSize').min(0.2).max(1.5).step(0.05).name('Size').onFinishChange(createText)
textFolder.addColor(parameters, 'textColor').name('Color').onChange((value) => {
    textMaterial.color.set(value)
})

const objectsFolder = gui.addFolder('Objects')
objectsFolder.add(parameters, 'objectCount').min(0).max(500).step(1).name('Amount').onChange(createObjects)
objectsFolder.add(parameters, 'spread').min(3).max(30).step(0.5).name('Spread').onChange(createObjects)
objectsFolder.addColor(parameters, 'objectColor').name('Color').onChange((value) => {
    objectMaterial.color.set(value)
})
objectsFolder.add(parameters, 'animateObjects').name('Animate')
objectsFolder.add(parameters, 'regenerate').name('Shuffle positions')

const shapesFolder = objectsFolder.addFolder('Shapes')
Object.keys(parameters.shapes).forEach((name) => {
    shapesFolder.add(parameters.shapes, name).onChange(createObjects)
})

const lookFolder = gui.addFolder('Look')
lookFolder.add(parameters, 'matcap', ['Bronze', 'Neutral']).name('Matcap').onChange(applyMatcap)
lookFolder.add(parameters, 'wireframe').name('Wireframe').onChange((value) => {
    textMaterial.wireframe = value
    objectMaterial.wireframe = value
})

/**
 * Sizes & Resizing
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Fullscreen on Double Click
 */
window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen()
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 3)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const startTime = performance.now()

const tick = () => {
    const elapsedTime = (performance.now() - startTime) / 1000

    if (textMesh) {
        textMesh.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2
    }

    if (parameters.animateObjects) {
        objects.forEach((obj) => {
            obj.rotation.x += obj.userData.rotSpeedX * 0.05
            obj.rotation.y += obj.userData.rotSpeedY * 0.05
        })
    }

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()