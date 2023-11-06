// import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Tab } from "@headlessui/react";
// import { PaperClipIcon } from "@heroicons/react/24/outline";
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
  // TODO: profile picture

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
    }
  }, [
    currentUserInfoInDB?.about,
    currentUserInfoInDB?.date_of_birth,
    currentUserInfoInDB?.first_name,
    currentUserInfoInDB?.last_name,
    currentUserInfoInDB?.about,
    currentUserInfoInDB?.qualifications,
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
        // profile_picture?: string;
        date_of_birth: dateOfBirth ?? null,
        about,
        qualifications,
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
                  {/* <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">Attachments</dt>
                    <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <ul
                        role="list"
                        className="divide-y divide-gray-100 rounded-md border border-gray-200"
                      >
                        <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
                          <div className="flex w-0 flex-1 items-center">
                            <PaperClipIcon
                              className="h-5 w-5 flex-shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            <div className="ml-4 flex min-w-0 flex-1 gap-2">
                              <span className="truncate font-medium">
                                resume_back_end_developer.pdf
                              </span>
                              <span className="flex-shrink-0 text-gray-400">2.4mb</span>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href="#"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Download
                            </a>
                          </div>
                        </li>
                        <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
                          <div className="flex w-0 flex-1 items-center">
                            <PaperClipIcon
                              className="h-5 w-5 flex-shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            <div className="ml-4 flex min-w-0 flex-1 gap-2">
                              <span className="truncate font-medium">
                                coverletter_back_end_developer.pdf
                              </span>
                              <span className="flex-shrink-0 text-gray-400">4.5mb</span>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href="#"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Download
                            </a>
                          </div>
                        </li>
                      </ul>
                    </dd>
                  </div> */}
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

                  {/* <div className="col-span-full">
              <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                Photo
              </label>
              <div className="mt-2 flex items-center gap-x-3">
                <UserCircleIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />
                <button
                  type="button"
                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Change
                </button>
              </div>
            </div> */}

                  {/* <div className="col-span-full">
              <label
                htmlFor="cover-photo"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Cover photo
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div> */}
                </div>
              </div>

              {/* <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Use a permanent address where you can receive mail.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
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
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
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
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="country"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Country
              </label>
              <div className="mt-2">
                <select
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="street-address"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Street address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="street-address"
                  id="street-address"
                  autoComplete="street-address"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2 sm:col-start-1">
              <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="city"
                  id="city"
                  autoComplete="address-level2"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="region" className="block text-sm font-medium leading-6 text-gray-900">
                State / Province
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="region"
                  id="region"
                  autoComplete="address-level1"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="postal-code"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                ZIP / Postal code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="postal-code"
                  id="postal-code"
                  autoComplete="postal-code"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div> */}

              {/* <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            We&apos;ll always let you know about important changes, but you pick what else you want
            to hear about.
          </p>

          <div className="mt-10 space-y-10">
            <fieldset>
              <legend className="text-sm font-semibold leading-6 text-gray-900">By Email</legend>
              <div className="mt-6 space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="comments"
                      name="comments"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="comments" className="font-medium text-gray-900">
                      Comments
                    </label>
                    <p className="text-gray-500">
                      Get notified when someones posts a comment on a posting.
                    </p>
                  </div>
                </div>
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="candidates"
                      name="candidates"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="candidates" className="font-medium text-gray-900">
                      Candidates
                    </label>
                    <p className="text-gray-500">
                      Get notified when a candidate applies for a job.
                    </p>
                  </div>
                </div>
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="offers"
                      name="offers"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="offers" className="font-medium text-gray-900">
                      Offers
                    </label>
                    <p className="text-gray-500">
                      Get notified when a candidate accepts or rejects an offer.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold leading-6 text-gray-900">
                Push Notifications
              </legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                These are delivered via SMS to your mobile phone.
              </p>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-x-3">
                  <input
                    id="push-everything"
                    name="push-notifications"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label
                    htmlFor="push-everything"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Everything
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="push-email"
                    name="push-notifications"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label
                    htmlFor="push-email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Same as email
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="push-nothing"
                    name="push-notifications"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label
                    htmlFor="push-nothing"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    No push notifications
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
        </div> */}
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
