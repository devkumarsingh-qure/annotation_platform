import type { ProjectDetailType } from "../../../types/Workspace";

export function patchPatientCount(
    prev: ProjectDetailType,
    delta: number,
): ProjectDetailType {
    return {
        ...prev,
        patient_count: Math.max(0, prev.patient_count + delta),
    };
}

export function patchMemberCount(
    prev: ProjectDetailType,
    delta: number,
): ProjectDetailType {
    return {
        ...prev,
        member_count: Math.max(0, prev.member_count + delta),
    };
}
