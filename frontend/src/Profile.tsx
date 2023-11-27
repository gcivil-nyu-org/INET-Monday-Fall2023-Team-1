// import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Tab } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AuthCtx } from "./auth/AuthProvider";
import { API_ROUTES } from "./constants";
import notify from "./Notify";
import { User, UserTypes } from "./types";
import UserTypeBadge from "./UserTypeBadge";
import { classNames, getCurrentAge } from "./utils";

type ProfileProps = {
  userAuthState: AuthCtx["authenticationState"];
  handleLogout: () => void;
};

const Profile = ({ handleLogout }: React.PropsWithChildren<ProfileProps>) => {
  // const navigate = useNavigate();

  const [email, updateEmail] = useState("");
  const [currentUserInfoInDB, updateCurrentUserInfoInDB] = useState<User>();
  const [firstName, updateFirstName] = useState("");
  const [lastName, updateLastName] = useState("");
  const [dateOfBirth, updateDateOfBirth] = useState<string | null>(null);
  const [about, updateAbout] = useState("");
  const [qualifications, updateQualifications] = useState("");
  const [userTypes, updateUserTypes] = useState<UserTypes[]>([]);
  const [phoneNumber, updatePhoneNumber] = useState("");

  const hasSitterUserType = useMemo(() => {
    if (userTypes.find((u) => u === "sitter")) {
      return true;
    }
    return false;
  }, [userTypes]);

  const resetToDBState = () => {
    if (currentUserInfoInDB) {
      updateFirstName(currentUserInfoInDB.first_name);
      updateLastName(currentUserInfoInDB.last_name);
      updateDateOfBirth(currentUserInfoInDB.date_of_birth ?? null);
      updateAbout(currentUserInfoInDB.about);
      updateQualifications(currentUserInfoInDB.qualifications);
      updatePhoneNumber(currentUserInfoInDB.phone_number);
    }
  };

  useEffect(() => {
    axios
      .get(API_ROUTES.USER.USER_ROOT)
      .then((response) => {
        if (response.status === 200) {
          const userInfo = response.data.data as User;
          updateCurrentUserInfoInDB(userInfo);
        }
      })
      .catch((err) => {
        notify({
          title: "Failed to fetch user profile information",
          type: "error",
          children: <>You&apos;re probably logged out or Cookies weren&apos;t set properly</>,
        });
        console.error(err);
        handleLogout();
      });
  }, []);

  useEffect(() => {
    if (currentUserInfoInDB) {
      updateEmail(currentUserInfoInDB.email);
      updateFirstName(currentUserInfoInDB.first_name);
      updateLastName(currentUserInfoInDB.last_name);
      updateDateOfBirth(currentUserInfoInDB.date_of_birth ?? null);
      updateAbout(currentUserInfoInDB.about);
      updateQualifications(currentUserInfoInDB.qualifications);
      updateUserTypes(currentUserInfoInDB.user_type as UserTypes[]);
      updatePhoneNumber(currentUserInfoInDB.phone_number);
    }
  }, [
    currentUserInfoInDB?.about,
    currentUserInfoInDB?.date_of_birth,
    currentUserInfoInDB?.first_name,
    currentUserInfoInDB?.last_name,
    currentUserInfoInDB?.about,
    currentUserInfoInDB?.qualifications,
    currentUserInfoInDB?.phone_number,
  ]);

  const enableSaveButton = useMemo(() => {
    if (!currentUserInfoInDB) {
      return false;
    }

    return _.isEqual(currentUserInfoInDB, {
      email: email,
      first_name: firstName,
      id: currentUserInfoInDB.id,
      last_name: lastName,
      user_type: currentUserInfoInDB.user_type,
      date_of_birth: dateOfBirth ?? null,
      about: about,
      qualifications: qualifications,
      phone_number: phoneNumber,
      created_at: currentUserInfoInDB.created_at,
      updated_at: currentUserInfoInDB.updated_at,
    });
  }, [firstName, lastName, dateOfBirth, about, qualifications, currentUserInfoInDB]);

  const onClickCancel = () => {
    if (!currentUserInfoInDB) {
      return;
    }
    const cancelConsent = confirm("Are you sure you want to discard these changes?");
    if (cancelConsent) {
      updateFirstName(currentUserInfoInDB.first_name);
      updateLastName(currentUserInfoInDB.last_name);
      updateDateOfBirth(currentUserInfoInDB.date_of_birth ?? null);
      updateAbout(currentUserInfoInDB.about);
      updateQualifications(currentUserInfoInDB.qualifications);
      updatePhoneNumber(currentUserInfoInDB.phone_number);
    }
  };

  const onClickSave = () => {
    if (!currentUserInfoInDB) {
      return;
    }

    const saveConsent = confirm("Are you sure you want to make these changes?");

    if (saveConsent) {
      if (dateOfBirth) {
        const currentAge = getCurrentAge(dateOfBirth);
        if (currentAge < 16) {
          notify({
            title: "Users under the age of 16 are not allowed",
            type: "error",
          });
          resetToDBState();
          return;
        }
      }
      const newUserInfo: User = {
        email,
        first_name: firstName,
        id: currentUserInfoInDB.id,
        last_name: lastName,
        user_type: currentUserInfoInDB.user_type, // TODO: make this also editable
        date_of_birth: dateOfBirth ?? null,
        about,
        qualifications,
        phone_number: phoneNumber,
        created_at: currentUserInfoInDB.created_at,
        updated_at: currentUserInfoInDB.updated_at,
      };

      axios
        .put(API_ROUTES.USER.USER_ROOT, JSON.stringify(newUserInfo))
        .then((response) => {
          updateCurrentUserInfoInDB(response.data.data);
          toast.success("Updated profile successfully");
        })
        .catch((err) => {
          console.error(err);
          notify({
            title: "failed to update user info",
            type: "error",
            children: <>{JSON.stringify({ err })}</>,
          });
        });
    }
  };

  return (
    <>
      <Tab.Group>
        <Tab.List className="w-full rounded-lg text-sm font-medium leading-5 text-blue-700 py-4">
          <Tab
            className={({ selected }) =>
              classNames(
                selected ? "rounded-sm shadow-inner" : "bg-slate-200 text-black",
                "w-1/2 p-3"
              )
            }
          >
            View Profile
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                selected ? "rounded-sm shadow-inner" : "bg-slate-200 text-black",
                "w-1/2 p-3"
              )
            }
          >
            Edit Profile
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <div>
              <div className="px-4 sm:px-0">
                <h3 className="text-base font-semibold leading-7 text-gray-900">
                  Profile Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                  Personal details and other information.
                </p>
              </div>
              <div className="mt-6 border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Full name</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {firstName}&nbsp;{lastName}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">User Types</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {userTypes.map((ut) => (
                        <UserTypeBadge userType={ut} key={ut} />
                      ))}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Email address</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {email}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Date of Birth</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {dateOfBirth ?? ""}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">About</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {about}
                    </dd>
                  </div>
                  {hasSitterUserType ? (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-gray-900">
                        Qualifications
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {qualifications}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Profile</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  This information might be displayed publicly and shared with other users on the
                  app. Please be vary of what you share on the app.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      First name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="first-name"
                        id="first-name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => updateFirstName(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Last name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="last-name"
                        id="last-name"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => updateLastName(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      className="block text-sm font-medium leading-6 text-gray-900"
                      htmlFor="date_of_birth"
                    >
                      Date of Birth
                    </label>
                    <div className="mt-2">
                      {/* NOTE: use <input type="datetime-local"> for date with timestamps */}
                      <input
                        type="date"
                        value={dateOfBirth ?? undefined}
                        onChange={(e) => updateDateOfBirth(e.target.value)}
                        id="date_of_birth"
                        name="date_of_birth"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Email
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="email"
                        id="email"
                        autoComplete="family-name"
                        value={email}
                        onChange={(e) => updateEmail(e.target.value)}
                        disabled
                        className="disabled:bg-slate-200 disabled:cursor-not-allowed block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="about"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      About
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="about"
                        name="about"
                        rows={3}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={about}
                        onChange={(e) => updateAbout(e.target.value)}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      Write a few sentences about your experiences and yourself.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="phone-number"
                      className="block text-sm font-semibold leading-6 text-gray-900"
                    >
                      Phone number
                    </label>
                    <div className="relative mt-2.5">
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <label htmlFor="country" className="sr-only">
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          className="h-full rounded-md border-0 bg-transparent bg-none py-0 pl-4 pr-9 text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                        >
                          <option>US</option>
                        </select>
                        <ChevronDownIcon
                          className="pointer-events-none absolute right-3 top-0 h-full w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </div>
                      <input
                        type="tel"
                        name="phone-number"
                        id="phone-number"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) => updatePhoneNumber(e.target.value)}
                        className="block w-full rounded-md border-0 px-3.5 py-2 pl-20 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  {userTypes.find((userType) => userType === "sitter") ? (
                    <>
                      <div className="col-span-full">
                        <label
                          htmlFor="qualifications"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Qualifications
                        </label>
                        <div className="mt-2">
                          <textarea
                            id="qualifications"
                            name="qualifications"
                            rows={3}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={qualifications}
                            onChange={(e) => updateQualifications(e.target.value)}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          Write a few sentences about your qualifications as a Sitter.
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                className="disabled:cursor-not-allowed text-sm font-semibold leading-6 text-gray-900"
                onClick={onClickCancel}
                disabled={enableSaveButton}
              >
                Cancel
              </button>
              <button
                disabled={enableSaveButton}
                onClick={onClickSave}
                type="submit"
                className="disabled:cursor-not-allowed disabled:bg-slate-300  rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save
              </button>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

export default Profile;
