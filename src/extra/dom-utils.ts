const CONE_ANGLE = 0.52;  // 0.52rad ~ 30deg
const DIRECTION_BONUS = 0.25;

interface LineSegmentCoords {
    y: number,
    x0: number,
    x1: number
}

type Coord = 'y' | 'x0' | 'x1';

function calcDistance(from: LineSegmentCoords, to: LineSegmentCoords, coneAngle: number) {
    // check if located in the right direction
    if (to.y < 0) return;

    // check if on the same level
    const range = [from.x0, from.x1];
    if (inRange(to.x0, range) || inRange(to.x1, range) || (to.x0 <= from.x0 && to.x1 >= from.x1)) {
        return DIRECTION_BONUS * to.y;
    }

    // check if inside the angle
    const angleRange = [0, coneAngle];
    const dxCoords = [to.x1, to.x0 - from.x1];
    for (const dx of dxCoords) {
        const angle = Math.atan2(dx, to.y);
        if (inRange(angle, angleRange)) {
            return to.y / Math.cos(angle) || 0.001; // neighbours should have advantage over other elems with distance == 0
         } 
    }
}

function inRange(num: number, range: number[], inclusive = false) {
    return inclusive 
        ? num >= range[0] && num <= range[1] 
        : num > range[0] && num < range[1];
}


function findClosestNode(baseElement: Element, nodes: Element[], direction: string, coneAngle = CONE_ANGLE) {
    if (!baseElement) return;
    const base = baseElement.getBoundingClientRect();
    const from = {
        y: 0,
        x0: 0,
        x1: ['up', 'down'].includes(direction) ? base.width : base.height
    }
    const closestNode = nodes.reduce((closest: { node: Element, distance: number } | null, current: Element) => {
        if (current === baseElement) return closest;
        const curr = current.getBoundingClientRect();
        let to;
        // take corresponding side of each node and bring to coordinate system with baseElement side as x-axis base with x0 == 0
        switch (direction) {
            case 'up':
                to = {
                    y: base.top - curr.bottom,
                    x0: curr.left - base.left,
                    x1: curr.right - base.left
                }
                break;
            case 'down':
                to = {
                    y: curr.top - base.bottom,
                    x0: curr.left - base.left,
                    x1: curr.right - base.left
                }
                break;
            case 'left':
                to = {
                    y: base.left - curr.right,
                    x0: base.bottom - curr.bottom,
                    x1: base.bottom - curr.top
                }
                break;
            case 'right':
                to = {
                    y: curr.left - base.right,
                    x0: curr.top - base.top,
                    x1: curr.bottom - base.top
                }
        }
        const distance = to && calcDistance(from, formatTo3Digits(to), coneAngle);
        if (distance !== undefined) {
            if (!closest || distance < closest.distance) return { node: current, distance };
        }
        return closest;			
    }, null);
    return closestNode?.node;
}

function formatTo3Digits(obj: LineSegmentCoords) {
    const coordsArr = Object.keys(obj) as Coord[];
    coordsArr.forEach(coord => obj[coord] = +obj[coord].toFixed(3));
    return obj;
}


const isSelColElement = (elem: Element) => elem?.matches('.selCol :is(.checkBox, .checkBox :scope)');

export { findClosestNode, isSelColElement };
