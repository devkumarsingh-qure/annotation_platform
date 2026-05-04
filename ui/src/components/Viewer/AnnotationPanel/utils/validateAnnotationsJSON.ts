import type { AnnotationDetails } from "../../../../types/Viewer";

function validateAnnotationsJSON(annotations: AnnotationDetails[]) {
  try {
    for (const annotation of annotations) {
      const { toolName, sliceIndex, points } = annotation;
      if (
        !toolName ||
        (!sliceIndex && sliceIndex !== 0) ||
        !points ||
        !Array.isArray(points) ||
        points.length === 0 ||
        !points.every((point: [number, number, number]) => point.length === 3)
      ) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

export default validateAnnotationsJSON;
