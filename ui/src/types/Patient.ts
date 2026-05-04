/** Row from `GET /patients/?page=&page_size=` (Patient.serialize) */
export type PatientRow = {
  id: string;
  workspace: {
    id: string;
    name: string;
  };
  PatientID: string;
  PatientName: string | null;
  PatientAge: string | null;
  PatientSex: string | null;
  created_at: string;
};

export type PatientDetail = {
  id: string;
  PatientID: string;
  PatientName: string | null;
  PatientAge: string | null;
  PatientSex: string | null;
  created_at: string;
  studies: StudyDetail[];
};

export type StudyDetail = {
  id: string;
  StudyInstanceUID: string;
  AccessionNumber: string | null;
  StudyDescription: string | null;
  created_at: string;
  series: SeriesDetail[];
};

export type SeriesDetail = {
  id: string;
  SeriesInstanceUID: string;
  SeriesDescription: string | null;
  SeriesNumber: string | null;
  Modality: string | null;
  created_at: string;
  total_instances: number;
};
