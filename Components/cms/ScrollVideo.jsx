"use client";

/**
 * Scroll Video section.
 *
 * This file is the section's public face. It was a single 900-line component;
 * the pieces now live under ./scrollVideo, which is what lets the maths be
 * tested without a browser and the pin be fixed without touching the drawing:
 *
 *   scrollVideo/engine.js               all the maths — no DOM, no React
 *   scrollVideo/useScrollController.js  measures the track, drives progress,
 *                                       and repairs ancestors that break the pin
 *   scrollVideo/useFrameSequence.js     loads and frees the frame images
 *   scrollVideo/useVideoMeta.js         reads a file's duration/fps
 *   scrollVideo/VideoScene.jsx          one scene — a slice of the scroll
 *   scrollVideo/VideoOverlay.jsx        one persistent layer over the picture
 *   scrollVideo/ScrollVideoRenderer.jsx puts them together
 *
 * Everything the rest of the app imported from here is still exported from
 * here, so no other file had to change and every saved page keeps working.
 */

import ScrollVideoRenderer from "./scrollVideo/ScrollVideoRenderer";
import useVideoMetaHook from "./scrollVideo/useVideoMeta";
import useFrameSequenceHook from "./scrollVideo/useFrameSequence";
import useScrollControllerHook from "./scrollVideo/useScrollController";

export {
  SCROLL_MODES,
  SCROLL_DIRECTIONS,
  REDUCED_MOTION_MODES,
  SCENE_ANIMATIONS,
  SCENE_POSITIONS,
  OVERLAY_KINDS,
  VISIBILITY,
  EASES,
  TRIGGER_STARTS,
  TRIGGER_ENDS,
  MIN_TRAVEL_VH,
  applyEase,
  computeProgress,
  mapProgress,
  trackTravel,
  trackHeightCss,
  sceneState,
  sceneRange,
  sceneStyle,
  scenePlacement,
  overlayStyle,
  snapTarget,
  loadOrder,
  coarseStride,
  nearestCoarseFrame,
  frameUrl,
  reducedMotionMode,
  resolveSource,
  validateScrollVideo,
} from "./scrollVideo/engine";

export const useVideoMeta = useVideoMetaHook;
export const useFrameSequence = useFrameSequenceHook;
export const useScrollController = useScrollControllerHook;

export default ScrollVideoRenderer;
