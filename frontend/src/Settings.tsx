import { useNavigate } from "react-router-dom";

import { AuthCtx } from "./auth/AuthProvider";
import { ROUTES } from "./constants";
import notify from "./Notify";

type SettingsProps = {
  userAuthState: AuthCtx["authenticationState"];
  handleDeleteUser: () => Promise<unknown>;
};

const Settings = (props: React.PropsWithChildren<SettingsProps>) => {
  const navigate = useNavigate();
  const onClickDelete = () => {
    const deleteConfirm = confirm("Are you sure you want to delete your account?");
    if (deleteConfirm) {
      props
        .handleDeleteUser()
        .then(() => {
          navigate(ROUTES.ROOT, { replace: true });
        })
        .catch((err) => {
          console.error(err);
          notify({
            title: "Failed to delete your account",
            type: "error",
          });
        });
    }
  };
  return (
    <div>
      <div className="px-4 sm:px-0">
        <h3 className="text-base font-semibold leading-7 text-gray-900">User Settings</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          Perform user level functions
        </p>
      </div>
      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          {/* <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">
              Revoke current applications
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <button></button>
            </dd>
          </div> */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Delete Account</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <button
                className="disabled:cursor-not-allowed disabled:bg-slate-300  rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={onClickDelete}
              >
                Delete
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Settings;
