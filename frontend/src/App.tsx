import React, { useContext, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AuthContext, AuthProvider } from "./auth";
import { ROUTES } from "./constants";
import ForgotPassword from "./ForgotPassword";
import Home from "./Home";
import Landing from "./Landing";
import Loading from "./Loading";
import NotFound from "./NotFound";
import SignUp from "./SignUp";
import PetProfiles from "./PetProfiles";
import Jobs from "./Jobs"
import Dashboard from "./Dashboard";


const ProtectedRoute = ({ children }: React.PropsWithChildren<unknown>) => {
  const { authenticationState } = useContext(AuthContext);

  if (!authenticationState.isSessionSet) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  const { onLogin, onRegister, passwordReset, authenticationState, ...rest } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (authenticationState.isSessionSet && ROUTES.FORGOT_PASSWORD !== pathname) {
      if (Object.values(ROUTES.PROTECTED_ROUTES).find((route) => route === pathname)) {
        navigate(pathname, { replace: true });
      } else {
        navigate(ROUTES.PROTECTED_ROUTES.HOME, { replace: true });
      }
    }
  }, [authenticationState.isSessionSet]);

  if (authenticationState.sessionCheckLoading && !authenticationState.isSessionSet) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route
        path="login"
        element={<SignUp op="login" onLogin={onLogin} onRegister={onRegister} />}
      />
      <Route
        path="signup"
        element={<SignUp op="signup" onLogin={onLogin} onRegister={onRegister} />}
      />
      <Route
        path="forgot-password"
        element={<ForgotPassword resetPasswordHandlers={passwordReset} />}
      />
      <Route
        path="home"
        element={
          <ProtectedRoute>
            <Home
              authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="profile"
        element={
          <ProtectedRoute>
            <Home
              authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="settings"
        element={
          <ProtectedRoute>
            <Home
              authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="pet-profiles"
        element={
          <Home
            authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
          />
        }
      />
      <Route
        path="jobs"
        element={
          <Home
            authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
          />
        }
      />
      
      <Route
        path="locations"
        element={
          <ProtectedRoute>
            <Home
              authContext={{ onLogin, onRegister, passwordReset, authenticationState, ...rest }}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
