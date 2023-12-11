import { PlusCircleIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

import { API_ROUTES } from "./constants";
// import fakeData from "./fakeData.json";
import Modal from "./Modal";
import { FurbabyLocation } from "./types";

const Locations = () => {
  const [open, setOpen] = useState(false);
  const [editLocationId, setEditLocationId] = useState("");
  const [locations, setLocations] = useState<FurbabyLocation[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New York City");
  const [country, setCountry] = useState("USA");
  const [zipcode, setZipcode] = useState("");

  const onClickConfirm = () => {
    axios
      .post(
        API_ROUTES.USER.LOCATION,
        JSON.stringify({
          address,
          city,
          zipcode,
          country,
          default_location: false,
        })
      )
      .then((response) => {
        // TODO: handle response
        if (response.status === 201) {
          onCloseModal();
          toast.success("Location added successfully.");
          getLocations();
        }
        //console.log(response);
      })
      .catch((err) => {
        // TODO: handle error
        toast.error("Failed to add location.");
        console.error(err);
      });
  };

  const onCloseModal = () => {
    setEditLocationId("");
    setAddress("");
    setCity("New York City");
    setCountry("USA");
    setZipcode("");
    setOpen(false);
  };

  const getLocations = () => {
    return axios
      .get(API_ROUTES.USER.LOCATION)
      .then((response) => {
        //(response, response.data);
        setLocations(response?.data ?? []);
        // return response;
      })
      .catch((err) => {
        console.error("failed to fetch locations", err);
      });
  };

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLocations(); //.then((response) => {
  }, []);

  const updateDefault = (location: FurbabyLocation, newDefault: boolean) => {
    axios
      .put(API_ROUTES.USER.LOCATION, { ...location, default_location: newDefault })
      .then((resp) => {
        console.log(resp);
        getLocations();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onClickEdit = (location: FurbabyLocation) => {
    setOpen(true);
    setEditLocationId(location.id);
    setAddress(location.address);
    setCity(location.city);
    setCountry(location.country);
    setZipcode(location.zipcode);
  };

  const onClickDelete = (location: FurbabyLocation) => {
    axios
      .delete(API_ROUTES.USER.LOCATION, { data: { id: location.id } })
      .then((resp) => {
        console.log(resp);
        getLocations();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  const renderCards = React.useMemo(() => {
    //console.log(locations);

    if (locations.length) {
      return (
        <div className="grid gap-x-8 gap-y-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {locations.map((loc, index) => (
            <div className="card w-96 bg-base-100 shadow-md" key={loc.id}>
              {loc.default_location && (
                <div className="absolute top-7 right-7">
                  <div className="badge badge-outline">
                    Default
                  </div>
                </div>
              )}
              <div className="card-body">
                <h2 className="card-title">Location {index + 1}</h2>
                <p className="prose">{loc.address}</p>
                <p className="prose">
                  {loc.city}, {loc.country} - {loc.zipcode}
                </p>
                <div className="card-actions justify-between items-center mt-4">
                  <div className="flex flex-row align-center space-x-4">
                    <button className="px-3 py-2 text-sm font-medium text-center text-white bg-blue-400 rounded-lg hover:bg-blue-600 focus:outline-none transition ease-in-out duration-150"
                      onClick={() => onClickEdit(loc)}>
                      Edit
                    </button>
                    <button className="px-2 py-1.5 text-xs font-medium text-center text-white bg-red-300 rounded-lg hover:bg-red-400 focus:outline-none transition ease-in-out duration-150"
                      onClick={() => onClickDelete(loc)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244
                          2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5
                          0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  {loc.default_location ? (
                    <button className="px-3 py-2 text-sm font-medium text-center text-white bg-red-300 rounded-lg hover:bg-red-400 focus:outline-none transition ease-in-out duration-150"
                      onClick={() => updateDefault(loc, false)}>
                      Remove as Default
                    </button>
                  ) : (
                    <button className="px-3 py-2 text-sm font-medium text-center text-white bg-green-400 rounded-lg hover:bg-green-600 focus:outline-none transition ease-in-out duration-150"
                      onClick={() => updateDefault(loc, true)}>
                      Set as default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <ShieldExclamationIcon className="w-32 h-32" />
        <h3 className="prose prose-xl h-32 font-bold">No Locations saved by the user</h3>
      </div>
    );
  }, [locations]);

  const onClickEditConfirm = () => {
    console.log(editLocationId);
    axios
      .put(
        API_ROUTES.USER.LOCATION,
          {
          id: editLocationId,
          address,
          city,
          country,
          zipcode,
        }
      )
      .then((response) => {
        // TODO: handle response
        if (response.status === 200) {
          onCloseModal();
          toast.success("Location updated successfully.");
          getLocations();
        }
      })
      .catch((err) => {
        // TODO: handle error
        toast.error("Failed to update location.");
        console.error(err);
      });
  };

  return (
    <>
      <div className="flex items-center justify-center mb-8">
        <button className="btn bg-indigo-300 btn-wide text-white" onClick={() => setOpen(!open)}>
          <div className="flex flex-row justify-center items-center">
            <PlusCircleIcon width="20" height="20" className="mr-3" />
            Add a New Location
          </div>
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => onCloseModal()}
        onConfirm={() => (editLocationId.length ? onClickEditConfirm() : onClickConfirm())}
        title="Add a new location"
      >
        <div className="mx-auto max-w-xl">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="country"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Country
              </label>
              <div className="mt-2">
                <select
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option value="USA">USA</option>
                </select>
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="street-address"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Street address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="street-address"
                  id="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2 sm:col-start-1">
              <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="postal-code"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                ZIP / Postal code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="postal-code"
                  id="postal-code"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  autoComplete="postal-code"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <div className="divider">OR</div>
      <div className="flex flex-col items-center justify-center">
        <h2 className="prose prose-xl font-bold text-black">View Saved Locations</h2>
        {renderCards}
      </div>
    </>
  );
};

export default Locations;
