export type Annotation = {
  annotationUID: string;
  points: [number, number, number][];
  sliceIndex: number;
  toolName: string;
};

export type AnnotationSetType = {
  id: string;
  created_at: string;
  url: string;
};

export type ViewerMode = "annotate" | "view";