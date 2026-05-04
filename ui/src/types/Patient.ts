export type Patient = {
    id: string;
    PatientID: string;
    PatientName: string | null;
    PatientAge: string | null;
    PatientSex: string | null;
    created_at: string;
}

export type PatientSeriesRow = {
    id: string | number;
    SeriesInstanceUID: string;
    SeriesDescription: string | null;
    SeriesNumber: string | null;
    Modality: string | null;
    created_at: string;
    total_instances: number;
};

export type PatientStudyRow = {
    id: string | number;
    StudyInstanceUID: string;
    AccessionNumber: string | null;
    StudyDescription: string | null;
    created_at: string;
    series: PatientSeriesRow[];
};

export type PatientDetail = Patient & {
    studies: PatientStudyRow[];
};

export type Study = {
    id: string;
    StudyInstanceUID: string;
    AccessionNumber: string;
    StudyDescription: string;
    created_at: string;
    series: Series[];
}

export type Series = {
    id: string;
    PatientID: string;
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    SeriesDescription: string;
    SeriesNumber: string;
    Modality: string;
    created_at: string;
    instances: Instance[];
    total_instances: number;
    num_instances?: number;
}

export type Instance = {
    id: string;
    SOPInstanceUID: string;
    InstanceNumber: string;
    NumberOfFrames: string;
    created_at: string;
    url_p10: string;
}