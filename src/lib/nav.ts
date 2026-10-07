"use client";

// True once the home screen has been shown in this page load. Module state survives
// in-app navigation but not a fresh load, so it tells "came from home" apart from
// "opened this address directly".
let seenHome = false;

export function markHomeSeen() {
  seenHome = true;
}

export function cameFromHome() {
  return seenHome;
}
