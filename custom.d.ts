interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

declare module '*.worker.ts' {
  const content: any;
  export default content;
}
