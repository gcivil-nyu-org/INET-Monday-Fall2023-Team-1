import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tab } from "@headlessui/react";
import { API_ROUTES } from "./constants";
import toast from "react-hot-toast";
import ApplicationModal from "./ApplicationModal";

interface Job {
  id: string;
  pet: Pet;
  location: Location;
  status: string;
  pay: string;
  start: string;
  end: string;
}

interface Location {
  id: string;
  address: string;
  city: string;
  country: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  color: string;
  height: string;
  breed: string;
  weight: string;
  pictures: string[];
  chip_number: string;
  health_requirements: string;
}

interface User {
  id: string;
  username: string;
  date_of_birth: string;
  experience: string;
}

interface Application {
  id: string;
  status: string;
  user: User;
  job: string;
  details: string;
  // Add more fields as needed
}
interface JobPageProps {}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAccept = (applicationId: string) => {
    // Implement the logic to accept the application
    // For example, make an API call to update the status
    //console.log(`Accepting application with ID: ${applicationId}`);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_ROUTES.JOBS}`);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch jobs. Status: ${response.status}`);
      }
      const jobsWithPetDetails = [];

      // Fetch pet details for owner jobs
      for (const job of response.data.owner_jobs) {
        const petDetailsResponse = await axios.get(`${API_ROUTES.PETS}${job.pet}`);
        const petDetail = petDetailsResponse.data;

        //console.log("Fetched pet details:", petDetail);

        const locationDetailsResponse = await axios.get(`${API_ROUTES.USER.LOCATION}`);
        const locationDetail = locationDetailsResponse.data;

        //console.log("Fetched Location details:", locationDetail);
        //console.log(locationDetail.find((location: any) => location.id === job.location));
        jobsWithPetDetails.push({
          ...job,
          pet: petDetail,
          location: locationDetail.find((location: any) => location.id === job.location),
        });
      }

      // Wait for all pet details requests to complete
      const resolvedJobs = jobsWithPetDetails;
      //console.log(resolvedJobs);
      setJobs(resolvedJobs);
    } catch (error: any) {
      console.error("Error fetching pets:", error.message);
      setError("Failed to fetch pets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    const deleteConsent = window.confirm("Are you sure you want to delete this pet?");
    if (deleteConsent) {
      try {
        const response = await axios.delete(API_ROUTES.JOBS, {
          data: { id: jobId },
        });
        if (response.status === 200) {
          window.location.reload();
          toast.success("Pet profile deleted successfully");
        } else {
          throw new Error("Failed to delete pet profile");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete pet profile");
      }
    }
  };

  const viewApplication = async (jobId: string) => {
    const confirmConsent = window.confirm("Confirm to view Applications?");
    //console.log(jobId);
    if (confirmConsent) {
      try {
        const response = await axios.get(API_ROUTES.APPLY, {
          params: { job_id: jobId },
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch applications. Status: ${response.status}`);
        }
        //("Fetched applications:", response.data);
        // Handle the fetched applications as needed
        setApplications(response.data);
        const selectedJob = jobs.find((job) => job.id === jobId);
        setSelectedJob(selectedJob || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch applications");
      }
    }
  };
  const viewConfirmedApplication = async (jobId: string) => {
    const confirmConsent = window.confirm("Confirm to view Applications?");
    //console.log(jobId);
    if (confirmConsent) {
      try {
        const response = await axios.get(API_ROUTES.APPLY, {
          params: { job_id: jobId },
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch applications. Status: ${response.status}`);
        }
        //console.log("Fetched applications:", response.data);
        // Handle the fetched applications as needed
        const applications: Application[] = response.data;

        // Filter applications to include only accepted ones
        const acceptedApplications = applications.filter(
          (app: Application) => app.status === "accepted"
        );

        setApplications(acceptedApplications);

        const selectedJob = jobs.find((job) => job.id === jobId);
        setSelectedJob(selectedJob || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch applications");
      }
    }
  };

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  return (
    <div className="max-w-screen-md mx-auto p-6">
      {error && <p className="text-red-500">{error}</p>}
      <ul className="list-none p-0">
        {jobs.map((job: Job) => (
          <li key={job.id} className="border border-gray-300 mb-4 p-4 rounded-md">
            <div>
              <p className="font-bold mb-2">Pet Name: {job.pet.name}</p>
              <p>Status: {job.status}</p>
              <p>Location: {job?.location?.address ?? ""}</p>
              <p>Pay: {job.pay}</p>
              <p>Start: {job.start}</p>
              <p>End: {job.end}</p>
            </div>
            <div className="mt-4 flex">
              <button
                onClick={() => handleDelete(job.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Delete
              </button>

              {job.status === "open" && (
                <button
                  onClick={() => {
                    viewApplication(job.id);
                    openModal();
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  View Application
                </button>
              )}
              {job.status === "acceptance_complete" && (
                <button
                  onClick={() => {
                    viewConfirmedApplication(job.id);
                    openModal();
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  View Confirmed Application
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        applications={applications}
        handleAccept={handleAccept}
      />
    </div>
  );
};

const JobPage: React.FC<JobPageProps> = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobFormData, setJobFormData] = useState({
    pet: "",
    location: "",
    pay: "",
    status: "",
    start: "",
    end: "",
  });
  const [pets, setPets] = useState<Pet[]>([]); // Assuming Pet is your pet type/interface
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchPets();
    getLocations();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await axios.get(`${API_ROUTES.PETS}`);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch pets. Status: ${response.status}`);
      }

      setPets(response.data);
    } catch (error: any) {
      console.error("Error fetching pets:", error.message);
      setError("Failed to fetch pets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLocations = () => {
    return axios
      .get(API_ROUTES.USER.LOCATION)
      .then((response) => {
        //console.log(response, response.data);
        setLocations(response?.data ?? []);
        // return response;
      })
      .catch((err) => {
        console.error("failed to fetch locations", err);
      });
  };
  const onClickSave = () => {
    const saveConsent = window.confirm("Are you sure you want to make these changes?");
    if (saveConsent) {
      //console.log(jobFormData);
      jobFormData.status = "open";
      axios
        .post(API_ROUTES.JOBS, jobFormData)
        .then((response) => {
          if (response.status === 201) {
            toast.success("Job Addedd Successfully");
            setJobFormData({
              pet: "",
              location: "",
              pay: "",
              start: "",
              status: "",
              end: "",
            });
          } else {
            throw new Error("Failed to save Job");
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to update Job");
        });
    }
  };

  const onClickCancel = () => {
    const cancelConsent = window.confirm("Are you sure you want to discard these changes?");
    if (cancelConsent) {
      setJobFormData({
        pet: "",
        location: "",
        pay: "",
        start: "",
        status: "",
        end: "",
      });
    }
  };

  return (
    <div className="max-w-screen-md mx-auto p-6">
      <Tab.Group>
        <Tab.List className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
          <Tab
            className={({ selected }) =>
              selected
                ? "inline-block p-4 text-gray-800 bg-gray-300 rounded-t-lg"
                : "inline-block p-4 bg-gray-50 rounded-t-lg hover:text-gray-600 hover:bg-gray-100 "
            }
            onClick={() => setActiveTab("view")}
          >
            View My Jobs
          </Tab>
          <Tab
            className={({ selected }) =>
              selected
                ? "inline-block p-4 text-gray-800 bg-gray-300 rounded-t-lg ml-1"
                : "inline-block p-4 bg-gray-50 rounded-t-lg ml-1 hover:text-gray-600 hover:bg-gray-100 "
            }
            onClick={() => setActiveTab("add")}
          >
            Add Job
          </Tab>
        </Tab.List>
        <Tab.Panels className="p-4 bg-white border border-t-0 rounded-b-md">
          <Tab.Panel>{activeTab === "view" && <Jobs />}</Tab.Panel>
          <Tab.Panel>
            {activeTab === "add" && (
              <div className="mb-4">
                <label htmlFor="pet-dropdown" className="block text-sm font-medium text-gray-700">
                  Select a Pet
                </label>
                <select
                  id="pet-dropdown"
                  name="pet"
                  value={jobFormData.pet}
                  onChange={(e) => setJobFormData({ ...jobFormData, pet: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1 w-1/4"
                >
                  <option value="" disabled>
                    Select a pet
                  </option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="location-dropdown"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select a Location
                </label>
                <select
                  id="location-dropdown"
                  name="location"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1 w-1/3"
                >
                  <option value="" disabled>
                    Select a Location
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.address}
                    </option>
                  ))}
                </select>

                <label htmlFor="pet-breed" className="block text-sm font-medium text-gray-700">
                  Pay
                </label>
                <input
                  type="text"
                  name="pay"
                  id="job-pay"
                  value={jobFormData.pay}
                  onChange={(e) => setJobFormData({ ...jobFormData, pay: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label htmlFor="job-start" className="block text-sm font-medium text-gray-700">
                  Start
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  id="job-start"
                  value={jobFormData.start}
                  onChange={(e) => setJobFormData({ ...jobFormData, start: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />

                <label htmlFor="job-end" className="block text-sm font-medium text-gray-700">
                  End
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  id="job-end"
                  value={jobFormData.end}
                  onChange={(e) => setJobFormData({ ...jobFormData, end: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-x-6">
              <button
                onClick={onClickSave}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500"
              >
                Save
              </button>
              <button
                onClick={onClickCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default JobPage;
