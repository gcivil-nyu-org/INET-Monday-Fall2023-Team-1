import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FurBabyLogo from "./FurbabyLogo";
import { AuthCtx } from "./auth/AuthProvider";
import { ROUTES } from "./constants";

type ForgotPasswordProps = {
  resetPasswordHandlers: AuthCtx["passwordReset"];
};

const ForgotPassword = ({ resetPasswordHandlers }: ForgotPasswordProps) => {
  const navigate = useNavigate();
  const [email, updateEmail] = useState("");
  // const [newPassword, updateNewPassword] = useState('');
  // const [confirmNewPassword, updateConfirmNewPassword] = useState('');

  const resetStates = () => {
    updateEmail("");
    // updateNewPassword('');
    // updateConfirmNewPassword('');
  };

  const enableButton = useMemo(() => {
    const trimmedEmail = email.trim();
    return trimmedEmail.length;
  }, [email]);

  const onClickSubmit = () => {
    resetPasswordHandlers.onPasswordResetInit(email.trim());
    resetStates();
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="hover:cursor-pointer" onClick={() => navigate(ROUTES.ROOT)}>
          <FurBabyLogo className="mx-auto h-10 w-auto " />
        </div>
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Forgot Password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => updateEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              onClick={onClickSubmit}
              // type="submit"
              disabled={!enableButton}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Reset Password
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Remembered something?{" "}
          <Link
            to="/login"
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Click here to try again
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
