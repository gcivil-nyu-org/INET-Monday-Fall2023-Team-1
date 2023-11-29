import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthCtx } from "./auth/AuthProvider";
import { ROUTES } from "./constants";
import FurBabyLogo from "./FurbabyLogo";
import Locations from "./Locations";
import Profile from "./Profile";
import PetProfiles from "./PetProfiles";
import Dashboard from "./Dashboard";
import JobPage from "./Jobs";
import Settings from "./Settings";
import { classNames } from "./utils";
import { User, UserTypes } from "./types";

type HomeProps = {
  authContext: AuthCtx;
};

const Home = (props: React.PropsWithChildren<HomeProps>) => {
  const navigate = useNavigate();

  //console.log("session info: ", props.authContext.authenticationState.sessionInformation);

  const user_type = props.authContext.authenticationState.sessionInformation.user_type;

  //console.log("userType: ", user_type);

  const isPetOwner = user_type?.includes('owner');
  const isPetSitter = user_type?.includes('sitter');

  //console.log("isPetOwner: ", isPetOwner);
  //console.log("isPetSitter: ", isPetSitter);

  // Dynamic navigation links based on user roles
  const [navigation, updatePageNavigationState] = useState(() => {

    const petOwnerLinks = [
      { name: "Jobs", href: ROUTES.PROTECTED_ROUTES.JOBS, keyId: 2, current: true },
      { name: "Pet Profiles", href: ROUTES.PROTECTED_ROUTES.PET_PROFILES, keyId: 3, current: false },
    ];

    const petSitterLinks = [
      { name: "Jobs", href: ROUTES.PROTECTED_ROUTES.DASHBOARD, keyId: 2, current: true },
      { name: "My Applications", href: ROUTES.PROTECTED_ROUTES.HOME, keyId: 3, current: false },
    ];

    return [
      ...(isPetOwner ? petOwnerLinks : []),
      ...(isPetSitter ? petSitterLinks : []),
    ];
  });


  const { pathname } = useLocation();

  const onClickNavButton = (keyId: number) => {
    updatePageNavigationState((prevState) =>
      prevState.map((stateItem) => ({ ...stateItem, current: stateItem.keyId === keyId }))
    );
  };

  const userNavigation = React.useMemo(
    () => [
      {
        name: "Profile",
        onClick: () => {
          navigate(ROUTES.PROTECTED_ROUTES.PROFILE);
        },
      },
      {
        name: "Settings",
        onClick: () => {
          navigate(ROUTES.PROTECTED_ROUTES.SETTINGS);
        },
      },
      {
        name: "Locations",
        onClick: () => {
          navigate(ROUTES.PROTECTED_ROUTES.LOCATIONS);
        },
      },
      {
        name: "Sign out",
        onClick: () => {
          props.authContext.onLogout();
        },
      },
    ],
    [props]
  );

  const pageHeader = useMemo(() => {
    if (pathname === ROUTES.PROTECTED_ROUTES.HOME) {
      return navigation.find((item) => item.current === true)?.name ?? "Dashboard";
    } else if (pathname === ROUTES.PROTECTED_ROUTES.PROFILE) {
      return "Profile";
    } else if (pathname === ROUTES.PROTECTED_ROUTES.SETTINGS) {
      return "Settings";
    } else if (pathname === ROUTES.PROTECTED_ROUTES.LOCATIONS) {
      return "Locations";
    } else if (pathname === ROUTES.PROTECTED_ROUTES.PET_PROFILES) {
      return "Pet Profiles";
    } else if (pathname === ROUTES.PROTECTED_ROUTES.JOBS) {
      return "Jobs";
    }

    return "";
  }, [pathname, navigation]);

  const pageContent = useMemo(() => {
    if (pathname === ROUTES.PROTECTED_ROUTES.HOME) {
      return <Dashboard />;
    } else if (pathname === ROUTES.PROTECTED_ROUTES.PROFILE) {
      return (
        <Profile
          handleLogout={props.authContext.authenticatedUserChecks.checkAuthenticationState}
          userAuthState={props.authContext.authenticationState}
        />
      );
    } else if (pathname === ROUTES.PROTECTED_ROUTES.SETTINGS) {
      return (
        <Settings
          handleDeleteUser={props.authContext.onDeleteUser}
          userAuthState={props.authContext.authenticationState}
          refetchUserInfo={props.authContext.authenticatedUserChecks.checkAuthenticationState}
        />
      );
    } else if (pathname === ROUTES.PROTECTED_ROUTES.LOCATIONS) {
      return <Locations />;
    } else if (pathname === ROUTES.PROTECTED_ROUTES.PET_PROFILES) {
      return <PetProfiles />;
    } else if (pathname === ROUTES.PROTECTED_ROUTES.JOBS) {
      return <JobPage />;
    }
    return "Nothing here to display";
  }, [pathname]);

  useEffect(() => {
    if (pathname !== ROUTES.PROTECTED_ROUTES.HOME) {
      updatePageNavigationState((prevState) =>
        prevState.map((stateItem) => ({ ...stateItem, current: false }))
      );
    }
  }, [pathname]);

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-white">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FurBabyLogo
                        className="h-8 w-8 hover:cursor-pointer"
                        onClick={() => navigate(ROUTES.PROTECTED_ROUTES.HOME)}
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation.map((item, index) => (
                          <Link
                            to={item.href}
                            key={item.name}
                            className={classNames(
                              item.current
                                ? "border-b-2 border-black rounded-none"
                                : "text-grey-700 hover:bg-gray-100 hover:text-grey-400",
                              "rounded-md px-3 py-2 text-sm font-medium"
                            )}
                            aria-current={item.current ? "page" : undefined}
                            onClick={() => onClickNavButton(index + 1)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="relative rounded-full p-1 text-gray-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                      >
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                      {/* Profile dropdown */}
                      <Menu as="div" className="relative ml-3">
                        <div>
                          <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
                            <span className="absolute -inset-1.5" />
                            <span className="sr-only">Open user menu</span>
                            <img
                              className="h-8 w-8 rounded-full"
                              src={
                                props.authContext.authenticationState.sessionInformation
                                  .profilePicture
                              }
                              alt={`profile picuture - user (${props.authContext.authenticationState.sessionInformation.email})`}
                            />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <div
                                    onClick={item.onClick}
                                    className={classNames(
                                      active ? "bg-gray-100" : "",
                                      "block px-4 py-2 text-sm text-gray-700"
                                    )}
                                  >
                                    {item.name}
                                  </div>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="absolute -inset-0.5" />
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                  {navigation.map((item, index) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "block rounded-md px-3 py-2 text-base font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                      onClick={() => onClickNavButton(index + 1)}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="border-t border-gray-700 pb-3 pt-4">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={
                          props.authContext.authenticationState.sessionInformation.profilePicture
                        }
                        alt={`profile picuture - user (${props.authContext.authenticationState.sessionInformation.email})`}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {props.authContext.authenticationState.sessionInformation.name}
                      </div>
                      <div className="text-sm font-medium leading-none text-gray-400">
                        {props.authContext.authenticationState.sessionInformation.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="relative ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="div"
                        onClick={item.onClick}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{pageHeader}</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{pageContent}</div>
        </main>
      </div>
    </>
  );
};

export default Home;
