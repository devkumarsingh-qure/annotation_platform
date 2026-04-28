import { useContext, useEffect, useState } from "react";
import { ModalContext } from "../../contexts/modal/modalContext";
import FileUpload from "../Modals/FileUpload";
import type { Patient } from "../../types/Patient";
import apiClient from "../../utils/apiClient";
import { API_PATHS } from "../../utils/urls";
import PatientsList from "./PatientsList";
import PatientDetails from "./PatientDetails";
import { useNavigate, useParams } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const { patient_id } = useParams();

    const { isFileUploadOpen } = useContext(ModalContext);

    const [patients, setPatients] = useState<Patient[]>([]);

    const activePatient = patients.find((patient: Patient) => patient.id == patient_id);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const response = await apiClient.get(API_PATHS.PATIENTS());
        setPatients(response.data);
    }

    const handlePatientClick = (patient: Patient) => {
        navigate(`/patients/${patient.id}`);
    }

    return (
        <>
            <div className="flex h-full min-h-0 w-full gap-4 p-4">

                <PatientsList
                    patients={patients}
                    activePatient={activePatient}
                    handlePatientClick={handlePatientClick}
                />

                {activePatient && <PatientDetails patient={activePatient} />}
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