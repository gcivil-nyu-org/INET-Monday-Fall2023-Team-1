import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { API_ROUTES } from "./constants";

interface User {
  id: string;
  username: string;
  date_of_birth: string;
  experience: string;
  qualifications: string;
  phone_number: string;
  email: string;
}

interface Application {
  id: string;
  status: string;
  user: User;
  job: string;
  details: string;
  // Add more fields as needed
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  handleAccept: (applicationId: string, jobId: string) => void;
}

const updateJobStatus = async (jobId: string) => {
  try {
    // Assuming you have a 'status' variable representing the new status
    const newStatus = "acceptance_complete"; // Replace this with your desired status

    const response = await axios.put(`${API_ROUTES.JOBS}`, {
      id: jobId,
      status: newStatus,
    });

    if (response.status === 200) {
      toast.success(`Job with ID ${jobId} updated successfully`);
    } else {
      console.error("Failed to update job.");
      // Handle the error scenario
    }
  } catch (error) {
    console.error("Error updating job:", error);
    // Handle the error scenario
  }
};

const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, applications }) => {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const toggleApplicationDetails = (applicationId: string) => {
    setSelectedApplicationId(selectedApplicationId === applicationId ? null : applicationId);
  };
  const handleAccept = async (applicationId: string, jobId: string) => {
    try {
      const newStatus = "accepted";
      const response = await axios.put(`${API_ROUTES.APPLY}`, {
        id: applicationId,
        status: newStatus,
      });

      if (response.status === 200) {
        updateJobStatus(jobId);
        toast.success(
          `Application accepted for user: ${applications.find((app) => app.id === applicationId)
            ?.user.username}`
        );
        setTimeout(() => {
          window.location.reload();
        }, 800);

        // Perform any additional actions upon successful acceptance
      } else {
        console.error("Failed to accept application.");
        // Handle the error scenario
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error accepting application:", error);

      // Check if the error response contains a 'detail' property
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail); // Toast the specific error message from the API
      } else {
        toast.error("Error accepting application: " + error.message); // Toast a generic error message
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto flex justify-center items-center">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
        <div className="bg-indigo-700 text-white px-4 py-4 text-lg leading-6 font-bold">
          Applications
        </div>

        <div className="px-4 py-5 sm:p-6">
          {applications.length === 0 ? (
            <p>No applications available at the moment.</p>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span
                    className="text-indigo-600 font-medium"
                    onClick={() => toggleApplicationDetails(application.id)}
                  >
                    {application.user.username}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      application.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {application.status}
                  </span>
                </div>
                {selectedApplicationId === application.id && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Email: {application.user.email}</p>
                    <p className="text-sm text-gray-600">
                      Date of Birth: {application.user.date_of_birth}
                    </p>
                    <p className="text-sm text-gray-600">About: {application.user.experience}</p>
                    <p className="text-sm text-gray-600">
                      Qualification: {application.user.qualifications}
                    </p>
                    <p className="text-sm text-gray-600">Cell: {application.user.phone_number}</p>
                    {/* Add more fields as needed */}
                    {application.status == "accepted" && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          You can contact the pet sitter at their email:
                          <span className="contact-info">{application.user.email}</span> or phone
                          number:
                          <span className="contact-info">{application.user.phone_number}</span>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {application.status !== "accepted" && (
                  <button
                    onClick={() => handleAccept(application.id, application.job)}
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-500 text-base font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700"
                  >
                    Accept
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-gray-200 text-right">
          <button
            onClick={onClose}
            type="button"
            className="py-2 px-4 bg-indigo-600 rounded-md text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
