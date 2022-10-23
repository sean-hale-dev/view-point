const getAspectRatio = (width: number, height: number) => {
  return width / height;
}

const getDimensions = (aspectRatio: number, targetDimension: number, useWidth: boolean = false) => {
  // Aspect ratio -> width / height

  let width: number;
  let height: number;

  if (useWidth) {
    width = targetDimension;
    height = Math.ceil(targetDimension * (1 / aspectRatio));
  } else {
    height = targetDimension;
    width = Math.ceil(aspectRatio * targetDimension);
  }

  return { width, height };
}

export {
  getAspectRatio,
  getDimensions
}
