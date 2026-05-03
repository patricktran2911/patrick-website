export function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function getPreferredRecorderMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  const options = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
  ];

  return options.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
}
