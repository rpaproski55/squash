# Pose library: forehand straight drive, classic stance

Right-handed forehand drive from the back right corner. Clip id
`forehand-drive-classic`. Every number here is copied by script from
`prototypes/straight-drive.html` (`FOREHAND_DRIVE` in the core block), which is
the source of truth. Conventions (clip frame, yaw, chest frame, samplers) are
in `ARCHITECTURE.md`.

- Time `t` is scene seconds relative to contact. Contact is `t = 0`. In the
  existing `good` scene the strike is at 1.2 s, so scene time = `t + 1.2`; after
  the 0.8 s lead-in the plan adds, scene time = `t + 2.0`.
- The clip runs from -2.00 to +1.90.
- Anchor for the straight drive scenes: court (5.6, 8.4). Contact height 0.55.

## Body

| Segment | Metres | | Limb radius (near end, far end) | Metres |
|---|---|---|---|---|
| Hip joint, each side of pelvis | 0.10 | | Thigh | 0.085, 0.062 |
| Thigh | 0.43 | | Shin | 0.058, 0.042 |
| Shin | 0.42 | | Foot | 0.045, 0.036 |
| Ankle above floor | 0.08 | | Upper arm | 0.052, 0.043 |
| Foot, heel behind and toe ahead of ankle | 0.06, 0.18 | | Forearm | 0.040, 0.032 |
| Spine, pelvis to shoulder line | 0.48 | | Hand | 0.045 |
| Shoulder, each side | 0.19 | | Torso capsule, chest and pelvis | 0.105, 0.100 |
| Chest to head centre | 0.23 | | Shoulder bar | 0.07 |
| Head radius | 0.105 | | Hip bar | 0.085 |
| Upper arm | 0.29 | | Neck | 0.05 |
| Forearm | 0.26 | | | |
| Wrist to racquet head centre | 0.50 | | | |
| Racquet head half-length, half-width | 0.115, 0.09 | | | |
| Racquet butt behind wrist | 0.07 | | | |
| Step lift | 0.13 | | | |

## The phases

| t | Phase | What happens |
|---|---|---|
| -2.00 | Ready | On the T, facing the front wall, knees soft, racquet up in front |
| -1.86 | Split step | Pelvis dips 7 cm as the opponent's ball comes off the wall |
| -1.78 to -1.42 | Step 1, right foot | Turn toward the corner; hips to 70 degrees |
| -1.52 to -1.05 | Step 2, left foot | Racquet already up beside the head (cue 1) |
| -1.15 to -0.62 | Step 3, right foot | Plants as the back foot, toe at 108 degrees |
| -0.70 to -0.22 | Step 4, left foot | The lunge: front foot lands toe at 85 degrees (cue 2) |
| -0.34 | Top of backswing | Chest 118 degrees, wrist cocked 110 degrees, racquet head at 1.61 m |
| -0.34 to 0 | Downswing | Hips lead the chest by about 15 degrees; elbow leads, racquet lags |
| 0 | Contact | Level with the front foot, arm 97 percent extended, face open 14 degrees |
| 0 to +0.40 | Follow-through | Finishes high and short, in front of the leading shoulder |
| +0.42 to +1.78 | Recovery | Four steps back to the T, racquet back up |

## Tracks

Arc tracks (`racquetDir`, `racquetFace`, `elbowR`) are sampled with
`sampleArc`; all others with `sampleTrack`. Vectors on arc tracks are
normalised when sampled, so they need not be unit length here. A repeated
value on a foot or toe track is a deliberate hold.

### `pelvisOffset` ([du, dv] m, added to the midpoint of the feet)

| t | value |
|---|---|
| -2.00 | [0, 0] |
| -0.45 | [0, 0] |
| -0.20 | [0.02, -0.07] |
| 0.40 | [0.02, -0.07] |
| 0.75 | [0, 0] |
| 1.90 | [0, 0] |

### `pelvisHeight` (m)

| t | value |
|---|---|
| -2.00 | 0.9 |
| -1.86 | 0.83 |
| -1.50 | 0.8 |
| -0.80 | 0.79 |
| -0.45 | 0.77 |
| -0.20 | 0.72 |
| 0.00 | 0.7 |
| 0.40 | 0.72 |
| 0.75 | 0.79 |
| 1.45 | 0.82 |
| 1.80 | 0.9 |

### `hipYaw` (deg)

| t | value |
|---|---|
| -2.00 | 0 |
| -1.86 | 0 |
| -1.45 | 70 |
| -0.80 | 95 |
| -0.30 | 100 |
| 0.00 | 72 |
| 0.20 | 50 |
| 0.45 | 36 |
| 0.90 | 30 |
| 1.50 | 6 |
| 1.80 | 0 |

### `chestYaw` (deg)

| t | value |
|---|---|
| -2.00 | 0 |
| -1.86 | 4 |
| -1.45 | 80 |
| -0.80 | 105 |
| -0.34 | 118 |
| -0.13 | 100 |
| 0.00 | 75 |
| 0.14 | 48 |
| 0.40 | 22 |
| 0.90 | 24 |
| 1.50 | 5 |
| 1.80 | 0 |

### `lean` (deg, forward along chestYaw)

| t | value |
|---|---|
| -2.00 | 16 |
| -1.50 | 20 |
| -0.80 | 24 |
| -0.30 | 32 |
| 0.00 | 38 |
| 0.40 | 26 |
| 0.90 | 20 |
| 1.80 | 16 |

### `footL` ([u, v] m, ankle on the floor)

| t | value |
|---|---|
| -2.00 | [-2.65, -2.45] |
| -1.52 | [-2.65, -2.45] |
| -1.05 | [-1.8, -0.6] |
| -0.70 | [-1.8, -0.6] |
| -0.22 | [-0.6, 0.02] |
| 0.42 | [-0.6, 0.02] |
| 0.80 | [-1.55, -0.62] |
| 1.02 | [-1.55, -0.62] |
| 1.45 | [-2.65, -2.45] |
| 1.90 | [-2.65, -2.45] |

### `footR` ([u, v] m)

| t | value |
|---|---|
| -2.00 | [-2.15, -2.45] |
| -1.78 | [-2.15, -2.45] |
| -1.42 | [-2, -1.6] |
| -1.15 | [-2, -1.6] |
| -0.62 | [-1.42, 0.5] |
| 0.70 | [-1.42, 0.5] |
| 1.12 | [-1.98, -1.5] |
| 1.36 | [-1.98, -1.5] |
| 1.78 | [-2.15, -2.45] |
| 1.90 | [-2.15, -2.45] |

### `toeL` (deg, same convention as yaw)

| t | value |
|---|---|
| -2.00 | -8 |
| -1.52 | -8 |
| -1.05 | 95 |
| -0.70 | 95 |
| -0.22 | 85 |
| 0.42 | 85 |
| 0.80 | 40 |
| 1.02 | 40 |
| 1.45 | -8 |
| 1.90 | -8 |

### `toeR` (deg)

| t | value |
|---|---|
| -2.00 | 8 |
| -1.78 | 8 |
| -1.42 | 100 |
| -1.15 | 100 |
| -0.62 | 108 |
| 0.70 | 108 |
| 1.12 | 45 |
| 1.36 | 45 |
| 1.78 | 8 |
| 1.90 | 8 |

### `handR` ([right, forward, up] m in the chest frame (wrist))

| t | value |
|---|---|
| -2.00 | [0.2, 0.3, -0.24] |
| -1.80 | [0.22, 0.3, -0.22] |
| -1.30 | [0.36, 0.14, -0.02] |
| -0.80 | [0.42, -0.04, 0.06] |
| -0.34 | [0.47, -0.16, 0.04] |
| -0.13 | [0.3, 0.12, -0.26] |
| 0.00 | [-0.052, 0.244, -0.398] |
| 0.14 | [-0.15, 0.4, -0.14] |
| 0.40 | [-0.14, 0.28, 0.24] |
| 0.90 | [0.16, 0.3, -0.1] |
| 1.80 | [0.2, 0.3, -0.24] |

### `racquetDir` (unit-ish vector in the chest frame, wrist to racquet head (normalised when sampled))

| t | value |
|---|---|
| -2.00 | [-0.25, 0.3, 0.92] |
| -1.30 | [0.05, -0.1, 0.99] |
| -0.80 | [-0.2, -0.25, 0.95] |
| -0.34 | [-0.4, -0.4, 0.82] |
| -0.13 | [0.78, 0.02, 0.62] |
| 0.00 | [0.25, 0.933, -0.26] |
| 0.14 | [-0.8, 0.25, 0.55] |
| 0.40 | [-0.4, -0.3, 0.87] |
| 0.90 | [-0.15, 0.15, 0.98] |
| 1.80 | [-0.25, 0.3, 0.92] |

### `racquetFace` (string-bed normal in the chest frame)

| t | value |
|---|---|
| -2.00 | [0.3, 0.95, 0] |
| -0.80 | [0.9, 0.4, 0.1] |
| -0.34 | [0.95, 0.25, 0.1] |
| -0.13 | [-0.55, 0.45, 0.7] |
| 0.00 | [-0.92, 0.309, 0.24] |
| 0.14 | [-0.5, -0.6, -0.6] |
| 0.40 | [0.6, -0.8, 0] |
| 0.90 | [0.3, 0.95, 0] |
| 1.80 | [0.3, 0.95, 0] |

### `elbowR` (pole hint in the chest frame: the elbow bends toward it)

| t | value |
|---|---|
| -2.00 | [0.5, -0.3, -0.8] |
| -0.80 | [0.6, -0.55, -0.55] |
| -0.34 | [0.55, -0.7, -0.45] |
| -0.13 | [0.35, -0.6, -0.7] |
| 0.00 | [0.6, -0.3, -0.7] |
| 0.14 | [0.5, 0.2, -0.85] |
| 0.40 | [0.45, 0.5, -0.75] |
| 0.90 | [0.5, -0.2, -0.85] |
| 1.80 | [0.5, -0.3, -0.8] |

### `handL` ([right, forward, up] m in the chest frame)

| t | value |
|---|---|
| -2.00 | [-0.1, 0.34, -0.2] |
| -1.80 | [-0.14, 0.33, -0.2] |
| -1.30 | [-0.32, 0.22, -0.22] |
| -0.80 | [-0.34, 0.3, -0.12] |
| -0.34 | [-0.3, 0.4, -0.06] |
| 0.00 | [-0.4, 0.1, -0.16] |
| 0.40 | [-0.36, -0.04, -0.28] |
| 0.90 | [-0.26, 0.2, -0.24] |
| 1.80 | [-0.1, 0.34, -0.2] |

The keys marked solved (`handR`, `racquetDir`, `racquetFace` at t = 0) were
computed, not eyeballed: the racquet direction in court space is
(0.966, 0, -0.26) (shaft pointing at the side wall, head 13 cm below the
wrist), the string normal is (0.06, -0.97, 0.24), and the hand is placed so the
head centre is on the ball. `racquetDir` and `racquetFace` carry the `'peak'`
tag on that key.

## Solved joints at the named poses

Court space, metres, with the anchor at (5.6, 8.4). Use these to check a port:
your `placeFigure(solveFigure(clip, t), anchor)` should match to 0.01.

| t | pose | pelvis | chest | head | racquet hand | racquet head | L ankle | R ankle | wrist angle | elbow angle |
|---|---|---|---|---|---|---|---|---|---|---|
| -2.00 | Ready on the T | 3.20, 5.95, 0.90 | 3.20, 5.82, 1.36 | 3.20, 5.78, 1.59 | 3.40, 5.52, 1.12 | 3.27, 5.37, 1.58 | 2.95, 5.95, 0.08 | 3.45, 5.95, 0.08 | 117 | 88 |
| -1.45 | Turn and first step | 3.30, 6.42, 0.80 | 3.46, 6.39, 1.25 | 3.51, 6.38, 1.47 | 3.72, 6.68, 1.17 | 3.71, 6.66, 1.67 | 3.00, 6.06, 0.14 | 3.60, 6.78, 0.11 | 123 | 54 |
| -0.80 | Racquet up, moving | 3.91, 8.07, 0.79 | 4.10, 8.12, 1.23 | 4.16, 8.13, 1.45 | 3.95, 8.51, 1.29 | 3.86, 8.39, 1.76 | 3.80, 7.80, 0.08 | 4.02, 8.34, 0.19 | 131 | 52 |
| -0.34 | Top of the backswing, front foot in the air | 4.50, 8.58, 0.75 | 4.72, 8.70, 1.16 | 4.79, 8.73, 1.38 | 4.36, 9.04, 1.20 | 4.28, 8.77, 1.61 | 4.81, 8.32, 0.17 | 4.18, 8.90, 0.08 | 110 | 72 |
| -0.13 | Downswing, front foot planted | 4.61, 8.59, 0.71 | 4.89, 8.64, 1.10 | 4.97, 8.65, 1.31 | 4.96, 8.96, 0.84 | 4.90, 9.34, 1.15 | 5.00, 8.42, 0.08 | 4.18, 8.90, 0.08 | 87 | 68 |
| 0.00 | Contact | 4.61, 8.59, 0.70 | 4.90, 8.51, 1.08 | 4.98, 8.49, 1.29 | 5.12, 8.40, 0.68 | 5.60, 8.40, 0.55 | 5.00, 8.42, 0.08 | 4.18, 8.90, 0.08 | 119 | 146 |
| 0.14 | Through the ball | 4.61, 8.59, 0.70 | 4.82, 8.40, 1.10 | 4.88, 8.35, 1.31 | 5.01, 8.03, 0.96 | 4.84, 7.65, 1.23 | 5.00, 8.42, 0.08 | 4.18, 8.90, 0.08 | 132 | 162 |
| 0.40 | Finish | 4.61, 8.59, 0.72 | 4.69, 8.39, 1.15 | 4.71, 8.34, 1.37 | 4.66, 8.08, 1.39 | 4.42, 8.15, 1.82 | 5.00, 8.42, 0.08 | 4.18, 8.90, 0.08 | 148 | 128 |
| 1.10 | Recovering | 3.79, 7.26, 0.80 | 3.84, 7.12, 1.26 | 3.85, 7.08, 1.49 | 4.11, 6.90, 1.11 | 4.05, 6.77, 1.59 | 3.95, 7.61, 0.15 | 3.62, 6.91, 0.10 | 129 | 75 |
| 1.80 | Back on the T | 3.20, 5.95, 0.90 | 3.20, 5.82, 1.36 | 3.20, 5.78, 1.59 | 3.40, 5.52, 1.12 | 3.27, 5.37, 1.58 | 2.95, 5.95, 0.08 | 3.45, 5.95, 0.08 | 117 | 88 |

Wrist angle is the angle between forearm and racquet shaft (180 is straight).
Elbow angle is the angle at the elbow (180 is straight).

## Measured on the prototype

| Check | Value |
|---|---|
| Racquet head to ball at contact | 0.0006 m |
| Racquet head speed, scene m/s, at t = -0.30, -0.20, -0.10, -0.06, -0.02, 0, +0.05, +0.10, +0.20 | 3.0, 6.0, 9.2, 11.6, 13.0, 11.9, 11.8, 8.3, 4.7 |
| Peak head speed | 13.2 at t = +0.005 |
| Largest limb stretch over the clip | 1.035 (left leg, mid-stride at t = -1.07, foot in the air) |
| Racquet arm extension at contact | 0.97 |
| String tilt at contact | 14 degrees open |

## Authoring another clip

1. Copy this clip. Set the foot tracks first; repeat a key to plant a foot.
   Keep planted feet under about 1.1 m apart or lower `pelvisHeight`.
2. Set `chestYaw`, `lean`, `pelvisHeight` at contact.
3. Solve the contact key: choose the racquet direction and string normal you
   want in court space, set `hand = ball - 0.50 * direction`, convert all three
   into the chest frame at t = 0 (dot with the chest right, forward and up
   vectors). Check the shoulder to hand distance is under 0.55.
4. Add the backswing and follow-through keys, then run the tests in
   `ARCHITECTURE.md`. If head speed dips at contact, the keys either side of it
   are too far away in angle; move them closer in time or angle.
5. Look at it from all four cameras with the skeleton overlay on (the
   prototype has a button for it).

## Known weak spots

- The approach steps are long (up to 2.2 m of foot travel) because the scene
  asks for 3 m of movement in 2 s. They read as running strides, not walking.
- The back heel stays flat in the lunge; a real player comes up on the toe.
  There is no foot pitch channel yet.
- The head does not turn to track the ball (no face, so it barely shows).
- The off arm is plausible, not studied.
- Forearm roll is implied by `racquetFace`, not modelled as a joint.
