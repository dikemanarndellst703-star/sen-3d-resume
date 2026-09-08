import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei'
import type { MotionValue } from 'framer-motion'
import * as THREE from 'three'
import { CAMERA_POSES } from './cinematicTimeline'

const MODEL_URL = `${import.meta.env.BASE_URL}models/hamster-v4-clay.glb`
const POSITION = new THREE.Vector3()
const TARGET = new THREE.Vector3()
const POSITION_A = new THREE.Vector3()
const POSITION_B = new THREE.Vector3()
const TARGET_A = new THREE.Vector3()
const TARGET_B = new THREE.Vector3()
const damp = (dt: number, speed = 7) => 1 - Math.exp(-speed * Math.min(dt, .05))

function sample(progress: number) {
  let i = 0
  while (i < CAMERA_POSES.length - 2 && progress > CAMERA_POSES[i + 1].at) i++
  const a = CAMERA_POSES[i], b = CAMERA_POSES[i + 1]
  const alpha = THREE.MathUtils.smootherstep((progress - a.at) / (b.at - a.at), 0, 1)
  POSITION.lerpVectors(POSITION_A.fromArray(a.position), POSITION_B.fromArray(b.position), alpha)
  TARGET.lerpVectors(TARGET_A.fromArray(a.target), TARGET_B.fromArray(b.target), alpha)
  return THREE.MathUtils.lerp(a.yaw, b.yaw, alpha)
}

export default function CinematicWorld({ progress, reduced, compact, turn, onDrag }: { progress: MotionValue<number>; reduced: boolean; compact: boolean; turn: number; onDrag: () => void }) {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<THREE.Group>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.HemisphereLight>(null)
  const gesture = useRef({ active: false, start: 0, yaw: 0, current: 0, lastProgress: 0, turn: 0, resumeOnScroll: true })
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>()
  const holdUserView = useCallback(() => {
    gesture.current.resumeOnScroll = false
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => { gesture.current.resumeOnScroll = true }, 180)
  }, [])
  useEffect(() => () => clearTimeout(resumeTimer.current), [])
  const pointer = useRef({ x: 0, y: 0 })
  const { camera, invalidate, gl } = useThree()
  const model = useMemo(() => {
    const model = scene.clone(true)
    model.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return
      o.castShadow = false; o.receiveShadow = false
      // Lightweight interaction volumes handle pointer picking; display geometry stays intact.
      o.raycast = () => {}
      const materials = Array.isArray(o.material) ? o.material : [o.material]
      for (const material of materials) if (material instanceof THREE.MeshStandardMaterial) material.envMapIntensity = .8
    })
    return model
  }, [scene])
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = compact ? 36 : 30; camera.updateProjectionMatrix() }
    invalidate()
  }, [camera, compact, reduced, invalidate])
  useEffect(() => {
    const state = gesture.current
    if (turn !== state.turn) holdUserView()
    state.yaw += (turn - state.turn) * Math.PI / 2
    state.turn = turn
    invalidate()
  }, [turn, invalidate, holdUserView])
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth * 2 - 1
      pointer.current.y = e.clientY / window.innerHeight * 2 - 1
      if (!reduced && !compact) invalidate()
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => { window.removeEventListener('pointermove', onPointer); document.body.style.cursor = '' }
  }, [compact, reduced, invalidate])
  useEffect(() => progress.on('change', p => {
    const state = gesture.current
    // Let the current scroll settle after a user turn; the next scroll resumes the authored view.
    if (state.resumeOnScroll && Math.abs(p - state.lastProgress) > .0003 && !state.active) state.yaw = 0
    state.lastProgress = p
    if (!state.resumeOnScroll) holdUserView()
    if (!reduced) invalidate()
  }), [progress, reduced, invalidate, holdUserView])
  useEffect(() => {
    // R3F v8 clears internal capture on cancellation without forwarding onPointerCancel.
    const reset = () => { gesture.current.active = false; document.body.style.cursor = '' }
    const canvas = gl.domElement
    canvas.addEventListener('pointercancel', reset)
    canvas.addEventListener('lostpointercapture', reset)
    window.addEventListener('blur', reset)
    return () => {
      canvas.removeEventListener('pointercancel', reset)
      canvas.removeEventListener('lostpointercapture', reset)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [gl])
  useFrame((_, delta) => {
    const p = reduced ? 0 : THREE.MathUtils.clamp(progress.get(), 0, 1)
    const yaw = sample(p)
    const state = gesture.current
    state.current = reduced ? state.yaw : THREE.MathUtils.lerp(state.current, state.yaw, damp(delta, 8))
    if (group.current) group.current.rotation.y = yaw + state.current
    // The supplied model is one fused sculpture: redraw only while interaction settles.
    if (!reduced && Math.abs(state.current - state.yaw) > .00005) invalidate()
    if (compact) {
      const close = THREE.MathUtils.smoothstep(p, .16, .29) * (1 - THREE.MathUtils.smoothstep(p, .42, .54))
      POSITION.set(THREE.MathUtils.lerp(.9, -.4, close), THREE.MathUtils.lerp(3.2, 3.7, close), THREE.MathUtils.lerp(12.5, 8.5, close))
      TARGET.set(0, 3.25, .1)
    }
    if (!reduced && !compact) { POSITION.x += pointer.current.x * .025; POSITION.y -= pointer.current.y * .015 }
    camera.position.copy(POSITION)
    camera.lookAt(TARGET)
    const studioNight = THREE.MathUtils.smoothstep(p, .17, .28) * (1 - THREE.MathUtils.smoothstep(p, .69, .80))
    if (key.current) key.current.intensity = THREE.MathUtils.lerp(2.2, .8, studioNight)
    if (rim.current) rim.current.intensity = THREE.MathUtils.lerp(.7, 3.6, studioNight)
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(1.15, .28, studioNight)

  })
  function start(event: ThreeEvent<PointerEvent>) {
    if (event.pointerType === 'touch') return
    event.stopPropagation()
    holdUserView()
    gesture.current.active = true; gesture.current.start = event.clientX
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    document.body.style.cursor = 'grabbing'
  }
  function move(event: ThreeEvent<PointerEvent>) {
    if (!gesture.current.active) return
    event.stopPropagation()
    gesture.current.yaw += (event.clientX - gesture.current.start) * .009
    gesture.current.start = event.clientX
    holdUserView()
    onDrag(); invalidate()
  }
  function stop(event: ThreeEvent<PointerEvent>) {
    gesture.current.active = false
    holdUserView()
    if ((event.target as HTMLElement).hasPointerCapture?.(event.pointerId)) (event.target as HTMLElement).releasePointerCapture(event.pointerId)
    document.body.style.cursor = ''
  }
  return <>
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[-4, 5, 5]} scale={[4, 7, 1]} rotation={[0, -.5, 0]} />
      <Lightformer form="rect" intensity={1.3} position={[5, 3, 2]} scale={[2, 6, 1]} rotation={[0, .8, 0]} />
      <Lightformer form="rect" intensity={2.8} position={[0, 5, -4]} scale={[5, 2, 1]} rotation={[0, Math.PI, 0]} />
    </Environment>
    <hemisphereLight ref={fill} args={['#ffffff', '#8b8a82', 1.15]} />
    <directionalLight ref={key} position={[-3, 5, 6]} intensity={2.2} color="#fff6ed" />
    <directionalLight ref={rim} position={[4, 4, -3]} intensity={.7} color="#ffe1c7" />
    <directionalLight position={[-4, 2, -2]} intensity={.35} color="#d2ddf4" />
    <group ref={group} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onPointerOver={() => { if (!compact) document.body.style.cursor = 'grab' }} onPointerOut={() => { if (!gesture.current.active) document.body.style.cursor = '' }}>
      <primitive object={model} />
      <mesh position={[0, 2.5, .25]} scale={[1.4, 1.05, 1.3]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} /></mesh>
      <mesh position={[0, 1.05, -.05]} scale={[1.25, 1, 1.3]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} /></mesh>
    </group>
    <ContactShadows position={[0, -.015, 0]} opacity={.28} scale={10} blur={2.8} far={5} resolution={256} frames={1} color="#292722" />
  </>
}
