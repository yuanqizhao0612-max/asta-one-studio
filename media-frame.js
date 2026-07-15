(function registerMediaFrame(globalScope) {
  const MEDIA_FRAME = Object.freeze({
    x: 0,
    y: 0,
    width: 1242,
    height: 735,
    radius: 0,
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value)));
  }

  function getMediaFrame() {
    return { ...MEDIA_FRAME };
  }

  function getMediaLayout(input) {
    const imageWidth = Math.max(1, Number(input.imageWidth) || 1);
    const imageHeight = Math.max(1, Number(input.imageHeight) || 1);
    const focusX = clamp(input.focusX ?? 50, 0, 100) / 100;
    const focusY = clamp(input.focusY ?? 50, 0, 100) / 100;
    const zoom = clamp(input.zoom ?? 100, 100, 220) / 100;
    const baseScale = Math.max(MEDIA_FRAME.width / imageWidth, MEDIA_FRAME.height / imageHeight);
    const scale = baseScale * zoom;
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;

    return {
      frame: getMediaFrame(),
      image: {
        x: MEDIA_FRAME.x - (drawWidth - MEDIA_FRAME.width) * focusX,
        y: MEDIA_FRAME.y - (drawHeight - MEDIA_FRAME.height) * focusY,
        width: drawWidth,
        height: drawHeight,
      },
    };
  }

  const api = Object.freeze({ MEDIA_FRAME, getMediaFrame, getMediaLayout });
  globalScope.AstaMediaFrame = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
