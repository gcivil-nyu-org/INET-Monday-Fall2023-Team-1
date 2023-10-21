import React from "react";

export type AuthCtx = {
    token: string | null;
    onLogin: () => void;
    onLogout: () => void;
};

const AuthContext = React.createContext<AuthCtx | null>(null);

export default AuthContext;
