import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tab } from "@headlessui/react";
import { API_ROUTES } from "./constants";
import toast from "react-hot-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  color: string;
  height: string;
  breed: string;
  weight: string;

  chip_number: string;
  health_requirements: string;
}

interface EditPetFormData {
  name: string;
  species: string;
  breed: string;
  weight: string;
  color: string;
  height: string;
  chip_number: string;
  health_requirements: string;
  pictures: string[];
}

interface PetProfilePageProps {}

const PetProfiles: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    species: "",
    breed: "",
    weight: "",
    color: "",
    height: "",
    chip_number: "",
    health_requirements: "",
  });

  useEffect(() => {
    fetchPets();
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

  const handleDelete = async (petId: string) => {
    const deleteConsent = window.confirm("Are you sure you want to delete this pet?");
    if (deleteConsent) {
      try {
        const response = await axios.delete(`${API_ROUTES.PETS}${petId}`);

        if (response.status === 204) {
          setPets((prevPets) => prevPets.filter((pet) => pet.id !== petId));
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

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setEditFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight,
      color: pet.color,
      height: pet.height,
      chip_number: pet.chip_number,
      health_requirements: pet.health_requirements,
    });
  };

  const handleEditCancel = () => {
    setEditingPet(null);
    setEditFormData({
      name: "",
      species: "",
      breed: "",
      weight: "",
      color: "",
      height: "",
      chip_number: "",
      health_requirements: "",
    });
  };

  const handleEditSave = async (petId: string) => {
    const saveConsent = window.confirm("Are you sure you want to save these changes?");
    if (saveConsent) {
      try {
        const response = await axios.put(`${API_ROUTES.PETS}${petId}/`, {
          name: editFormData.name,
          species: editFormData.species,
          breed: editFormData.breed,
          weight: editFormData.weight,
          color: editFormData.color,
          height: editFormData.height,
          chip_number: editFormData.chip_number,
          health_requirements: editFormData.health_requirements,
        });

        if (response.status === 200) {
          const updatedPetIndex = pets.findIndex((pet) => pet.id === petId);
          if (updatedPetIndex !== -1) {
            const updatedPets = [...pets];
            updatedPets[updatedPetIndex] = {
              ...updatedPets[updatedPetIndex],
              name: editFormData.name,
              species: editFormData.species,
              breed: editFormData.breed,
              weight: editFormData.weight,
              color: editFormData.color,
              height: editFormData.height,
              chip_number: editFormData.chip_number,
              health_requirements: editFormData.health_requirements,
            };
            setPets(updatedPets);
          }

          toast.success("Pet profile updated successfully");
          setEditingPet(null);
        } else {
          throw new Error("Failed to edit pet profile");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to edit pet profile");
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
        {pets.map((pet: Pet) => (
          <li key={pet.id} className="border border-gray-300 mb-4 p-4 rounded-md">
            <div>
              {editingPet === pet ? (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">Edit Pet Profile</h3>
                  <form>
                    <label htmlFor="edit-name">Name:</label>
                    <input
                      type="text"
                      name="name"
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-species">Species</label>
                    <input
                      type="text"
                      name="species"
                      id="edit-species"
                      value={editFormData.species}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, species: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-breed">Breed</label>
                    <input
                      type="text"
                      name="breed"
                      id="edit-breed"
                      value={editFormData.breed}
                      onChange={(e) => setEditFormData({ ...editFormData, breed: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-color">Color</label>
                    <input
                      type="text"
                      name="color"
                      id="edit-color"
                      value={editFormData.color}
                      onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-height">Height</label>
                    <input
                      type="text"
                      name="height"
                      id="edit-height"
                      value={editFormData.height}
                      onChange={(e) => setEditFormData({ ...editFormData, height: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-weight">Weight</label>
                    <input
                      type="text"
                      name="weight"
                      id="edit-weight"
                      value={editFormData.weight}
                      onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-chip_number">Chip Number</label>
                    <input
                      type="text"
                      name="chip_number"
                      id="edit-chip_number"
                      value={editFormData.chip_number}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, chip_number: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <label htmlFor="edit-health_requirements">Health Requirements</label>
                    <input
                      type="text"
                      name="health_requirements"
                      id="edit-health_requirements"
                      value={editFormData.health_requirements}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, health_requirements: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </form>
                  <div className="mt-4 flex">
                    <button
                      onClick={() => handleEditSave(pet.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="bg-gray-400 text-white px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-bold mb-2">Name: {pet.name}</p>
                  <p>Species: {pet.species}</p>
                  <p>Breed: {pet.breed}</p>
                  <p>Color: {pet.color}</p>
                  <p>Height: {pet.height}</p>
                  <p>Weight: {pet.weight}</p>
                  <p>Chip Number: {pet.chip_number}</p>
                  <p>Health Requirements: {pet.health_requirements}</p>
                </div>
              )}
              <div className="mt-4 flex">
                {!editingPet && (
                  <button
                    onClick={() => handleEdit(pet)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(pet.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PetProfilePage: React.FC<PetProfilePageProps> = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [petFormData, setPetFormData] = useState({
    name: "",
    species: "",
    color: "",
    height: "",
    breed: "",
    weight: "",
    pictures: ["url1", "url2", "url3"],
    chip_number: "",
    health_requirements: "",
  });

  const onClickSave = () => {
    const saveConsent = window.confirm("Are you sure you want to make these changes?");
    if (saveConsent) {
      axios
        .post(API_ROUTES.PETS, petFormData)
        .then((response) => {
          if (response.status === 201) {
            toast.success("Pet profile updated successfully");
            setPetFormData({
              name: "",
              species: "",
              color: "",
              height: "",
              breed: "",
              weight: "",
              pictures: ["url1", "url2", "url3"],
              chip_number: "",
              health_requirements: "",
            });
          } else {
            throw new Error("Failed to save pet profile");
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to update pet profile");
        });
    }
  };

  const onClickCancel = () => {
    const cancelConsent = window.confirm("Are you sure you want to discard these changes?");
    if (cancelConsent) {
      setPetFormData({
        name: "",
        species: "",
        color: "",
        height: "",
        breed: "",
        weight: "",
        pictures: ["url1", "url2", "url3"],
        chip_number: "",
        health_requirements: "",
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
            View Pet Profiles
          </Tab>
          <Tab
            className={({ selected }) =>
              selected
                ? "inline-block p-4 text-gray-800 bg-gray-300 rounded-t-lg ml-1"
                : "inline-block p-4 bg-gray-50 rounded-t-lg ml-1 hover:text-gray-600 hover:bg-gray-100 "
            }
            onClick={() => setActiveTab("add")}
          >
            Add Pet Profile
          </Tab>
        </Tab.List>
        <Tab.Panels className="p-4 bg-white border border-t-0 rounded-b-md">
          <Tab.Panel>{activeTab === "view" && <PetProfiles />}</Tab.Panel>
          <Tab.Panel>
            {activeTab === "add" && (
              <div className="mb-4">
                <label htmlFor="pet-name" className="block text-sm font-medium text-gray-700">
                  Pet Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="pet-name"
                  value={petFormData.name}
                  onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label htmlFor="pet-species" className="block text-sm font-medium text-gray-700">
                  Species
                </label>
                <input
                  type="text"
                  name="species"
                  id="pet-species"
                  value={petFormData.species}
                  onChange={(e) => setPetFormData({ ...petFormData, species: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label htmlFor="pet-breed" className="block text-sm font-medium text-gray-700">
                  Breed
                </label>
                <input
                  type="text"
                  name="breed"
                  id="pet-breed"
                  value={petFormData.breed}
                  onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label htmlFor="pet-color" className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  id="pet-color"
                  value={petFormData.color}
                  onChange={(e) => setPetFormData({ ...petFormData, color: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />

                <label htmlFor="pet-height" className="block text-sm font-medium text-gray-700">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  id="pet-height"
                  value={petFormData.height}
                  onChange={(e) => setPetFormData({ ...petFormData, height: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label htmlFor="pet-weight" className="block text-sm font-medium text-gray-700">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  id="pet-weight"
                  value={petFormData.weight}
                  onChange={(e) => setPetFormData({ ...petFormData, weight: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />
                <label
                  htmlFor="pet-chip-number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Chip Number
                </label>
                <input
                  type="text"
                  name="chip_number"
                  id="pet-chip-number"
                  value={petFormData.chip_number}
                  onChange={(e) => setPetFormData({ ...petFormData, chip_number: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 mt-1"
                />

                <label
                  htmlFor="pet-health-requirements"
                  className="block text-sm font-medium text-gray-700"
                >
                  Health Requirements
                </label>
                <input
                  type="text"
                  name="health_requirements"
                  id="pet-health-requirements"
                  value={petFormData.health_requirements}
                  onChange={(e) =>
                    setPetFormData({ ...petFormData, health_requirements: e.target.value })
                  }
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

export default PetProfilePage;
