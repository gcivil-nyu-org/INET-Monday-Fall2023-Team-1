import React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect } from "react-router-dom";
import { useCookies } from "react-cookie";

import AuthContext from "./context";

const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [authCookie, updateAuthCookieState] = React.useState<object | null>(null);
    const cookie = useCookies(['csrftoken', 'sessionid']);

    const handleLogin = (username: string, password: string) => {
        axios.post('/login', JSON.stringify({
            username,
            password
        }), {
            withCredentials: true,
            maxBodyLength: Infinity,
        }).then(resp => {
            if (resp.status === 200) {
                toast.success('logging in...');
                updateAuthCookieState(
                    cookie[0]
                )
                redirect('/home');
            }
        }).catch(err => {
            toast.error(<details>
                <summary>There was issue while logging in:</summary>
                {JSON.stringify(err)}
            </details>)
            updateAuthCookieState(null);
        });
    }

    const handleLogout = () => {
        axios.post('/logout', undefined, {
            withCredentials: true,
            maxBodyLength: Infinity,
        }).then(resp => {
            if (resp.status === 200) {
                toast.success('logged out successfully');
                updateAuthCookieState(
                    null
                );
                redirect('/login');
            }
        }).catch(err => {
            toast.error(<details>
                <summary>There was issue while logging in:</summary>
                {JSON.stringify(err)}
            </details>)
            updateAuthCookieState(null);
        });
    };

    const isCookiePresent = () => {
        return authCookie !== null;
    };

    const contextValue = {
        isCookiePresent,
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
