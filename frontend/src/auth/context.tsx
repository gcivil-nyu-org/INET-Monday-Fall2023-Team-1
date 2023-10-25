import React from "react";

export type AuthCtx = {
    isCookiePresent: () => boolean;
    onLogin: (username: string, password: string) => void;
    onLogout: () => void;
};

const AuthContext = React.createContext<AuthCtx | null>(null);

export default AuthContext;
