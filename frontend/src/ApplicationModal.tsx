import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import { API_ROUTES } from "./constants";
import toast from "react-hot-toast";

interface User {
  id: string;
  username: string;
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
    const newStatus = 'acceptance_complete';  // Replace this with your desired status

    const response = await axios.put(`${API_ROUTES.JOBS}`, {
      id: jobId,
      status: newStatus,
    });

    if (response.status === 200) {
      console.log(`Job with ID ${jobId} updated successfully.`);

    } else {
      console.error('Failed to update job.');
      // Handle the error scenario
    }
  } catch (error) {
    console.error('Error updating job:', error);
    // Handle the error scenario
  }
};





const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, applications }) => {
  const [acceptedApplications, setAcceptedApplications] = useState<string[]>([]);

  const handleAccept = async (applicationId: string, jobId: string) => {
    try {
      const newStatus = 'accepted';
      const response = await axios.put(`${API_ROUTES.APPLY}`, {
        id: applicationId,
        status: newStatus,
      });

      if (response.status === 200) {
        console.log(`Application with ID ${applicationId} accepted successfully.`);
        setAcceptedApplications((prevAccepted) => [...prevAccepted, applicationId]);
        updateJobStatus(jobId);
        toast.success(`Application accepted for user: ${applications.find(app => app.id === applicationId)?.user.username}`);
        setTimeout(() => {
          window.location.reload();
        }, 700);





        // Perform any additional actions upon successful acceptance

      } else {
        console.error('Failed to accept application.');
        // Handle the error scenario
      }
    } catch (error: any) {
      console.error('Error accepting application:', error);

      // Check if the error response contains a 'detail' property
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail); // Toast the specific error message from the API
      } else {
        toast.error('Error accepting application: ' + error.message); // Toast a generic error message
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Applications</h3>
            {applications.map((application) => (
              <div key={application.id} className="mb-4">
                <p>Status: {application.status}</p>
                <p>
                  Username: {' '}
                  <Link to={`/user-profile/${application.user.id}`}>
                    {application.user.username}
                  </Link>
                </p>
                {application.status !== 'accepted' && (
                  <button
                    onClick={() => handleAccept(application.id, application.job)} // Call onAccept function with application ID
                    type="button"
                    className="mt-2 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
