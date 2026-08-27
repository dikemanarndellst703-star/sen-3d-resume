import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/ai-hamster.glb`
useGLTF.preload(MODEL_URL)

const POSES = [
  { at: 0, position: new THREE.Vector3(0, 2.2, 9.6), target: new THREE.Vector3(0, 0.3, 0) },
  { at: 0.18, position: new THREE.Vector3(-2.4, 2.7, 8.2), target: new THREE.Vector3(0, 0.15, 0) },
  { at: 0.36, position: new THREE.Vector3(2.5, 1.8, 7.8), target: new THREE.Vector3(0, 0.05, 0) },
  { at: 0.54, position: new THREE.Vector3(-2.2, 3.1, 8.4), target: new THREE.Vector3(0, 0.35, 0) },
  { at: 0.71, position: new THREE.Vector3(2.3, 2.4, 8), target: new THREE.Vector3(0, 0.2, 0) },
  { at: 0.86, position: new THREE.Vector3(-1.3, 1.7, 8.8), target: new THREE.Vector3(0, 0.1, 0) },
  { at: 1, position: new THREE.Vector3(0, 2.5, 10.8), target: new THREE.Vector3(0, 0.2, 0) },
]

function samplePose(progress: number, outPosition: THREE.Vector3, outTarget: THREE.Vector3) {
  const p = THREE.MathUtils.clamp(progress, 0, 1)
  let index = 0
  while (index < POSES.length - 2 && p > POSES[index + 1].at) index += 1
  const a = POSES[index]
  const b = POSES[index + 1]
  const local = THREE.MathUtils.smoothstep((p - a.at) / Math.max(0.001, b.at - a.at), 0, 1)
  outPosition.lerpVectors(a.position, b.position, local)
  outTarget.lerpVectors(a.target, b.target, local)
}

function Hamster() {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<THREE.Group>(null)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  useFrame(({ clock }) => {
    if (!group.current) return
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const progress = THREE.MathUtils.clamp(window.scrollY / max, 0, 1)
    const idle = Math.sin(clock.elapsedTime * 1.25) * 0.025
    group.current.position.y = -2.38 + idle
    group.current.rotation.y = -Math.PI / 2 + Math.sin(progress * Math.PI * 5) * 0.14 + Math.sin(clock.elapsedTime * 0.35) * 0.025
  })

  return (
    <group ref={group} position={[0, -2.38, 0]} rotation={[0, -Math.PI / 2, 0]} scale={4.8}>
      <primitive object={model} />
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  useFrame((_, delta) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const progress = THREE.MathUtils.clamp(window.scrollY / max, 0, 1)
    samplePose(progress, desiredPosition.current, desiredTarget.current)

    const mobile = window.innerWidth <= 640
    if (mobile) {
      desiredPosition.current.z += 3.2
      desiredPosition.current.x -= 0.7
    } else {
      desiredPosition.current.x += pointer.current.x * 0.32
      desiredPosition.current.y -= pointer.current.y * 0.2
    }

    const damping = 1 - Math.pow(0.001, delta)
    camera.position.lerp(desiredPosition.current, damping)
    lookTarget.current.lerp(desiredTarget.current, damping)
    camera.lookAt(lookTarget.current)
  })

  return null
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#c8af90']} />
      <fog attach="fog" args={['#c8af90', 12, 28]} />
      <ambientLight intensity={1.55} color="#fff3df" />
      <hemisphereLight args={['#fff4df', '#513e30', 1.4]} />
      <directionalLight
        castShadow position={[-5, 9, 7]} intensity={3.1} color="#fff0d2"
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      />
      <spotLight position={[6, 6, 4]} intensity={18} angle={0.48} penumbra={0.8} color="#e96e55" />
      <Hamster />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent opacity={0.2} color="#4d392c" />
      </mesh>
      <CameraRig />
    </>
  )
}
