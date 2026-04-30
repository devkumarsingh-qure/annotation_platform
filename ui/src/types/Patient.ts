export type Patient = {
    id: string;
    PatientID: string;
    PatientName: string;
    PatientAge: string;
    PatientSex: string;
    created_at: string;
}

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