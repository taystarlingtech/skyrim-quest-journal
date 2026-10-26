const PINES: Array<[number, number, number]> = [
  [30, 610, 90],
  [78, 640, 120],
  [130, 655, 150],
  [190, 630, 100],
  [250, 670, 160],
  [318, 690, 130],
  [390, 710, 90],
  [1180, 700, 110],
  [1255, 660, 150],
  [1330, 690, 120],
  [1405, 640, 140],
  [1480, 675, 100],
  [1545, 630, 130],
  [70, 760, 180],
  [160, 790, 210],
  [270, 800, 170],
  [1360, 790, 200],
  [1475, 770, 180],
  [1560, 800, 150],
]

export function Landscape() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141c19" />
          <stop offset="42%" stopColor="#24312b" />
          <stop offset="100%" stopColor="#101614" />
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d5ddd0" stopOpacity="0" />
          <stop offset="100%" stopColor="#d5ddd0" stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="46%" r="68%">
          <stop offset="45%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.62" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      <polygon
        points="0,500 160,330 320,455 510,270 760,470 980,290 1200,450 1390,320 1600,470 1600,900 0,900"
        fill="#1b2722"
      />
      <polygon
        points="0,590 150,460 310,560 500,400 720,575 930,430 1140,585 1340,455 1600,560 1600,900 0,900"
        fill="#24332c"
      />
      <polygon
        points="0,690 220,560 430,670 680,530 900,690 1140,550 1360,700 1600,600 1600,900 0,900"
        fill="#17211d"
      />
      <g className="landscape-fog">
        <ellipse cx="520" cy="760" rx="520" ry="90" fill="url(#mist)" />
        <ellipse cx="1180" cy="790" rx="480" ry="80" fill="#c9d2c6" opacity="0.08" />
      </g>
      {PINES.map(([x, y, h], index) => (
        <g key={index}>
          <polygon
            points={`${x},${y} ${x - h * 0.42},${y + h} ${x + h * 0.42},${y + h}`}
            fill="#0c1210"
          />
          <polygon
            points={`${x},${y + h * 0.32} ${x - h * 0.58},${y + h * 1.05} ${x + h * 0.58},${y + h * 1.05}`}
            fill="#101816"
          />
        </g>
      ))}
      <rect width="1600" height="900" fill="url(#vignette)" />
    </svg>
  )
}
