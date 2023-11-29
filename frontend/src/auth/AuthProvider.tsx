import ReactJson from "@microlink/react-json-view";
import axios from "axios";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { API_ROUTES, DEFAULT_PROFILE_PICTURE, ROUTES } from "../constants";
import notify from "../Notify";

type UserSession = {
  name: string;
  email: string;
  id: string;
  profilePicture: string;
  user_type?: ("sitter" | "owner")[];
};

interface AuthenticationState {
  isSessionSet: boolean;
  sessionInformation: UserSession;
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
    sessionInformation: {
      id: "",
      profilePicture: DEFAULT_PROFILE_PICTURE,
      name: "",
      email: "",
      user_type: [],
    },
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
          updateAuthState((prevState) => ({
            ...prevState,
            isSessionSet: true,
            sessionCheckLoading: false,
          }));
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
          updateAuthState((prevState) => ({
            ...prevState,
            isSessionSet: false,
            sessionCheckLoading: false,
          }));
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
          toast.success("Your token was validated successfully!");
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
        updateAuthState((prevState) => ({
          ...prevState,
          isSessionSet: false,
          sessionCheckLoading: false,
        }));
        navigate(ROUTES.LOGIN);
      });
  };

  const handleSession = (withToast = false, withRedirect = false) => {
    updateAuthState((prevState) => ({
      ...prevState,
      isSessionSet: false,
      sessionCheckLoading: true,
    }));

    axios
      .post(API_ROUTES.AUTH.SESSION, undefined, {
        withCredentials: true,
        maxBodyLength: Infinity,
      })
      .then((resp) => {
        if (resp.status === 200) {
          updateAuthState((prevState) => ({
            ...prevState,
            isSessionSet: true,
            sessionCheckLoading: false,
            sessionInformation: {
              ...prevState.sessionInformation,
              ...resp.data.data.user,
            },
          }));

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
        updateAuthState((prevState) => ({
          ...prevState,
          isSessionSet: false,
          sessionCheckLoading: false,
        }));
      });
  };

  const handleDeleteUser = () => {
    return axios.delete(API_ROUTES.USER.USER_ROOT);
  };

  useEffect(() => {
    if (authState.isSessionSet) {
      axios
        .get(API_ROUTES.USER.PROFILE_PICTURE, {
          responseType: "blob",
        })
        .then((response) => {
          if (response.status === 404) {
            toast("You can set a profile picture from the user settings page");
          } else if (response.status === 200) {
            updateAuthState((prevState) => ({
              ...prevState,
              sessionInformation: {
                ...prevState.sessionInformation,
                profilePicture: URL.createObjectURL(response.data),
              },
            }));
          }
        })
        .catch((err) => {
          console.error("failed to fetch user profile picture", err);
        });
    }
  }, [authState.isSessionSet]);

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
