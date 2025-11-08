import { createContext, useContext } from "react";

const MessageOperationsContext = createContext(null);

export const useMessageOperationsContext = () => {
    const ctx = useContext(MessageOperationsContext);
    if (!ctx) throw new Error("useMessageOps must be used inside MessageOperationsProvider");
    return ctx;
};

export default MessageOperationsContext;
