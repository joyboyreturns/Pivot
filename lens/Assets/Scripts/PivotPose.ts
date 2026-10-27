import { extents } from "./Planner/index";
import type { Box, Frame } from "./Planner/index";

const CM = 100;
const RAD = Math.PI / 180;

/** Stage-local transform (cm) of the object for a planner frame: rotated about the middle of its volume, resting on the floor. */
export function poseTransform(box: Box, frame: Frame): { position: vec3; rotation: quat; height: number } {
  const height = extents(box, frame.pose).y;
  const rx = quat.angleAxis(frame.pose.pitch * RAD, vec3.right());
  const ry = quat.angleAxis(frame.pose.yaw * RAD, vec3.up());
  const rz = quat.angleAxis(frame.pose.roll * RAD, vec3.forward());
  return {
    position: new vec3(frame.position.x * CM, (height / 2 + frame.position.y) * CM, frame.position.z * CM),
    rotation: rz.multiply(ry).multiply(rx),
    height,
  };
}
