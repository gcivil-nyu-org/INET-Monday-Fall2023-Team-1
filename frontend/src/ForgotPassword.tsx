import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthCtx } from "./auth/AuthProvider";
import { ROUTES } from "./constants";
import FurBabyLogo from "./FurbabyLogo";
import notify from "./Notify";

type ForgotPasswordProps = {
  resetPasswordHandlers: AuthCtx["passwordReset"];
};

const ForgotPassword = ({ resetPasswordHandlers }: ForgotPasswordProps) => {
  const navigate = useNavigate();
  const { search } = useLocation();

  const [email, updateEmail] = useState("");

  const [renderValidate, updateRenderValidateState] = useState(false);
  const [forgotPasswordToken, updateForgotPasswordToken] = useState("");

  const [renderChangePasswordForm, updateRenderChangePasswordFormState] = useState(false);
  const [newPassword, updateNewPassword] = useState("");
  const [confirmNewPassword, updateConfirmNewPassword] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    if (searchParams.has("token")) {
      updateRenderValidateState(true);
      updateForgotPasswordToken(searchParams.get("token") ?? "");
    }
  }, []);

  useEffect(() => {
    if (renderValidate && forgotPasswordToken.length) {
      resetPasswordHandlers
        .onPasswordResetConfirmToken(forgotPasswordToken)
        .then((validToken) => {
          if (validToken) {
            updateRenderValidateState(false);
            updateRenderChangePasswordFormState(true);
          } else {
            notify({
              title: "failed to validate token",
              type: "error",
              children: <>Please check your token or try resetting your password again</>,
            });
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [renderValidate, forgotPasswordToken]);

  const resetStates = () => {
    updateEmail("");
    updateNewPassword("");
    updateConfirmNewPassword("");
  };

  const enableResetButton = useMemo(() => {
    return email.trim().length;
  }, [email]);

  const enableSetPasswordButton = useMemo(() => {
    return newPassword.length && confirmNewPassword.length && newPassword === confirmNewPassword;
  }, [newPassword, confirmNewPassword]);

  const onClickSubmitReset = () => {
    resetPasswordHandlers.onPasswordResetInit(email.trim());
    resetStates();
  };

  const onClickSubmitUpdatePassword = () => {
    resetPasswordHandlers
      .onPasswordResetChangePassword(confirmNewPassword, forgotPasswordToken)
      .then((pwdUpdate) => {
        if (!pwdUpdate) {
          notify({
            title: "Failed to update your password",
            type: "error",
            children: <>Please retry resetting your password again</>,
          });
          navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
          return;
        }
        updateRenderChangePasswordFormState(false);
        updateRenderValidateState(false);
        navigate(ROUTES.LOGIN, { replace: true });
      })
      .catch((err) => console.error(err));
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

      {!renderValidate && !renderChangePasswordForm ? (
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
                onClick={onClickSubmitReset}
                disabled={!enableResetButton}
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
      ) : null}

      {renderValidate && !renderChangePasswordForm ? (
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 font-bold leading-6 shadow">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h3>Please wait while we validate your request...</h3>
            </div>
          </div>
        </div>
      ) : null}

      {!renderValidate && renderChangePasswordForm ? (
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                New Password
              </label>
              <div className="mt-2">
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => updateNewPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Confirm New Password
              </label>
              <div className="mt-2">
                <input
                  id="confirm-new-password"
                  name="confirm-new-password"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => updateConfirmNewPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                onClick={onClickSubmitUpdatePassword}
                disabled={!enableSetPasswordButton}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Update Password
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
      ) : null}
    </div>
  );
};

export default ForgotPassword;
