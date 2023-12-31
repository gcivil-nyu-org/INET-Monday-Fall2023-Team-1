import { Tab } from "@headlessui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { API_ROUTES } from "./constants";
import { formatDate } from "./utils";

type Job = {
  id: number;
  title: string;
  description: string;
  pet: Pet;
  status: string;
  location: Location;
  pay: number;
  start: Date;
  end: Date;
  user_id: string;
};

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

interface Location {
  id: string;
  address: string;
  city: string;
  country: string;
  zipcode: string;
  user_id: string;
}

interface Application {
  id: string;
  status: string;
  user: User;
  job: Job;
  details: string;
  pet: Pet;
  location: Location;
  // Add more fields as needed
}

interface User {
  id: string;
  username: string;
}

const PetCardChip = (props: { title: string; value: string }) => {
  return (
    <div className="flex flex-row border rounded-md truncate">
      <span className="uppercase border-r-black font-light border-r-2 p-1 bg-slate-200 w-1/2 text-center">
        {props.title}
      </span>
      <span className="flex flex-row items-center py-1 w-1/2 px-2">{props.value}</span>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("available jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // const [locations, setLocations] = useState<Location[]>([]);
  const [petPictures, updatePetPictures] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_ROUTES.JOBS}`);
        if (response.status !== 200) {
          throw new Error(`Failed to fetch jobs. Status: ${response.status}`);
        }

        const jobsWithPetDetails = await Promise.all(
          response.data.sitter_jobs.map(async (job: Job) => {
            const petDetailsResponse = await axios.get(`${API_ROUTES.PETS}${job.pet}`);
            const petDetail = petDetailsResponse.data;

            const locationDetailsResponse = await axios.get(
              `${API_ROUTES.USER.LOCATION}?location_id=${job.location}`
            );
            const locationDetail = locationDetailsResponse.data;

            return {
              ...job,
              pet: petDetail,
              location: locationDetail,
            };
          })
        );

        setJobs(jobsWithPetDetails);
      } catch (error) {
        console.error(error);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (jobs.length) {
      jobs.forEach(async (job: Job) => {
        const petID = job.pet.id;
        console.log(job);
        axios
          .get(`${API_ROUTES.USER.PET_PICTURE}?id=${petID}&owner_id=${job.location.user_id}`, {
            responseType: "blob",
          })
          .then((response) => {
            if (response.status === 200) {
              const newPetPicture = URL.createObjectURL(response.data);
              updatePetPictures((state) => ({
                ...state,
                [petID]: newPetPicture,
              }));
            }
          })
          .catch((err) => {
            console.error(`failed to fetch user pet picture with id: ${petID}`, err);
          });
      });
    }
  }, [jobs.length]);

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get(`${API_ROUTES.APPLY}`);
      if (response.status !== 200) {
        throw new Error(`Failed to fetch my applications. Status: ${response.status}`);
      }
      //console.log("my applications", response.data)

      const myApplicationsWithJobDetails = await Promise.all(
        response.data.map(async (myApplications: Application) => {
          //console.log("myApplications.job", myApplications.job)
          const jobDetailsResponse = await axios.get(API_ROUTES.JOBS, {
            params: { id: myApplications.job },
          });
          const jobDetail = jobDetailsResponse.data;

          const locationDetailsResponse = await axios.get(
            `${API_ROUTES.USER.LOCATION}?location_id=${jobDetail.location}`
          );
          const locationDetail = locationDetailsResponse.data;

          const petDetailsResponse = await axios.get(`${API_ROUTES.PETS}${jobDetail.pet}`);
          const petDetail = petDetailsResponse.data;

          return {
            ...myApplications,
            job: jobDetail,
            location: locationDetail,
            pet: petDetail,
          };
        })
      );
      //console.log("my applications with job details", myApplicationsWithJobDetails)
      setMyApplications(myApplicationsWithJobDetails);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchMyApplications();
  }, []);

  const applyForJob = async (jobId: number) => {
    //console.log(jobId);
    try {
      await axios.post(`${API_ROUTES.APPLY}`, {
        id: jobId,
      });

      //console.log(response.data);
      toast.success("Application submitted successfully!");
      fetchMyApplications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply for the job.");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const searchTermLowerCase = searchTerm.toLowerCase();
    const petNameIncludes = job.pet.name.toLowerCase().includes(searchTermLowerCase);

    return petNameIncludes;
  });

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <Tab.Group>
        <Tab.List className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
          <Tab
            className={({ selected }) =>
              selected
                ? "inline-block p-4 text-gray-800 bg-gray-300 rounded-t-lg ml-1"
                : "inline-block p-4 bg-gray-50 rounded-t-lg ml-1 hover:text-gray-600 hover:bg-gray-100 "
            }
            onClick={() => setActiveTab("available jobs")}
          >
            Available Jobs
          </Tab>
          <Tab
            className={({ selected }) =>
              selected
                ? "inline-block p-4 text-gray-800 bg-gray-300 rounded-t-lg ml-1"
                : "inline-block p-4 bg-gray-50 rounded-t-lg ml-1 hover:text-gray-600 hover:bg-gray-100 "
            }
            onClick={() => setActiveTab("my applications")}
          >
            My Applications
          </Tab>
        </Tab.List>
        <Tab.Panels className="p-4 bg-white border border-t-0 rounded-b-md">
          <Tab.Panel>
            {activeTab === "available jobs" && (
              <div className="mb-4">
                <div className="flex justify-end mb-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search by pet name..."
                      className="px-4 py-2 border rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  {filteredJobs.length === 0 ? (
                    <p>No jobs available at the moment.</p>
                  ) : (
                    filteredJobs.map((job) => (
                      <div key={job.id} className="max-w-screen-md mx-auto p-6">
                        {error && <p className="text-red-500">{error}</p>}
                        <ul className="list-none p-0">
                          <li key={job.id} className="border border-gray-300 mb-4 p-4 rounded-md">
                            <div>
                              <h5 className="font-bold mb-2">Pet Name: {job.pet.name}</h5>
                              <div className="mb-3 font-normal text-gray-700 grid grid-cols-2 gap-2">
                                <PetCardChip title="Species" value={job.pet.species} />
                                <PetCardChip title="Breed" value={job.pet.breed} />
                                <PetCardChip title="Color" value={job.pet.color} />
                                <PetCardChip title="Height" value={job.pet.height} />
                                <PetCardChip title="Weight" value={job.pet.weight} />
                                <PetCardChip title="Chip" value={job.pet.chip_number} />
                                <p className="font-bold mb-2">
                                  Health Requirements: {job.pet.health_requirements}
                                </p>
                              </div>
                              <hr />
                              <div className="flex flex-row justify-evenly items-center">
                                <div>
                                  <p className="mt-4">Job Status: {job.status}</p>
                                  <p>
                                    Location: {job?.location?.address ?? ""},{" "}
                                    {job?.location?.city ?? ""}, {job?.location?.zipcode ?? ""}
                                  </p>
                                  <p>Pay: ${job.pay}</p>
                                  <p>Start: {formatDate(job.start)}</p>
                                  <p>End: {formatDate(job.end)}</p>
                                </div>
                                <img
                                  className="object-cover w-full mt-4 rounded-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg"
                                  src={petPictures[job.pet.id]}
                                  alt={`${job.pet.name} picture`}
                                />
                              </div>
                              {job.status === "open" && (
                                <button
                                  onClick={() => applyForJob(job.id)}
                                  className="bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-600"
                                >
                                  Apply Now
                                </button>
                              )}
                            </div>
                          </li>
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Tab.Panel>
          <Tab.Panel>
            {activeTab === "my applications" && (
              <div className="max-w-screen-md mx-auto p-6">
                {error && <p className="text-red-500">{error}</p>}
                <ul className="list-none p-0">
                  {myApplications.map((myApplications: Application) => (
                    <li
                      key={myApplications.id}
                      className="border border-gray-300 mb-4 p-4 rounded-md"
                    >
                      <div>
                        <p className="font-bold mb-2">Pet Name : {myApplications.pet.name}</p>
                        <p>
                          Location: {myApplications?.location?.address ?? ""},{" "}
                          {myApplications?.location?.city ?? ""},{" "}
                          {myApplications?.location?.zipcode ?? ""}
                        </p>
                        <p>Pay: ${myApplications.job.pay}</p>
                        <p>Start: {formatDate(myApplications.job.start)}</p>
                        <p>End: {formatDate(myApplications.job.end)}</p>
                        <p className="font-bold mb-2">
                          Application Status:{" "}
                          {!myApplications.status ? "No Decision" : myApplications.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Dashboard;
