// @refresh reset
// This component sets up a long-lived three.js scene inside a mount-only useEffect.
// Without this directive, React Fast Refresh would preserve the existing scene/controls
// while swapping in updated module code — leaving any new OrbitControls config (e.g.
// zoomToCursor / target clamping) un-applied until a full reload. The directive forces
// a clean remount of this component whenever its module changes.
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PlantSpec } from '../data/plantSpecs'

export interface PlacedPlant {
  uid: string
  specId: string
  /** X position in metres (world coord = X). */
  x: number
  /** Z position in metres (world coord = Z). */
  z: number
}

export type PlannerViewMode = 'iso' | 'top'

interface Props {
  gardenWidth: number
  gardenDepth: number
  placed: PlacedPlant[]
  specsById: Record<string, PlantSpec>
  pendingSpec: PlantSpec | null
  viewMode: PlannerViewMode
  /** Increment to programmatically reset/refit the camera. */
  resetSignal: number
  onPlace: (x: number, z: number) => void
  onRemove: (uid: string) => void
}

/**
 * Distance needed for a perspective camera (vertical fov in deg, viewport aspect = w/h)
 * to fit a garden of `width` × `depth` (metres) within the viewport.
 *
 * For an iso-ish view we look toward -z, so the visible horizontal extent is the garden width
 * and the visible vertical extent (after the tilt) is roughly the garden depth + some height
 * for taller plants. We compute the distance that fits both axes and pick the larger.
 */
function fitDistance(
  width: number,
  depth: number,
  aspect: number,
  fovDeg = 45,
  margin = 1.15,
): number {
  const fov = (fovDeg * Math.PI) / 180
  const halfV = Math.tan(fov / 2)
  const halfH = halfV * Math.max(0.001, aspect)
  const verticalNeeded = depth / 2
  const horizontalNeeded = width / 2
  const distV = verticalNeeded / halfV
  const distH = horizontalNeeded / halfH
  return Math.max(distV, distH) * margin
}

function applyView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  width: number,
  depth: number,
  aspect: number,
  mode: PlannerViewMode,
) {
  const dist = fitDistance(width, depth, aspect)
  // Aim slightly above the ground so a fully zoomed-out 3D view keeps the garden centred
  // (otherwise tall trees push the ground line below the centre of the canvas).
  const targetY = mode === 'top' ? 0 : 0.5
  controls.target.set(0, targetY, 0)
  if (mode === 'top') {
    camera.position.set(0, dist * 1.05, 0.0001)
  } else {
    camera.position.set(0, dist * 0.65, dist * 0.85)
  }
  camera.lookAt(controls.target)
  controls.minDistance = Math.max(2, dist * 0.3)
  controls.maxDistance = dist * 1.8
  controls.update()
}

/** Build a small scene-graph Object3D for one plant at the correct scale. */
function buildPlantMesh(spec: PlantSpec): THREE.Group {
  const group = new THREE.Group()

  const radius = Math.max(0.08, spec.matureWidth / 2)
  const height = Math.max(0.05, spec.matureHeight)

  if (spec.form === 'groundcover' || spec.form === 'climber') {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, Math.max(0.06, height), 24),
      new THREE.MeshStandardMaterial({ color: spec.canopyColor, roughness: 0.9 }),
    )
    disc.position.y = Math.max(0.03, height / 2)
    disc.castShadow = true
    disc.receiveShadow = true
    group.add(disc)
  } else if (spec.form === 'grass') {
    const clump = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.85, radius * 0.6, height, 16),
      new THREE.MeshStandardMaterial({ color: spec.canopyColor, roughness: 0.85 }),
    )
    clump.position.y = height / 2
    clump.castShadow = true
    clump.receiveShadow = true
    group.add(clump)
  } else {
    const trunkHeight = spec.form === 'tree' ? Math.min(height * 0.45, Math.max(0.8, height - radius)) : Math.min(0.4, height * 0.35)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(0.04, radius * 0.08), Math.max(0.05, radius * 0.1), trunkHeight, 12),
      new THREE.MeshStandardMaterial({ color: '#6b4a2b', roughness: 1 }),
    )
    trunk.position.y = trunkHeight / 2
    trunk.castShadow = true
    trunk.receiveShadow = true
    group.add(trunk)

    const canopyHeight = Math.max(0.3, height - trunkHeight)
    const canopyRadius = radius
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(canopyRadius, 20, 14),
      new THREE.MeshStandardMaterial({ color: spec.canopyColor, roughness: 0.8 }),
    )
    canopy.position.y = trunkHeight + canopyHeight / 2
    canopy.scale.y = canopyHeight / (canopyRadius * 2)
    canopy.castShadow = true
    canopy.receiveShadow = true
    group.add(canopy)
  }

  const footprint = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.98, radius, 48),
    new THREE.MeshBasicMaterial({ color: 0x2e7d32, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
  )
  footprint.rotation.x = -Math.PI / 2
  footprint.position.y = 0.02
  group.add(footprint)

  return group
}

function buildGhost(spec: PlantSpec): THREE.Mesh {
  const radius = Math.max(0.08, spec.matureWidth / 2)
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.02, 48),
    new THREE.MeshBasicMaterial({ color: spec.canopyColor, transparent: true, opacity: 0.45 }),
  )
  m.position.y = 0.01
  return m
}

export function GardenPlannerScene({
  gardenWidth,
  gardenDepth,
  placed,
  specsById,
  pendingSpec,
  viewMode,
  resetSignal,
  onPlace,
  onRemove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const plantsRootRef = useRef<THREE.Group | null>(null)
  const ghostRef = useRef<THREE.Mesh | null>(null)
  const rafRef = useRef<number | null>(null)

  const onPlaceRef = useRef(onPlace)
  const onRemoveRef = useRef(onRemove)
  const pendingSpecRef = useRef(pendingSpec)
  const gardenWidthRef = useRef(gardenWidth)
  const gardenDepthRef = useRef(gardenDepth)

  useLayoutEffect(() => {
    onPlaceRef.current = onPlace
    onRemoveRef.current = onRemove
    pendingSpecRef.current = pendingSpec
    gardenWidthRef.current = gardenWidth
    gardenDepthRef.current = gardenDepth
  })

  const plantUidMapRef = useRef<Map<THREE.Object3D, string>>(new Map())

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const initialWidth = gardenWidthRef.current
    const initialDepth = gardenDepthRef.current
    const plantUidMap = plantUidMapRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#eef5ea')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.15
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minPolarAngle = 0
    controls.screenSpacePanning = false
    controls.zoomToCursor = false
    controls.enablePan = true
    controls.target.set(0, 0, 0)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    controlsRef.current = controls

    // Keep the orbit target inside the garden bounds so zoom + pan can never push the
    // garden into a corner. If the user pans past the edge we shift the camera by the
    // same delta to preserve the current view direction.
    const clampTarget = () => {
      const hw = gardenWidthRef.current / 2
      const hd = gardenDepthRef.current / 2
      const t = controls.target
      const cx = Math.max(-hw, Math.min(hw, t.x))
      const cy = Math.max(0, Math.min(2, t.y))
      const cz = Math.max(-hd, Math.min(hd, t.z))
      const dx = cx - t.x
      const dy = cy - t.y
      const dz = cz - t.z
      if (dx !== 0 || dy !== 0 || dz !== 0) {
        t.set(cx, cy, cz)
        camera.position.x += dx
        camera.position.y += dy
        camera.position.z += dz
      }
    }
    controls.addEventListener('change', clampTarget)

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff6e0, 1.0)
    sun.position.set(20, 30, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -40
    sun.shadow.camera.right = 40
    sun.shadow.camera.top = 40
    sun.shadow.camera.bottom = -40
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 120
    scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(initialWidth, initialDepth),
      new THREE.MeshStandardMaterial({ color: '#c6d7a8', roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    groundRef.current = ground

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(initialWidth, initialDepth)),
      new THREE.LineBasicMaterial({ color: 0x2e7d32 }),
    )
    outline.rotation.x = -Math.PI / 2
    outline.position.y = 0.005
    scene.add(outline)

    const grid = new THREE.GridHelper(
      Math.max(initialWidth, initialDepth),
      Math.max(initialWidth, initialDepth),
      0x7aa06b,
      0xbfd6a8,
    )
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.55
    grid.position.y = 0.003
    scene.add(grid)
    gridRef.current = grid

    const plantsRoot = new THREE.Group()
    scene.add(plantsRoot)
    plantsRootRef.current = plantsRoot

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    let didInitialFit = false
    const resize = () => {
      if (!renderer || !camera) return
      const rect = el.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      renderer.setSize(w, h, true)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (!didInitialFit && w > 0 && h > 0) {
        applyView(
          camera,
          controls,
          gardenWidthRef.current,
          gardenDepthRef.current,
          camera.aspect,
          'iso',
        )
        didInitialFit = true
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const setPointerFromEvent = (evt: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1
    }

    const clampToGarden = (x: number, z: number): { x: number; z: number } => {
      const hw = gardenWidthRef.current / 2
      const hd = gardenDepthRef.current / 2
      return {
        x: Math.max(-hw + 0.05, Math.min(hw - 0.05, x)),
        z: Math.max(-hd + 0.05, Math.min(hd - 0.05, z)),
      }
    }

    const moveHandler = (evt: PointerEvent) => {
      setPointerFromEvent(evt)
      const g = groundRef.current
      const spec = pendingSpecRef.current
      if (!g || !spec) {
        if (ghostRef.current) ghostRef.current.visible = false
        return
      }
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(g, false)[0]
      if (!hit) {
        if (ghostRef.current) ghostRef.current.visible = false
        return
      }
      let ghost = ghostRef.current
      if (!ghost || ghost.userData.specId !== spec.id) {
        if (ghost) scene.remove(ghost)
        ghost = buildGhost(spec)
        ghost.userData.specId = spec.id
        scene.add(ghost)
        ghostRef.current = ghost
      }
      const { x, z } = clampToGarden(hit.point.x, hit.point.z)
      ghost.position.set(x, 0.005, z)
      ghost.visible = true
    }

    const clickHandler = (evt: PointerEvent) => {
      setPointerFromEvent(evt)
      raycaster.setFromCamera(pointer, camera)

      const plantHits = raycaster.intersectObjects(plantsRoot.children, true)
      if (plantHits.length > 0) {
        let obj: THREE.Object3D | null = plantHits[0].object
        const uidMap = plantUidMapRef.current
        while (obj && !uidMap.has(obj)) obj = obj.parent
        if (obj) {
          const uid = uidMap.get(obj)
          if (uid) {
            onRemoveRef.current(uid)
            return
          }
        }
      }

      const spec = pendingSpecRef.current
      if (!spec) return
      const g = groundRef.current
      if (!g) return
      const hit = raycaster.intersectObject(g, false)[0]
      if (!hit) return
      const { x, z } = clampToGarden(hit.point.x, hit.point.z)
      onPlaceRef.current(x, z)
    }

    renderer.domElement.addEventListener('pointermove', moveHandler)
    renderer.domElement.addEventListener('click', clickHandler)

    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointermove', moveHandler)
      renderer.domElement.removeEventListener('click', clickHandler)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else if (mesh.material) {
          ;(mesh.material as THREE.Material).dispose()
        }
      })
      plantUidMap.clear()
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      groundRef.current = null
      gridRef.current = null
      plantsRootRef.current = null
      ghostRef.current = null
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    const ground = groundRef.current
    const grid = gridRef.current
    if (!scene || !ground) return

    ground.geometry.dispose()
    ground.geometry = new THREE.PlaneGeometry(gardenWidth, gardenDepth)

    if (grid) scene.remove(grid)
    const newGrid = new THREE.GridHelper(
      Math.max(gardenWidth, gardenDepth),
      Math.max(2, Math.round(Math.max(gardenWidth, gardenDepth))),
      0x7aa06b,
      0xbfd6a8,
    )
    ;(newGrid.material as THREE.Material).transparent = true
    ;(newGrid.material as THREE.Material).opacity = 0.55
    newGrid.position.y = 0.003
    scene.add(newGrid)
    gridRef.current = newGrid

    const cam = cameraRef.current
    const ctrls = controlsRef.current
    if (cam && ctrls) applyView(cam, ctrls, gardenWidth, gardenDepth, cam.aspect, viewMode)
  }, [gardenWidth, gardenDepth, viewMode])

  useEffect(() => {
    const cam = cameraRef.current
    const ctrls = controlsRef.current
    if (!cam || !ctrls) return
    applyView(
      cam,
      ctrls,
      gardenWidthRef.current,
      gardenDepthRef.current,
      cam.aspect,
      viewMode,
    )
  }, [viewMode, resetSignal])

  useEffect(() => {
    const root = plantsRootRef.current
    if (!root) return
    while (root.children.length > 0) {
      const child = root.children.pop()
      if (child) {
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
          else if (mesh.material) (mesh.material as THREE.Material).dispose()
        })
      }
    }
    plantUidMapRef.current.clear()

    placed.forEach((p) => {
      const spec = specsById[p.specId]
      if (!spec) return
      const group = buildPlantMesh(spec)
      group.position.set(p.x, 0, p.z)
      root.add(group)
      plantUidMapRef.current.set(group, p.uid)
    })
  }, [placed, specsById])

  return (
    <div
      ref={containerRef}
      className="garden-planner-scene"
      role="presentation"
      style={{
        width: '100%',
        height: '520px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: '#eef5ea',
        cursor: pendingSpec ? 'crosshair' : 'grab',
      }}
    />
  )
}
