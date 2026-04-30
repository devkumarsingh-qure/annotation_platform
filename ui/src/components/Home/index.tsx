import { useContext, useEffect, useState } from "react";
import { ModalContext } from "../../contexts/modal/modalContext";
import FileUpload from "../Modals/FileUpload";
import type { Patient } from "../../types/Patient";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import PatientsList from "./PatientsList";
import PatientDetails from "./PatientDetails";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { PaginatedResponse } from "../../types/PaginatedResponse";
import { DEFAULT_PAGE_SIZE } from "../../utils/constants";
import Loading from "../Loading";

function Home() {
    const navigate = useNavigate();
    const { patient_id } = useParams();

    const { isFileUploadOpen } = useContext(ModalContext);

    const [isPatientsLoading, setIsPatientsLoading] = useState(true);
    const [isPatientLoading, setIsPatientLoading] = useState(true);
    const [patients, setPatients] = useState<PaginatedResponse<Patient>>({
        current_page_number: 0,
        page_size: DEFAULT_PAGE_SIZE,
        total_results: 0,
        results: [],
    });
    const [activePatient, setActivePatient] = useState<Patient | null>(null);

    useEffect(() => {
        if (!patient_id) return;

        fetchPatient(patient_id);
    }, [patient_id]);

    const fetchPatient = async (patient_id: string) => {
        setIsPatientLoading(true);
        const response = await apiClient.get(API_PATHS.PATIENT(patient_id));
        setActivePatient(response.data);
        setIsPatientLoading(false);
    }

    useEffect(() => {
        fetchPatients(1, false).finally(() => {
            setIsPatientsLoading(false);
        });
    }, []);

    const fetchPatients = async (page: number, append: boolean) => {
        const response = await apiClient.get(API_PATHS.PATIENTS({
            page,
            page_size: DEFAULT_PAGE_SIZE,
        }));
        setPatients({
            current_page_number: page,
            page_size: DEFAULT_PAGE_SIZE,
            total_results: response.data.total_results,
            results: append ? [...patients.results, ...response.data.results] : response.data.results,
        });
    }

    const handlePatientClick = (patient: Patient) => {
        navigate(UI_PATHS.PATIENT({ params: { patient_id: patient.id } }));
    }

    const handleBatchUploadComplete = (batchStatuses: Record<string, { success: boolean, patient: Patient }>) => {
        Object.values(batchStatuses).forEach((status) => {
            if (status.success) {
                const { id } = status.patient;
                setPatients((prev) => {
                    const patient = prev.results.find((patient: Patient) => patient.id == id);
                    if (!patient) {
                        return {
                            ...prev,
                            total_results: prev.total_results + 1,
                            results: [status.patient, ...prev.results],
                        }
                    } else {
                        return prev;
                    }
                })
            }
        })
    }

    const handleDeletePatient = async (patient_id: string) => {
        setIsPatientLoading(true);
        await apiClient.delete(API_PATHS.PATIENT(patient_id));
        setPatients((prev) => {
            return {
                ...prev,
                total_results: prev.total_results - 1,
                results: prev.results.filter((patient: Patient) => patient.id != patient_id),
            }
        })
        navigate(UI_PATHS.PATIENTS());
        setIsPatientLoading(false);
    }

    const handleLoadMore = () => {
        const nextPage = patients.current_page_number + 1;
        const hasMore = nextPage <= Math.ceil(patients.total_results / DEFAULT_PAGE_SIZE);
        if (hasMore) {
            fetchPatients(nextPage, true);
        }
    }

    if (!patient_id) {
        const firstPatientId = patients.results[0]?.id;
        if (firstPatientId) {
            return <Navigate to={UI_PATHS.PATIENT({ params: { patient_id: firstPatientId } })} replace />;
        }
    }

    return (
        <>
            <div className="flex h-full min-h-0 w-full gap-4 p-4">
                <div className="w-1/4">
                    <PatientsList
                        isPatientsLoading={isPatientsLoading}
                        patients={patients.results}
                        totalPatients={patients.total_results}
                        activePatient={activePatient}
                        handlePatientClick={handlePatientClick}
                        onLoadMore={handleLoadMore}
                    />
                </div>

                <div className="relative w-0 grow">
                    <PatientDetails
                        patient={activePatient}
                        handleDeletePatient={handleDeletePatient}
                    />
                    {
                        isPatientLoading && (
                            <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/25">
                                <Loading size="lg" />
                            </div>
                        )
                    }
                </div>
            </div>
            {isFileUploadOpen && (
                <FileUpload
                    onBatchUploadComplete={handleBatchUploadComplete}
                />
            )}
        </>

    );
}

export default Home;