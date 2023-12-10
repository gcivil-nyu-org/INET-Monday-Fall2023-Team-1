import { Tab } from "@headlessui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { API_ROUTES } from "./constants";
import notify from "./Notify";
import { isJSONString } from "./utils";

const inputStyle = "border border-gray-300 rounded-md p-2 my-3 w-3/4" as const;

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

  const [petPictures, updatePetPictures] = useState<Record<string, string>>({});

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

      if (response.data.length) {
        response.data.forEach((pet: Pet) => {
          axios
            .get(`${API_ROUTES.USER.PET_PICTURE}?id=${pet.id}`, {
              responseType: "blob",
            })
            .then((response) => {
              if (response.status === 200) {
                const newPetPicture = URL.createObjectURL(response.data);
                updatePetPictures((state) => ({
                  ...state,
                  [pet.id]: newPetPicture,
                }));
              }
            })
            .catch((err) => {
              console.error(`failed to fetch user pet picture with id: ${pet.id}`, err);
            });
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching pets:", (error as Error).message);
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
                <>
                  <div className="flex flex-col items-center bg-white rounded-lg md:flex-row md:max-w-xl">
                    <img
                      className="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg"
                      src={petPictures[pet.id]}
                      alt={`${pet.name} picture`}
                    />
                    <div className="flex flex-col justify-between p-4 leading-normal">
                      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {pet.name}
                      </h5>
                      <div className="mb-3 font-normal text-gray-700 dark:text-gray-400 grid grid-cols-2 gap-2">
                        <PetCardChip title="Species" value={pet.species} />
                        <PetCardChip title="Breed" value={pet.breed} />
                        <PetCardChip title="Color" value={pet.color} />
                        <PetCardChip title="Height" value={pet.height} />
                        <PetCardChip title="Weight" value={pet.weight} />
                        <PetCardChip title="Chip" value={pet.chip_number} />
                        <div className="mt-2">
                          <p className="font-bold mb-2">Health Requirements</p>
                          <p>{pet.health_requirements}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
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

const PetProfilePage = () => {
  const [activeTab, setActiveTab] = useState("view");

  const [petFormData, setPetFormData] = useState({
    name: "",
    species: "",
    color: "",
    height: "",
    breed: "",
    weight: "",
    chip_number: "",
    health_requirements: "",
  });

  const [petPicture, updatePetPicture] = useState<File | null>(null);

  const onClickSave = () => {
    axios
      .post(API_ROUTES.PETS, petFormData)
      .then((response) => {
        if (response.status === 201) {
          toast.success("Pet profile updated successfully");

          if (petPicture) {
            const formData = new FormData();
            formData.append("pet_id", response.data.id);
            formData.append("pet_picture", petPicture);
            axios
              .post(API_ROUTES.USER.PET_PICTURE, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              })
              .then((response) => {
                if (response.status === 201) {
                  updatePetPicture(null);
                }
              })
              .catch((err) => {
                updatePetPicture(null);
                console.error(err);
                notify({
                  title: `failed to upload pet(${response.data?.name ?? ""}) picture`,
                  type: "error",
                  children: isJSONString(err) ? JSON.stringify(err) : <>{err}</>,
                });
              });
          }

          setPetFormData({
            name: "",
            species: "",
            color: "",
            height: "",
            breed: "",
            weight: "",
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
        chip_number: "",
        health_requirements: "",
      });
    }
  };

  const onUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updatePetPicture(e.target.files[0]);
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
              <div className="mb-4 flex flex-col justify-between">
                <label htmlFor="pet-name" className="block text-sm font-bold text-gray-700">
                  Pet Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="pet-name"
                  value={petFormData.name}
                  onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                  className={inputStyle}
                />
                <label htmlFor="pet-species" className="block text-sm font-bold text-gray-700">
                  Species
                </label>
                <input
                  type="text"
                  name="species"
                  id="pet-species"
                  value={petFormData.species}
                  onChange={(e) => setPetFormData({ ...petFormData, species: e.target.value })}
                  className={inputStyle}
                />
                <label htmlFor="pet-breed" className="block text-sm font-bold text-gray-700">
                  Breed
                </label>
                <input
                  type="text"
                  name="breed"
                  id="pet-breed"
                  value={petFormData.breed}
                  onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                  className={inputStyle}
                />
                <label htmlFor="pet-color" className="block text-sm font-bold text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  id="pet-color"
                  value={petFormData.color}
                  onChange={(e) => setPetFormData({ ...petFormData, color: e.target.value })}
                  className={inputStyle}
                />

                <label htmlFor="pet-height" className="block text-sm font-bold text-gray-700">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  id="pet-height"
                  value={petFormData.height}
                  onChange={(e) => setPetFormData({ ...petFormData, height: e.target.value })}
                  className={inputStyle}
                />
                <label htmlFor="pet-weight" className="block text-sm font-bold text-gray-700">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  id="pet-weight"
                  value={petFormData.weight}
                  onChange={(e) => setPetFormData({ ...petFormData, weight: e.target.value })}
                  className={inputStyle}
                />
                <label htmlFor="pet-chip-number" className="block text-sm font-bold text-gray-700">
                  Chip Number
                </label>
                <input
                  type="text"
                  name="chip_number"
                  id="pet-chip-number"
                  value={petFormData.chip_number}
                  onChange={(e) => setPetFormData({ ...petFormData, chip_number: e.target.value })}
                  className={inputStyle}
                />

                <label
                  htmlFor="pet-health-requirements"
                  className="block text-sm font-bold text-gray-700"
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
                  className={inputStyle}
                />

                <label
                  htmlFor="pet-health-requirements"
                  className="block text-sm font-bold text-gray-700"
                >
                  Pet Picture
                </label>
                <input
                  className="rounded-md bg-slate-400 px-3 py-2 text-sm w-1/2 font-semibold text-white shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                  type="file"
                  name="pet-picture"
                  onChange={onUploadImage}
                  accept="image/jpeg"
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
