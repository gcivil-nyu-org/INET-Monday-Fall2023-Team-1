import React from "react";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { classNames } from "./utils";

type AlertProps = {
  title: string;
  type?: "normal" | "error" | "success";
};

const notify = ({ title, type = "normal", children }: React.PropsWithChildren<AlertProps>) => {
  return toast.custom((t) => {
    return (
      <div
        className={classNames(
          t.visible ? "animate-enter" : "animate-leave",
          "max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5"
        )}
      >
        <div
          className={classNames(
            `flex-1 w-0 p-4`,
            type === "normal" ? "bg-slate-200" : "",
            type === "error" ? "bg-red-300" : "",
            type === "success" ? "bg-green-300" : ""
          )}
        >
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <div
                className={classNames(
                  type === "normal" ? "text-gray-900" : "text-white",
                  "text-md font-bold"
                )}
              >
                {title}
              </div>
              <div className="mt-1 text-sm text-gray-500 overflow-auto">{children}</div>
            </div>
          </div>
        </div>
        <div
          className="flex border-l border-gray-200 bg-white hover:cursor-pointer"
          onClick={() => toast.dismiss(t.id)}
        >
          <div className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium">
            <XMarkIcon className="block h-6 w-6" />
          </div>
        </div>
      </div>
    );
  });
};

export default notify;
