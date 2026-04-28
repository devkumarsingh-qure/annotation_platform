import { createContext, useState } from "react";

type ModalContextType = {
    isFileUploadOpen: boolean;
    setIsFileUploadOpen: (isOpen: boolean) => void;
}

export const ModalContext = createContext<ModalContextType>({
    isFileUploadOpen: false,
    setIsFileUploadOpen: () => {}
});

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