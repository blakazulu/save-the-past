import * as THREE from 'three';

// Player collision radius (how close can you get to walls/objects)
export const PLAYER_RADIUS = 0.4;

// Collision boundary types
export interface BoxBoundary {
  type: 'box';
  center: [number, number, number];
  size: [number, number, number];
}

export interface CylinderBoundary {
  type: 'cylinder';
  center: [number, number, number];
  radius: number;
}

export type CollisionBoundary = BoxBoundary | CylinderBoundary;

// Gallery dimensions (must match ProceduralGallery)
const GALLERY = {
  width: 30,
  depth: 40,
  wallThickness: 0.25,
};

// Generate all collision boundaries for the museum
export function getCollisionBoundaries(): CollisionBoundary[] {
  const boundaries: CollisionBoundary[] = [];
  const t = GALLERY.wallThickness;

  // ===== OUTER WALLS =====

  // Back wall (solid)
  boundaries.push({
    type: 'box',
    center: [0, 0, -20],
    size: [30, 6, t],
  });

  // Front wall - left section (left of entrance)
  boundaries.push({
    type: 'box',
    center: [-11, 0, 20],
    size: [8, 6, t],
  });

  // Front wall - right section (right of entrance)
  boundaries.push({
    type: 'box',
    center: [11, 0, 20],
    size: [8, 6, t],
  });

  // Left outer wall (solid)
  boundaries.push({
    type: 'box',
    center: [-15, 0, 0],
    size: [t, 6, 40],
  });

  // Right outer wall (solid)
  boundaries.push({
    type: 'box',
    center: [15, 0, 0],
    size: [t, 6, 40],
  });

  // ===== ROOM A/B/C DIVIDER WALLS =====

  // Wall between Room A and Room B (from back wall z=-20 to corridor z=-10)
  boundaries.push({
    type: 'box',
    center: [-6, 0, -15],
    size: [t, 6, 10],
  });

  // Wall between Room B and Room C (from back wall z=-20 to corridor z=-10)
  boundaries.push({
    type: 'box',
    center: [6, 0, -15],
    size: [t, 6, 10],
  });

  // ===== NORTH CORRIDOR BACK WALL (z=-10) - SEGMENTED FOR DOORWAYS =====

  // Section 1: Far left (x=-15 to x=-12.25)
  boundaries.push({
    type: 'box',
    center: [-13.625, 0, -10],
    size: [2.75, 6, t],
  });

  // Section 2: Between Room A door and Room B arch (x=-9.75 to x=-1.5)
  boundaries.push({
    type: 'box',
    center: [-5.625, 0, -10],
    size: [8.25, 6, t],
  });

  // Section 3: Between Room B arch and Room C door (x=1.5 to x=9.75)
  boundaries.push({
    type: 'box',
    center: [5.625, 0, -10],
    size: [8.25, 6, t],
  });

  // Section 4: Far right (x=12.25 to x=15)
  boundaries.push({
    type: 'box',
    center: [13.625, 0, -10],
    size: [2.75, 6, t],
  });

  // ===== NORTH CORRIDOR FRONT WALL (z=-6) - SEGMENTED FOR DOORWAYS =====

  // Section 1: Far left (x=-15 to x=-12.25)
  boundaries.push({
    type: 'box',
    center: [-13.625, 0, -6],
    size: [2.75, 6, t],
  });

  // Section 2: Between Room D door and Grand Hall arch (x=-9.75 to x=-1.75)
  boundaries.push({
    type: 'box',
    center: [-5.75, 0, -6],
    size: [8, 6, t],
  });

  // Section 3: Between Grand Hall arch and Room E door (x=1.75 to x=9.75)
  boundaries.push({
    type: 'box',
    center: [5.75, 0, -6],
    size: [8, 6, t],
  });

  // Section 4: Far right (x=12.25 to x=15)
  boundaries.push({
    type: 'box',
    center: [13.625, 0, -6],
    size: [2.75, 6, t],
  });

  // ===== VERTICAL DIVIDER WALLS (Room D / Grand Hall / Room E) =====

  // Wall between Room D and Grand Hall (x=-6, from z=-6 to z=6)
  boundaries.push({
    type: 'box',
    center: [-6, 0, 0],
    size: [t, 6, 12],
  });

  // Wall between Grand Hall and Room E (x=6, from z=-6 to z=6)
  boundaries.push({
    type: 'box',
    center: [6, 0, 0],
    size: [t, 6, 12],
  });

  // ===== SOUTH SIDE WALLS (z=6) =====

  // South side of Room D (x=-15 to x=-6)
  boundaries.push({
    type: 'box',
    center: [-10.5, 0, 6],
    size: [9, 6, t],
  });

  // South side of Room E (x=6 to x=15)
  boundaries.push({
    type: 'box',
    center: [10.5, 0, 6],
    size: [9, 6, t],
  });

  // ===== GRAND HALL SOUTH WALL (z=10) - WITH ARCHWAY GAP =====

  // Left section (x=-6 to x=-1.5)
  boundaries.push({
    type: 'box',
    center: [-3.75, 0, 10],
    size: [4.5, 6, t],
  });

  // Right section (x=1.5 to x=6)
  boundaries.push({
    type: 'box',
    center: [3.75, 0, 10],
    size: [4.5, 6, t],
  });

  // ===== SOUTH CORRIDOR WALLS (z=10, outside Grand Hall) =====

  // Left corridor wall (x=-15 to x=-6)
  boundaries.push({
    type: 'box',
    center: [-10.5, 0, 10],
    size: [9, 6, t],
  });

  // Right corridor wall (x=6 to x=15)
  boundaries.push({
    type: 'box',
    center: [10.5, 0, 10],
    size: [9, 6, t],
  });

  // ===== LOBBY SIDE WALLS - WITH DOORWAY GAPS =====

  // Left lobby wall - upper section (z=12 to z=16)
  boundaries.push({
    type: 'box',
    center: [-6, 0, 14],
    size: [t, 6, 4],
  });

  // Left lobby wall - lower section (z=10 to z=12)
  boundaries.push({
    type: 'box',
    center: [-6, 0, 11],
    size: [t, 6, 2],
  });

  // Right lobby wall - upper section
  boundaries.push({
    type: 'box',
    center: [6, 0, 14],
    size: [t, 6, 4],
  });

  // Right lobby wall - lower section
  boundaries.push({
    type: 'box',
    center: [6, 0, 11],
    size: [t, 6, 2],
  });

  // ===== ARCHWAY PILLARS (small collision for decorative pillars) =====

  // Room B archway pillars (at z=-10, x=0, width=3)
  boundaries.push({
    type: 'box',
    center: [-1.7, 0, -10],
    size: [0.4, 6, t * 2],
  });
  boundaries.push({
    type: 'box',
    center: [1.7, 0, -10],
    size: [0.4, 6, t * 2],
  });

  // Grand Hall north archway pillars (at z=-6, x=0, width=3.5)
  boundaries.push({
    type: 'box',
    center: [-1.95, 0, -6],
    size: [0.4, 6, t * 2],
  });
  boundaries.push({
    type: 'box',
    center: [1.95, 0, -6],
    size: [0.4, 6, t * 2],
  });

  // Grand Hall south archway pillars (at z=10, x=0, width=3)
  boundaries.push({
    type: 'box',
    center: [-1.7, 0, 10],
    size: [0.4, 6, t * 2],
  });
  boundaries.push({
    type: 'box',
    center: [1.7, 0, 10],
    size: [0.4, 6, t * 2],
  });

  // Main entrance archway pillars (at z=20, x=0, width=4)
  boundaries.push({
    type: 'box',
    center: [-2.2, 0, 20],
    size: [0.4, 6, t * 2],
  });
  boundaries.push({
    type: 'box',
    center: [2.2, 0, 20],
    size: [0.4, 6, t * 2],
  });

  // ===== PEDESTALS =====
  const pedestalPositions: [number, number][] = [
    // Room A (Ancient)
    [-11, -14],
    // Room B (Central)
    [-1.5, -14], [1.5, -14],
    // Room C (Medieval)
    [11, -14],
    // North Corridor
    [-12, -8], [-4, -8], [4, -8], [12, -8],
    // Room D (Classical)
    [-11, 0],
    // Grand Hall
    [-2, 2], [2, 2], [0, 6],
    // Room E (Modern)
    [11, 0],
    // South Corridor
    [-10, 12], [10, 12],
    // Entrance Lobby
    [-3, 16], [3, 16],
  ];

  for (const [x, z] of pedestalPositions) {
    boundaries.push({
      type: 'box',
      center: [x, 0, z],
      size: [1.1, 2, 1.1], // Pedestal base is 1.1 x 1.1
    });
  }

  return boundaries;
}

// Check if a position collides with any boundary
export function checkCollision(
  position: THREE.Vector3,
  boundaries: CollisionBoundary[]
): boolean {
  for (const boundary of boundaries) {
    if (boundary.type === 'box') {
      // AABB collision check
      const halfSize = {
        x: boundary.size[0] / 2 + PLAYER_RADIUS,
        z: boundary.size[2] / 2 + PLAYER_RADIUS,
      };

      const dx = Math.abs(position.x - boundary.center[0]);
      const dz = Math.abs(position.z - boundary.center[2]);

      if (dx < halfSize.x && dz < halfSize.z) {
        return true; // Collision detected
      }
    } else if (boundary.type === 'cylinder') {
      // Circle collision check (2D, ignoring y)
      const dx = position.x - boundary.center[0];
      const dz = position.z - boundary.center[2];
      const distSq = dx * dx + dz * dz;
      const minDist = boundary.radius + PLAYER_RADIUS;

      if (distSq < minDist * minDist) {
        return true; // Collision detected
      }
    }
  }

  return false; // No collision
}

// Get a safe position by sliding along walls
export function getSafePosition(
  currentPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  boundaries: CollisionBoundary[]
): THREE.Vector3 {
  // First try the full movement
  if (!checkCollision(targetPos, boundaries)) {
    return targetPos;
  }

  // Try moving only in X
  const xOnly = new THREE.Vector3(targetPos.x, currentPos.y, currentPos.z);
  if (!checkCollision(xOnly, boundaries)) {
    return xOnly;
  }

  // Try moving only in Z
  const zOnly = new THREE.Vector3(currentPos.x, currentPos.y, targetPos.z);
  if (!checkCollision(zOnly, boundaries)) {
    return zOnly;
  }

  // Can't move at all, stay in place
  return currentPos;
}
