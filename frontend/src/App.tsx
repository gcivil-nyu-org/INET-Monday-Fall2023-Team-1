import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './Landing';
import SignUp from './SignUp';
import NotFound from './NotFound';
import Home from './Home';
import { AuthProvider, useAuth } from "./auth";
import ForgotPassword from './ForgotPassword';

const App = () => {
  const authContext = useAuth()

  return (
    <AuthProvider>
      <Routes>
        <Route index element={<Landing />} />
        <Route path='login' element={<SignUp op='login' />} />
        <Route path='signup' element={<SignUp op='signup' />} />
        <Route path="forgot" element={<ForgotPassword />} />
        <Route path='home' element={
          <ProtectedRoute>
            <Home authContext={authContext} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

const ProtectedRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const authContext = useAuth();

  if (!authContext?.token) {
    return (
      <Navigate to='/' replace />
    );
  }

  return (<>{children}</>);
};

export default App;
