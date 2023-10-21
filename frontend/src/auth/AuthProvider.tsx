import React from "react";
import AuthContext from "./context";

const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [authToken, updateTokenState] = React.useState<string | null>(null);

    const handleLogin = async () => {
        const todo = () => { return '' }
        const token = await todo();

        updateTokenState(token);
    }

    const handleLogout = () => {
        updateTokenState(null);
    };

    const contextValue = {
        token: authToken,
        onLogin: handleLogin,
        onLogout: handleLogout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
