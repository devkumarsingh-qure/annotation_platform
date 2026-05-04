export type SeriesDetail = {
  id: string;
  SeriesInstanceUID: string;
  SeriesDescription: string | null;
  SeriesNumber: string | null;
  Modality: string | null;
  created_at: string;
  total_instances: number;
  instances: InstanceDetail[];
};

export type InstanceDetail = {
  id: string;
  SOPInstanceUID: string;
  InstanceNumber: string;
  NumberOfFrames: string;
  created_at: string;
  url_p10: string;
};

export type Annotation = {
  annotationUID: string;
  points: [number, number, number][];
  sliceIndex: number;
  toolName: string;
};

export type AnnotationSetsType = {
  PatientID: string;
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  annotationSets: AnnotationSetType[];
};

export type AnnotationSetType = {
  id: string;
  created_at: string;
  url: string;
};

export type ViewerMode = "annotate" | "view";
