"""V4 source-space clay color classification; does not edit any mesh or bitmap.

Contract
--------
classify(co, rgb) -> (region_name: str, linear_rgb: tuple[float,float,float]).
co is an ORIGINAL, unscaled source vertex position: Z-up, +X front, original
height 1.0 including the lobster; y is lateral. rgb is the source UV sample
in [0,1] as saved in /tmp/v4-source-color-data.npz. Those samples are exactly
8-bit/255 quantized, i.e. encoded texture samples; output palette is converted
from sRGB to linear for a FLOAT_COLOR attribute or material base color.

After remeshing, query the nearest ORIGINAL source point and pass that source
point + its source RGB, not the rescaled/remeshed world coordinate. Newly built
head caps should explicitly receive PALETTE_LINEAR['clay_gold']; source lobster
colors are intentionally never transferred as red to the reconstructed crown.
This helper does not identify deletion geometry, smooth meshes, or create bags.

Fitted anatomical volumes preserve facial/body colors without baked lighting.
The fitted cream boundary and belly ellipse regularize scanned paint seams;
small individual boundary points still require visual review, especially where
finger geometry overlaps the belly. No measured lighting recovery is claimed.
"""
from math import exp

PALETTE_SRGB = {
    'clay_gold': (0.835, 0.689, 0.467),
    'clay_cream': (0.906, 0.839, 0.706),
    'clay_blush': (0.870, 0.596, 0.490),
    'clay_pink': (0.810, 0.566, 0.455),
    'clay_frame': (0.235, 0.215, 0.192),
    'clay_eye': (0.205, 0.188, 0.169),
    'clay_nose_mouth': (0.372, 0.292, 0.244),
    'clay_bag': (0.553, 0.435, 0.322),
}

def srgb_to_linear(c):
    c = max(0.0, min(1.0, float(c)))
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

PALETTE_LINEAR = {name: tuple(srgb_to_linear(c) for c in color)
                  for name, color in PALETTE_SRGB.items()}
PBR = {name: {'metallic': 0.0, 'roughness': 0.86, 'coat_weight': 0.0,
              'transmission_weight': 0.0, 'ior': 1.45}
       for name in PALETTE_SRGB}
PBR['clay_frame']['roughness'] = 0.78
PBR['clay_eye']['roughness'] = 0.77
PBR['clay_nose_mouth']['roughness'] = 0.84


def _tube_distance_squared(p, a, b):
    ab = tuple(b[i] - a[i] for i in range(3))
    t = max(0.0, min(1.0, sum((p[i] - a[i]) * ab[i] for i in range(3))
                         / max(sum(v * v for v in ab), 1e-12)))
    return sum((p[i] - a[i] - t * ab[i]) ** 2 for i in range(3))


# Measured from dark source temple vertices, with highlights excluded only while
# fitting. Classification includes the full tube, so baked highlights cannot chip it.
_TEMPLE = ((0.035, 0.256, 0.584), (0.075, 0.263, 0.588),
           (0.125, 0.265, 0.609), (0.175, 0.258, 0.615),
           (0.225, 0.249, 0.611), (0.275, 0.239, 0.605),
           (0.325, 0.228, 0.599), (0.372, 0.220, 0.603))


def region(co, rgb):
    """Anatomical geometry takes priority over baked source-lightness thresholds.

    The source RGB remains an input for compatibility and the small frame rear
    fallback; it never multiplies the palette. Main visible patches are fitted
    continuous volumes, not a per-texel threshold or full-model color cluster.
    """
    x, y, z = map(float, co)
    r, g, b = (max(0.0, min(1.0, float(v))) for v in rgb[:3])
    ay = abs(y)
    hi, lo = max(r, g, b), min(r, g, b)
    neutral_dark = (hi < 0.62 and (hi-lo)/max(hi, 1e-6) < 0.40
                    and g/max(r, 1e-6) > 0.83)

    # Inner cups have a geometric boundary; the outer clay ear rim stays gold.
    ear = ((ay - 0.205) / 0.039) ** 2 + ((z - 0.726) / 0.047) ** 2
    if 0.130 < x < 0.182 and ear < 1.0 and z > 0.676:
        return 'clay_pink'
    if z > 0.657:
        return 'clay_gold'

    # Full rounded-rectangle front rim plus the curved temples behind the face.
    # Depth excludes the forehead and the recessed skin inside the lens openings.
    if 0.477 < z < 0.655:
        outer = (abs(ay-0.131)/0.107) ** 4 + (abs(z-0.565)/0.081) ** 4
        inner = (abs(ay-0.131)/0.075) ** 4 + (abs(z-0.565)/0.052) ** 4
        front_rim = x > 0.353 and outer < 1.12 and inner > 0.92
        # The inner lower corner shares its projection with the nose-side skin.
        # Here only original neutral frame seeds are admitted; mesh closing fills
        # highlight holes without painting a geometric wedge onto that skin.
        if ay < 0.068 and z < 0.550:
            front_rim = front_rim and neutral_dark
        bridge = x > 0.348 and ay < 0.038 and 0.553 < z < 0.583
        temple = (ay > 0.218 and 0.015 < x < 0.385 and any(
            _tube_distance_squared((x, ay, z), a, b) < 0.019 ** 2
            for a, b in zip(_TEMPLE, _TEMPLE[1:])))
        if front_rim or bridge or temple:
            return 'clay_frame'
        # Source eye vertices span z=0.528..0.594 and x=0.300..0.340.
        # A lower ellipse centered at 0.553 painted the skin beneath the eye.
        eye = ((ay - 0.0925) / 0.031) ** 2 + ((z - 0.561) / 0.035) ** 2
        if 0.298 < x < 0.348 and z > 0.526 and eye < 1.05:
            return 'clay_eye'
        # Cover the recessed rim back surface without expanding black onto skin.
        if x > 0.300 and outer < 1.18 and inner > 0.88 and neutral_dark:
            return 'clay_frame'

    # The nose is colored as one volume, including its old baked highlight.
    nose = (y / 0.041) ** 2 + ((z - 0.495) / 0.027) ** 2
    if x > 0.367 and nose < 1.15:
        return 'clay_nose_mouth'
    # Lips remain cream. Only the thin W-shaped recessed seam is brown.
    mouth_z = 0.430 + 10.0 * (ay - 0.029) ** 2
    mouth_seam = ay < 0.060 and abs(z-mouth_z) < 0.0033
    philtrum = ay < 0.0040 and 0.440 < z < 0.473
    if x > 0.372 and (mouth_seam or philtrum):
        return 'clay_nose_mouth'

    # Continuous coral cheeks; no inherited flecks or shadow-dependent edge cuts.
    cheek = ((ay - 0.213) / 0.055) ** 2 + ((z - 0.466) / 0.043) ** 2
    if x > 0.257 and cheek < 1.0:
        return 'clay_blush'

    # Pink stays on projecting paws, instead of painting the thigh behind them.
    foot = ((ay - 0.203) / 0.063) ** 2 + ((z - 0.079) / 0.073) ** 2
    foot_front = 0.248 - 0.033 * max(0.0, 1.0 - ((z-0.078)/0.073)**2)
    if x > foot_front and foot < 1.08 and z < 0.152:
        return 'clay_pink'
    hand = ((ay - 0.108) / 0.047) ** 2 + ((z - 0.205) / 0.036) ** 2
    if x > 0.320 and hand < 1.0:
        return 'clay_pink'

    # A rounded 3D boundary wraps the cheeks; no hard vertical x-plane or hue gap.
    face_top = 0.538 - 0.020 * exp(-((ay - 0.109) / 0.049) ** 2)
    face_volume = ((x-0.354)/0.370)**2 + (y/0.395)**2 + ((z-0.450)/0.123)**2
    if x > 0.010 and z < face_top and face_volume < 1.12 and z > 0.326:
        return 'clay_cream'
    belly = (y / 0.143) ** 2 + ((z - 0.174) / 0.155) ** 2
    front_arm_overlap = x > 0.322 and ay > 0.033 and 0.140 < z < 0.340
    if x > 0.195 and belly < 1.03 and not front_arm_overlap:
        return 'clay_cream'
    return 'clay_gold'


def classify(co, rgb):
    """Return (anatomical label, linear RGB); no inherited baked brightness."""
    name = region(co, rgb)
    return name, PALETTE_LINEAR[name]


def classify_many(coordinates, colors):
    """Dependency-free convenience batch; returns (list[str], list[RGB tuples])."""
    pairs = [classify(co, rgb) for co, rgb in zip(coordinates, colors)]
    return [p[0] for p in pairs], [p[1] for p in pairs]
