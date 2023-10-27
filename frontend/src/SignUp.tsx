import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import FurBabyLogo from "./FurbabyLogo";
import { ROUTES } from "./constants";

type SignUpProps = {
  op: "login" | "signup";
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, userTypes: ("owner" | "sitter")[]) => void;
};

const SignUp = ({ op, onLogin, onRegister }: SignUpProps) => {
  const opText = op === "login" ? "Sign In" : "Create an account";

  const navigate = useNavigate();

  const { pathname } = useLocation();
  const [email, updateEmail] = useState("");
  const [password, updatePassword] = useState("");
  const [isPetSitter, updateIsPetSitter] = useState(false);
  const [isPetOwner, updateIsPetOwner] = useState(false);

  const resetStates = () => {
    updateEmail("");
    updatePassword("");
    updateIsPetOwner(false);
    updateIsPetSitter(false);
  };

  useEffect(() => {
    resetStates();
  }, [pathname]);

  const enableButton = useMemo(() => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const disableSignUpButton =
      trimmedEmail.length && trimmedPassword.length && (isPetOwner || isPetSitter);
    const disableLoginButton = trimmedEmail.length && trimmedPassword.length;

    if (op === "signup") {
      return disableSignUpButton;
    }
    return disableLoginButton;
  }, [email, password, isPetOwner, isPetSitter, op]);

  const onClickSubmit = () => {
    let requestBody: any = {};
    if (pathname === "/signup") {
      let userTypes = [];
      if (isPetOwner) {
        userTypes.push("owner");
      }
      if (isPetSitter) {
        userTypes.push("sitter");
      }
      requestBody = {
        email: email,
        password,
        user_type: userTypes,
      };
    } else {
      requestBody = {
        email,
        password,
      };
    }

    if (pathname === "/signup") {
      onRegister(requestBody.email, requestBody.password, requestBody.userTypes);
    } else if (pathname === "/login") {
      onLogin(requestBody.email, requestBody.password);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="hover:cursor-pointer" onClick={() => navigate(ROUTES.ROOT)}>
            <FurBabyLogo className="mx-auto h-10 w-auto " />
          </div>
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            {opText}
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Password
                </label>
                {op === "login" && (
                  <div className="text-sm">
                    <Link
                      to={ROUTES.FORGOT_PASSWORD}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => updatePassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {op === "signup" && (
              <div className="mt-10 space-y-10">
                <fieldset>
                  <legend className="text-sm font-semibold leading-6 text-gray-900">
                    User Type Preferrence
                  </legend>
                  <div className="mt-6 space-y-6">
                    <div className="relative flex gap-x-3">
                      <div className="flex h-6 items-center">
                        <input
                          id="pet-sitter"
                          name="pet-sitter"
                          type="checkbox"
                          checked={isPetSitter}
                          onChange={(e) => updateIsPetSitter(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label htmlFor="pet-sitter" className="font-medium text-gray-900">
                          Pet Sitter
                        </label>
                        <p className="text-gray-500">
                          You can sit any pet in NYC as long as you're a student at NYU
                        </p>
                      </div>
                    </div>
                    <div className="relative flex gap-x-3">
                      <div className="flex h-6 items-center">
                        <input
                          id="pet-owner"
                          name="pet-owner"
                          type="checkbox"
                          checked={isPetOwner}
                          onChange={(e) => updateIsPetOwner(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label htmlFor="pet-owner" className="font-medium text-gray-900">
                          Pet Owner
                        </label>
                        <p className="text-gray-500">
                          Choose sitters for the best care of your pets while in NYC
                        </p>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            <div>
              <button
                // type="submit" # TODO: enable this for enter
                onClick={onClickSubmit}
                disabled={!enableButton}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Sign&nbsp;{op === "login" ? "in" : "up"}
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            {op === "login" ? "Not a " : "Already a "}member?{" "}
            <Link
              to={op === "login" ? "/signup" : "/login"}
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
            >
              Sign&nbsp;{op !== "login" ? "in" : "up"}&nbsp;here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;
