import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Landing from './Landing';
import SignUp from './SignUp';
import NotFound from './NotFound';
import Home from './Home';
import { AuthContext, AuthProvider } from "./auth";
import ForgotPassword from './ForgotPassword';
import { CookiesProvider } from 'react-cookie';

const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const authContext = useContext(AuthContext);

  if (authContext?.isCookiePresent && !authContext.isCookiePresent()) {
    return (
      <Navigate to='/login' replace />
    );
  }

  return (<>{children}</>);
};

const AppRouter = () => {
  const { onLogin, onRegister, passwordReset, ...rest } = useContext(AuthContext);

  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path='login' element={<SignUp op='login' onLogin={onLogin} onRegister={onRegister} />} />
      <Route path='signup' element={<SignUp op='signup' onLogin={onLogin} onRegister={onRegister} />} />
      <Route path="forgot" element={<ForgotPassword resetPasswordHandlers={passwordReset} />} />
      <Route path='home' element={
        <ProtectedRoute>
          <Home authContext={{ onLogin, onRegister, passwordReset, ...rest }} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CookiesProvider>
  );
};

export default App;
