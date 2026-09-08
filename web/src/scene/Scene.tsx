import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'

const MODEL_URL = `${import.meta.env.BASE_URL}models/hamster-v2.glb`
const TAU = Math.PI * 2
const POINTER = { x: 0, y: 0 }
const smooth = (dt: number, speed = 4) => 1 - Math.exp(-speed * Math.min(dt, .05))

function Hamster({ reduced }: { reduced: boolean }) {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<THREE.Group>(null)
  const pet = useStore((s) => s.pet)
  const spin = useStore((s) => s.spin)
  const chapter = useStore((s) => s.chapter)
  const { invalidate } = useThree()
  const timer = useRef({ pet: -20, spin: -20, time: 0, previousPet: pet, previousSpin: spin })
  const { model, head, eyes, arms } = useMemo(() => {
    const model = scene.clone(true)
    model.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = false } })
    return { model, head: model.getObjectByName('Head'), eyes: [model.getObjectByName('Eye_L'), model.getObjectByName('Eye_R')], arms: [model.getObjectByName('Arm_L'), model.getObjectByName('Arm_R')] }
  }, [scene])
  useEffect(() => { invalidate() }, [pet, spin, chapter, invalidate])
  useFrame((_, dt) => {
    if (!group.current) return
    const state = timer.current
    state.time += Math.min(dt, .05)
    const t = state.time
    if (pet !== state.previousPet) { state.pet = t; state.previousPet = pet }
    if (spin !== state.previousSpin) { state.spin = t; state.previousSpin = spin }
    const petAge = t - state.pet, spinAge = t - state.spin
    const jump = petAge < 1.35 && !reduced ? Math.sin(Math.min(petAge / 1.35, 1) * Math.PI) * .32 : 0
    const turn = reduced ? (spin % 2) * Math.PI : spinAge < 2.4 ? THREE.MathUtils.smootherstep(spinAge / 2.4, 0, 1) * TAU : 0
    const story = reduced ? 0 : Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1)
    const baseTurn = -.14 + story * .3 + Math.max(chapter, 0) * .035
    group.current.rotation.y = baseTurn + turn
    group.current.position.y = .14 + jump + (reduced ? 0 : Math.sin(t * 1.7) * .014)
    const breath = reduced ? 1 : 1 + Math.sin(t * 1.7) * .004
    group.current.scale.set(1, breath, 1)
    if (head) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, reduced ? 0 : POINTER.x * .16, smooth(dt))
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, reduced ? 0 : -POINTER.y * .09, smooth(dt))
      head.rotation.z = petAge < 1.35 && !reduced ? Math.sin(petAge * 7) * .045 : 0
    }
    const blinkTime = t % 5.3
    const blink = !reduced && blinkTime > 5.1 ? 1 - Math.sin((blinkTime - 5.1) / .2 * Math.PI) * .94 : 1
    for (const eye of eyes) if (eye) { eye.scale.y = blink; eye.rotation.y = reduced ? 0 : POINTER.x * .08 }
    if (arms[0]) arms[0].rotation.z = petAge < 1.35 && !reduced ? .55 + Math.sin(petAge * 17) * .24 : 0
    if (arms[1]) arms[1].rotation.z = petAge < 1.35 && !reduced ? -.18 : 0
  })
  return <group ref={group} position={[0, .14, .35]} onClick={(event) => { event.stopPropagation(); useStore.getState().petHamster() }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}><primitive object={model} /></group>
}

function Portal({ night, reduced }: { night: boolean; reduced: boolean }) {
  const orbit = useRef<THREE.Group>(null)
  const portalMat = useRef<THREE.MeshStandardMaterial>(null)
  const target = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }, dt) => {
    if (orbit.current) orbit.current.rotation.z = reduced ? 0 : Math.sin(clock.elapsedTime * .2) * .035
    if (portalMat.current) { target.set(night ? '#688c74' : '#c4d4bc'); portalMat.current.color.lerp(target, reduced ? 1 : smooth(dt, 2)) }
  })
  return <>
    <group position={[0, 2.14, -.74]} rotation={[0, -.08, 0]}>
      <mesh castShadow receiveShadow><torusGeometry args={[2.23, .22, 24, 100]} /><meshStandardMaterial ref={portalMat} color="#c4d4bc" roughness={.32} metalness={.18} /></mesh>
      <mesh position={[0, 0, .06]}><torusGeometry args={[1.99, .018, 8, 100]} /><meshStandardMaterial color={night ? '#ffd795' : '#fff8e9'} emissive={night ? '#efac68' : '#fff8e9'} emissiveIntensity={night ? 2 : .3} /></mesh>
      <group ref={orbit}>{Array.from({ length: 24 }, (_, i) => {
        const a = i / 24 * TAU
        return <mesh key={i} position={[Math.sin(a) * 2.23, Math.cos(a) * 2.23, .222]} rotation={[0, 0, -a]}><boxGeometry args={[.014, i % 3 === 0 ? .12 : .045, .012]} /><meshStandardMaterial color="#65765d" roughness={.65} /></mesh>
      })}</group>
    </group>
    <mesh position={[0, -.025, 0]} receiveShadow castShadow><cylinderGeometry args={[2.45, 2.55, .25, 96]} /><meshStandardMaterial color="#b5c5aa" roughness={.65} /></mesh>
    <mesh position={[0, -.21, 0]} receiveShadow castShadow><cylinderGeometry args={[2.68, 2.72, .14, 96]} /><meshStandardMaterial color="#869e7f" roughness={.5} /></mesh>
    <mesh position={[0, -.135, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.51, .014, 6, 100]} /><meshStandardMaterial color="#f4dfb5" emissive="#eabb7d" emissiveIntensity={night ? .6 : 0} /></mesh>
    <mesh position={[0, -.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={night ? .16 : .12} /></mesh>
  </>
}

function Satellite({ type, position, color, reduced }: { type: 'idea' | 'code' | 'art'; position: [number, number, number]; color: string; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * .8 + position[0]) * .09
    ref.current.rotation.y = Math.sin(clock.elapsedTime * .35 + position[0]) * .15
  })
  return <group ref={ref} position={position} rotation={[.08, type === 'idea' ? -.35 : .2, type === 'idea' ? -.16 : .15]}>
    <RoundedBox args={[.7, .75, .2]} radius={.13} smoothness={3} castShadow><meshStandardMaterial color={color} roughness={.38} metalness={.12} /></RoundedBox>
    {type === 'idea' ? <group position={[0, .06, .14]}><mesh><sphereGeometry args={[.15, 24, 16]} /><meshStandardMaterial color="#fff4c9" roughness={.22} emissive="#fbc777" emissiveIntensity={.3} /></mesh><mesh position={[0, -.19, 0]}><cylinderGeometry args={[.075, .055, .12, 16]} /><meshStandardMaterial color="#fff4c9" /></mesh></group> : type === 'art' ? <group position={[0, 0, .14]}><mesh position={[.12, .13, 0]}><sphereGeometry args={[.075, 16, 12]} /><meshStandardMaterial color="#edb0ad" /></mesh><mesh rotation={[0, 0, .8]} position={[-.06, -.08, 0]}><boxGeometry args={[.24, .24, .055]} /><meshStandardMaterial color="#fff8e9" /></mesh></group> : <group position={[0, 0, .14]}>{[-1, 1].map((side) => <group key={side} position={[side * .15, 0, 0]} rotation={[0, 0, side < 0 ? 0 : Math.PI]}><mesh rotation={[0, 0, -.7]} position={[0, .06, 0]}><boxGeometry args={[.055, .19, .04]} /><meshStandardMaterial color="#fff8e9" /></mesh><mesh rotation={[0, 0, .7]} position={[0, -.06, 0]}><boxGeometry args={[.055, .19, .04]} /><meshStandardMaterial color="#fff8e9" /></mesh></group>)}</group>}
  </group>
}

function CameraRig({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const { camera, invalidate } = useThree()
  const pointer = useRef({ x: 0, y: 0 })
  const cameraTarget = useRef(new THREE.Vector3(0, 1.9, 0))
  const desired = useRef(new THREE.Vector3())
  useEffect(() => {
    const move = (e: PointerEvent) => { pointer.current.x = e.clientX / window.innerWidth * 2 - 1; pointer.current.y = e.clientY / window.innerHeight * 2 - 1; POINTER.x = pointer.current.x; POINTER.y = pointer.current.y }
    const scroll = () => { if (reduced) invalidate() }
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('scroll', scroll, { passive: true })
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scroll) }
  }, [invalidate, reduced])
  useFrame((_, dt) => {
    const progress = compact || reduced ? 0 : THREE.MathUtils.smoothstep(window.scrollY / window.innerHeight, 0, 1)
    desired.current.set(-.1 + progress * 1.25 + (reduced ? 0 : pointer.current.x * .18), 3.2 + progress * .4 - (reduced ? 0 : pointer.current.y * .1), compact ? 11.4 : 10.4)
    camera.position.lerp(desired.current, reduced ? 1 : smooth(dt, 3))
    camera.lookAt(cameraTarget.current)
  })
  return null
}

export default function Scene({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const night = useStore((s) => s.night)
  const key = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.HemisphereLight>(null)
  const { invalidate } = useThree()
  useEffect(() => { invalidate() }, [night, invalidate])
  useFrame((_, dt) => {
    const alpha = reduced ? 1 : smooth(dt, 2)
    if (key.current) key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, night ? 1.2 : 3.1, alpha)
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(fill.current.intensity, night ? .85 : 2, alpha)
  })
  return <>
    <hemisphereLight ref={fill} args={['#fff5e1', '#849e7e', 2]} />
    <directionalLight ref={key} castShadow position={[-3, 7, 5]} intensity={3.1} color="#fff1d9" shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-3} shadow-normalBias={.04} shadow-bias={-.0001} />
    <directionalLight position={[4, 4, -2]} intensity={night ? 3.4 : 2} color={night ? '#91d8c0' : '#fff8df'} />
    <pointLight position={[0, 3, 2]} intensity={night ? 7 : 1} color="#ffc98e" distance={9} />
    <Portal night={night} reduced={reduced} />
    <Hamster reduced={reduced} />
    <Satellite type="idea" position={[-2.28, 3.4, .4]} color="#ed9665" reduced={reduced} />
    <Satellite type="code" position={[2.25, 2.8, .6]} color="#809b90" reduced={reduced} />
    <Satellite type="art" position={[-2.05, 1, 1.25]} color="#b99fbc" reduced={reduced} />
    <CameraRig reduced={reduced} compact={compact} />
  </>
}
