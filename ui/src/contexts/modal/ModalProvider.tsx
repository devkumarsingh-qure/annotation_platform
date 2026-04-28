import { useState } from "react";
import { ModalContext } from "./modalContext";

function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

    return (
        <ModalContext.Provider value={{
            isFileUploadOpen,
            setIsFileUploadOpen
        }}>
            {children}
        </ModalContext.Provider>
    )
}

export default ModalProvider;