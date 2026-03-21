import type { UserRole } from "../../../types/forms/getStartedForm.types";
import { useEffect, useState } from "react";

export const useRoleSelection = (initialRole: UserRole = null) => {
    const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

    const resetRole = () => setSelectedRole(null);

    useEffect(() => {
        console.log("Selected role: ", selectedRole);
    }, [selectedRole]);

    return { selectedRole, setSelectedRole, resetRole };
};