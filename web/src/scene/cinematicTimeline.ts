/** Normalized scroll anchors shared by the camera, chapter navigation and capture scripts. */
export const CHAPTERS = [
  { at: 0, label: '初见', english: 'MEET YOUR POSSIBILITY' },
  { at: .30, label: '看见', english: 'LOOK A LITTLE CLOSER' },
  { at: .57, label: '探索', english: 'MADE FOR THE CURIOUS' },
  { at: .85, label: '出发', english: 'YOUR NEXT CHAPTER' },
]

export const CAMERA_POSES = [
  { at: 0, position: [2.3, 2.65, 7.6], target: [-1.15, 1.83, 0], yaw: -.10 },
  { at: .13, position: [1.7, 2.55, 7.25], target: [-1.05, 1.87, 0], yaw: .02 },
  { at: .30, position: [-.45, 2.95, 3.5], target: [1.45, 2.64, .15], yaw: -.08 },
  { at: .40, position: [-.40, 2.83, 3.3], target: [1.43, 2.62, .15], yaw: -.04 },
  { at: .57, position: [2.4, 2.55, 7.1], target: [-1.15, 1.83, 0], yaw: 3.20 },
  { at: .67, position: [2.1, 2.50, 7.1], target: [-1.15, 1.83, 0], yaw: 3.65 },
  { at: .85, position: [-1.3, 2.85, 8.0], target: [1.65, 1.82, 0], yaw: 6.18 },
  { at: 1, position: [-1.0, 2.8, 8.2], target: [1.65, 1.82, 0], yaw: 6.26 },
]
