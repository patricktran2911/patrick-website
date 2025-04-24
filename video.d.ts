// videos.d.ts
declare module "*.mp4" {
  const path: string;
  export default path;
}

declare module "*.mp4.webm" {
  const path: string;
  export default path;
}
