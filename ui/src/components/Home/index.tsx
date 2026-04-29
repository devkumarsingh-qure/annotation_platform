import { useContext, useEffect, useState } from "react";
import { ModalContext } from "../../contexts/modal/modalContext";
import FileUpload from "../Modals/FileUpload";
import type { Patient } from "../../types/Patient";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import PatientsList from "./PatientsList";
import PatientDetails from "./PatientDetails";
import { useNavigate, useParams } from "react-router-dom";
import type { PaginatedResponse } from "../../types/PaginatedResponse";
import { DEFAULT_PAGE_SIZE } from "../../utils/constants";

function Home() {
    const navigate = useNavigate();
    const { patient_id } = useParams();

    const { isFileUploadOpen } = useContext(ModalContext);

    const [isPatientsLoading, setIsPatientsLoading] = useState(true);
    const [patients, setPatients] = useState<PaginatedResponse<Patient>>({
        current_page_number: 0,
        page_size: DEFAULT_PAGE_SIZE,
        total_results: 0,
        results: [],
    });

    const activePatient = patients.results.find((patient: Patient) => patient.id == patient_id);

    useEffect(() => {
        fetchPatients().finally(() => {
            setIsPatientsLoading(false);
        });
    }, []);

    const fetchPatients = async () => {
        const response = await apiClient.get(API_PATHS.PATIENTS({
            page: patients.current_page_number + 1,
            page_size: patients.page_size,
        }));
        setPatients({
            current_page_number: response.data.current_page_number,
            page_size: response.data.page_size,
            total_results: response.data.total_results,
            results: [...patients.results, ...response.data.results],
        });
    }

    const handlePatientClick = (patient: Patient) => {
        navigate(UI_PATHS.PATIENT({ params: { patient_id: patient.id } }));
    }

    return (
        <>
            <div className="flex h-full min-h-0 w-full gap-4 p-4">
                <div className="w-1/3">
                    <PatientsList
                        isPatientsLoading={isPatientsLoading}
                        patients={patients.results}
                        totalPatients={patients.total_results}
                        activePatient={activePatient}
                        handlePatientClick={handlePatientClick}
                        onLoadMore={fetchPatients}
                    />
                </div>

                <div className="w-0 grow">
                    {activePatient && <PatientDetails patient={activePatient} />}
                </div>
            </div>
            {isFileUploadOpen && (
                <FileUpload
                    onUploadComplete={fetchPatients}
                />
            )}
        </>

    );
}

export default Home;