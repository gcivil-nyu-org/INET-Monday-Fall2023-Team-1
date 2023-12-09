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
  const [country, setCountry] = useState("usa");
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
    setAddress("");
    setCity("");
    setCountry("");
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

  const setAsDefault = (location: FurbabyLocation) => {
    axios
      .put(API_ROUTES.USER.LOCATION, JSON.stringify({ ...location, default_location: true }))
      .then((resp) => {
        console.log(resp);
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

  const renderCards = React.useMemo(() => {
    //console.log(locations);

    if (locations.length) {
      return (
        <div className="grid gap-x-8 gap-y-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {locations.map((loc, index) => (
            <div className="card w-96 bg-base-100 shadow-md" key={loc.id}>
              <div className="card-body">
                <h2 className="card-title">Location {index + 1}</h2>
                <p className="prose">{loc.address}</p>
                <p className="prose">
                  {loc.city}, {loc.country} - {loc.zipcode}
                </p>
                <div className="card-actions justify-between items-center">
                  {loc.default_location && <div className="badge badge-outline">Default</div>}
                  <button className="btn btn-secondary" onClick={() => onClickEdit(loc)}>
                    Edit
                  </button>
                  {!loc.default_location && (
                    <button className="btn btn-primary" onClick={() => setAsDefault(loc)}>
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
    axios
      .put(
        API_ROUTES.USER.LOCATION,
        JSON.stringify({
          id: editLocationId,
          address,
          city,
          zipcode,
          country,
        })
      )
      .then(() => {
        toast.success("your changes have been saved");
        // TODO: handle response
        //console.log(response);
      })
      .catch((err) => {
        // TODO: handle error
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
                  defaultValue="usa"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option value="usa">United States</option>
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
