export type Annotation = {
  annotationUID: string;
  points: [number, number, number][];
  sliceIndex: number;
  toolName: string;
};

export type AnnotationSet = {
  id: string;
  created_at: string;
  url: string;
};