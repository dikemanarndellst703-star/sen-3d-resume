/** Normalized scroll anchors shared by the camera, chapter navigation and capture scripts. */
export const CHAPTERS = [
  { at: 0, label: '初见', english: 'MEET YOUR POSSIBILITY' },
  { at: .30, label: '看见', english: 'LOOK A LITTLE CLOSER' },
  { at: .57, label: '探索', english: 'MADE FOR THE CURIOUS' },
  { at: .85, label: '出发', english: 'YOUR NEXT CHAPTER' },
]

export const CAMERA_POSES = [
  { at: 0, position: [1.8, 2.7, 9.4], target: [-1.4, 1.85, 0], yaw: -.10 },
  { at: .13, position: [1.4, 2.6, 9.2], target: [-1.35, 1.9, 0], yaw: .02 },
  { at: .30, position: [-.45, 2.7, 5.1], target: [1.65, 2.3, .15], yaw: -.08 },
  { at: .40, position: [-.40, 2.6, 5.0], target: [1.65, 2.3, .15], yaw: -.04 },
  { at: .57, position: [2.2, 2.7, 9.2], target: [-1.4, 1.85, 0], yaw: 3.20 },
  { at: .67, position: [1.8, 2.6, 9.2], target: [-1.4, 1.85, 0], yaw: 3.65 },
  { at: .85, position: [-1.3, 2.8, 10.0], target: [1.85, 1.85, 0], yaw: 6.18 },
  { at: 1, position: [-1.0, 2.8, 10.2], target: [1.85, 1.85, 0], yaw: 6.26 },
]
