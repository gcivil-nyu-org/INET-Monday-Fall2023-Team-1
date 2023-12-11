import { Popover, Transition } from "@headlessui/react";
import { BellIcon, NoSymbolIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { Fragment, useEffect, useState } from "react";

import { API_ROUTES } from "./constants";
import useInterval from "./hooks/useInterval";
import { classNames } from "./utils";

type Notification = {
  id: string;
  created_at: string;
  updated_at: string;
  data: NotificationData;
};

type NotificationData = {
  job_id: string;
  owner_id: string;
  sitter_id: string;
  content: {
    title: string;
    message: string;
  };
};

type NotificationProps = {
  currentUserId: string;
};

const NotificationsView = ({ currentUserId }: NotificationProps) => {
  const [currentNotifications, setCurrentNotifications] = useState<Notification[]>([]);

  useInterval(() => {
    axios
      .get(API_ROUTES.NOTIFICATIONS)
      .then((response) => {
        if (response.status === 200) {
          if (response.data?.data?.["notifications"].length) {
            const filteredNotifications = response.data?.data?.["notifications"].reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (acc: Notification[], notif: any) => {
                const notifContent = JSON.parse(
                  notif.data as unknown as string
                ) as NotificationData;
                if (notifContent.sitter_id === currentUserId) {
                  return [...acc, { ...notif, data: notifContent }];
                }
                return acc;
              },
              [] as Notification[]
            );
            console.log(filteredNotifications);
            setCurrentNotifications(filteredNotifications);
          }
        }
      })
      .catch((err) => {
        console.error("failed to the latest notifications", err);
      });
  }, 3000);

  useEffect(() => {
    if (currentNotifications.length) {
      console.log(currentNotifications);
    }
  }, [currentNotifications.length]);

  return (
    <>
      <Popover className="relative">
        <Popover.Button className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 outline-none">
          <BellIcon
            className={classNames(
              "h-7 w-7 mt-2 rounded-full",
              currentNotifications.length ? "bg-red-400 text-white" : ""
            )}
            aria-hidden="true"
          />
        </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-3/4 px-4">
            <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
              <div className="p-4">
                {!currentNotifications.length ? (
                  <div className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                    <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <NoSymbolIcon
                        className="h-6 w-6 text-gray-600 group-hover:text-indigo-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        No New Notifications
                        <span className="absolute inset-0" />
                      </span>
                      <p className="mt-1 text-gray-600 prose">Check again after a little while</p>
                    </div>
                  </div>
                ) : (
                  currentNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <SquaresPlusIcon
                          className="h-6 w-6 text-gray-600 group-hover:text-indigo-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {item.data.content.title}
                          <span className="absolute inset-0" />
                        </span>
                        <p className="mt-1 text-gray-600 prose">{item.data.content.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </>
  );
};

export default NotificationsView;
