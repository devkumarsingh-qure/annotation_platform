import { createContext } from "react";

type ModalContextType = {
    isFileUploadOpen: boolean;
    setIsFileUploadOpen: (isOpen: boolean) => void;
}

export const ModalContext = createContext<ModalContextType>({
    isFileUploadOpen: false,
    setIsFileUploadOpen: () => { }
});
