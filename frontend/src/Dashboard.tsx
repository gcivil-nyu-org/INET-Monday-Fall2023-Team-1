import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ROUTES } from "./constants";
import toast from "react-hot-toast";

type Job = {
  id: number;
  title: string;
  description: string;
  pet: Pet;
  status: string;
  location: string;
  pay: number;
  start: string;
  end: string;
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

const Dashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

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

            return {
              ...job,
              pet: petDetail,
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

  const applyForJob = async (jobId: number) => {
    console.log(jobId);
    try {
      const response = await axios.post(`${API_ROUTES.APPLY}`, {
        id: jobId,
      });
      console.log(response.data);
      toast.success("Application submitted successfully!");
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
    <div className="max-w-2xl mx-auto p-4">
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
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">{job.title}</h2>
            <p className="text-gray-700 mb-4">{job.description}</p>
            <div className="flex flex-col">
              <p className="font-bold text-gray-800 mb-2">Pet Name: {job.pet.name}</p>
              <p>Status: {job.status}</p>
              <p>Location: {job.location}</p>
              <p>Pay: ${job.pay}</p>
              <p>Start: {job.start}</p>
              <p>End: {job.end}</p>
              {job.status === "open" && (
                <button
                  onClick={() => applyForJob(job.id)}
                  className="bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-600"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
