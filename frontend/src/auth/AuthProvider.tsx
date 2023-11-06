import ReactJson from "@microlink/react-json-view";
import axios from "axios";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { API_ROUTES, ROUTES } from "../constants";
import notify from "../Notify";

interface AuthenticationState {
  isSessionSet: boolean;
  sessionCheckLoading: boolean;
}

export interface AuthCtx {
  authenticationState: AuthenticationState;
  onRegister: (email: string, password: string, userTypes: ("sitter" | "owner")[]) => void;
  onLogin: (email: string, password: string) => void;
  onLogout: () => void;
  passwordReset: {
    onPasswordResetInit: (email: string) => void;
    onPasswordResetConfirmToken: (token: string) => Promise<boolean>;
    onPasswordResetChangePassword: (password: string, token: string) => Promise<boolean>;
  };
  authenticatedUserChecks: {
    checkAuthenticationState: (withToast?: boolean, withRedirect?: boolean) => void;
    checkUserInfo: () => void;
  };
  onDeleteUser: () => Promise<unknown>;
}

const AuthContext = React.createContext<AuthCtx>({} as AuthCtx);

const AuthProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [authState, updateAuthState] = React.useState<AuthenticationState>({
    isSessionSet: false,
    sessionCheckLoading: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    handleSession(false);
  }, []);

  const handleRegister = (email: string, password: string, userTypes: ("sitter" | "owner")[]) => {
    axios
      .post(
        API_ROUTES.AUTH.REGISTER,
        JSON.stringify({
          email,
          password,
          user_type: userTypes,
        }),
        {
          withCredentials: true,
          maxBodyLength: Infinity,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        if (response.status === 201) {
          toast.success(
            `An account has been created for ${
              response.data?.data?.email ?? ""
            }. Redirecting to login page...`
          );
          navigate("/login");
        }
      })
      .catch((error) => {
        notify({
          title: "Failed to create an account",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={error?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
      });
  };

  const handleLogin = (email: string, password: string) => {
    axios
      .post(
        API_ROUTES.AUTH.LOGIN,
        JSON.stringify({
          email,
          password,
        }),
        {
          maxBodyLength: Infinity,
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        if (response.status === 200) {
          updateAuthState({
            isSessionSet: true,
            sessionCheckLoading: false,
          });
          toast.success("Logged in!");
          navigate(ROUTES.PROTECTED_ROUTES.HOME);
        }
      })
      .catch((error) => {
        notify({
          title: "Failed to login",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={error?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
      });
  };

  const handleLogout = () => {
    axios
      .post(API_ROUTES.AUTH.LOGOUT, undefined, {
        withCredentials: true,
        maxBodyLength: Infinity,
      })
      .then((resp) => {
        if (resp.status === 200) {
          updateAuthState({
            isSessionSet: false,
            sessionCheckLoading: false,
          });
          toast.success("logged out successfully");
          navigate(ROUTES.LOGIN);
        }
      })
      .catch((err) => {
        console.error(err);
        notify({
          title: "Failed to logout",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              {err?.response?.headers?.["content-type"] === "application/json" ? (
                <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
              ) : (
                "{}"
              )}
            </details>
          ),
        });
      });
  };

  const handleForgotPasswordInit = (email: string) => {
    axios
      .post(
        API_ROUTES.AUTH.FORGOT_PASSWORD.INIT_RESET_PASSWORD,
        JSON.stringify({
          email,
        }),
        {
          withCredentials: true,
          maxBodyLength: Infinity,
        }
      )
      .then((resp) => {
        if (resp.status === 200) {
          toast.success("Check your email for the next steps!");
          navigate(ROUTES.ROOT);
        }
      })
      .catch((err) => {
        notify({
          title: "Failed to initiate reset password process",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
      });
  };

  const handleForgotPasswordConfirmToken = (token: string) => {
    return axios
      .post(
        API_ROUTES.AUTH.FORGOT_PASSWORD.VERIFY_TOKEN,
        JSON.stringify({
          token,
        }),
        {
          withCredentials: true,
          maxBodyLength: Infinity,
        }
      )
      .then((resp) => {
        if (resp.status === 200) {
          toast.success("Your password was validated successfully!");
          return true;
        }
        return false;
      })
      .catch((err) => {
        notify({
          title: "Failed to validate token...",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
        navigate(ROUTES.LOGIN, { replace: true });
        return false;
      });
  };

  const handleForgotPasswordChangePassword = (password: string, token: string) => {
    return axios
      .post(
        API_ROUTES.AUTH.FORGOT_PASSWORD.CONFIRM_NEW_PASSWORD,
        JSON.stringify({
          password,
          token,
        }),
        {
          withCredentials: true,
          maxBodyLength: Infinity,
        }
      )
      .then((resp) => {
        if (resp.status === 200) {
          toast.success("Your password has been updated successfully");
          return true;
        }
        return false;
      })
      .catch((err) => {
        notify({
          title: "Failed to validate password...",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
        navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
        return false;
      });
  };

  const handleWhoami = () => {
    axios
      .post(API_ROUTES.AUTH.WHOAMI, undefined, {
        withCredentials: true,
        maxBodyLength: Infinity,
      })
      .then((resp) => {
        if (resp.status === 200) {
          toast.success("user is authenticated");
        }
      })
      .catch((err) => {
        notify({
          title: "Failed to validate authentication",
          type: "error",
          children: (
            <details>
              <summary>View Error Information</summary>
              <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
            </details>
          ),
        });
        updateAuthState({
          isSessionSet: false,
          sessionCheckLoading: false,
        });
        navigate(ROUTES.LOGIN);
      });
  };

  const handleSession = (withToast = false, withRedirect = false) => {
    updateAuthState({
      isSessionSet: false,
      sessionCheckLoading: true,
    });

    axios
      .post(API_ROUTES.AUTH.SESSION, undefined, {
        withCredentials: true,
        maxBodyLength: Infinity,
      })
      .then((resp) => {
        if (resp.status === 200) {
          updateAuthState({
            isSessionSet: true,
            sessionCheckLoading: false,
          });
          if (withToast) {
            toast.success("user session is authenticated and active");
          }
        }
      })
      .catch((err) => {
        if (withToast) {
          notify({
            title: "Failed to validate session",
            type: "error",
            children: (
              <details>
                <summary>View Error Information</summary>
                <ReactJson src={err?.response?.data} collapsed enableClipboard={false} />
              </details>
            ),
          });
        }
        if (withRedirect) {
          navigate(ROUTES.LOGIN);
        }
        updateAuthState({
          isSessionSet: false,
          sessionCheckLoading: false,
        });
      });
  };

  const handleDeleteUser = () => {
    return axios.delete(API_ROUTES.USER.USER_ROOT);
  };

  const contextValue: AuthCtx = {
    authenticationState: authState,
    onRegister: handleRegister,
    onLogin: handleLogin,
    onLogout: handleLogout,
    passwordReset: {
      onPasswordResetInit: handleForgotPasswordInit,
      onPasswordResetConfirmToken: handleForgotPasswordConfirmToken,
      onPasswordResetChangePassword: handleForgotPasswordChangePassword,
    },
    authenticatedUserChecks: {
      checkUserInfo: handleWhoami,
      checkAuthenticationState: handleSession,
    },
    onDeleteUser: handleDeleteUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export { AuthContext };
export default AuthProvider;
