"use client";

import React, { useState, useEffect, useRef, Fragment } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import { CameraIcon } from "@heroicons/react/24/outline";
import "cropperjs/dist/cropper.css";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CldImage, getCldImageUrl } from "next-cloudinary";
interface User {
  id: number;
  username: string;
  description: string;
  displayname: string;
  avatar: string;
  newAvatar: string;
  banner: string;
  newBanner: string;
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [imageProfile, setImageProfile] = useState("");
  const [cropperProfile, setCropperProfile] = useState<string>(null!);
  const cropperRefProfile = useRef<ReactCropperElement>(null);
  const [imageBanner, setImageBanner] = useState<string>(null!);
  const [cropperBanner, setCropperBanner] = useState<string>(null!);
  const cropperRefBanner = useRef<ReactCropperElement>(null);
  const [profileIsOpen, setProfileIsOpen] = useState(false);
  const [bannerIsOpen, setBannerIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setBannerUrl(
          getCldImageUrl({
            width: 1000,
            height: 1000,
            src: data.user.banner,
          }),
        );
      });
  }, []);

  const closeProfileModal = () => {
    setProfileIsOpen(false);
  };

  const closeBannerModal = () => {
    setBannerIsOpen(false);
  };

  const onCropProfile = () => {
    const cropper = cropperRefProfile.current?.cropper;
    if (typeof cropper !== "undefined") {
      setCropperProfile(cropper?.getCroppedCanvas().toDataURL());
    }
  };

  const onCropBanner = () => {
    const cropper = cropperRefBanner.current?.cropper;
    if (typeof cropper !== "undefined") {
      setCropperBanner(cropper?.getCroppedCanvas().toDataURL());
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setUser({ ...(user as User), [name]: value });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileIsOpen(true);
      setImageProfile(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBannerIsOpen(true);
      setImageBanner(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    let postData = user!;
    const form = new FormData();
    if (cropperProfile) form.append("avatar", cropperProfile);
    if (cropperBanner) form.append("banner", cropperBanner);
    form.append("username", user.username);
    form.append("displayname", user.displayname);
    form.append("description", user.description);
    fetch("/api/user", {
      method: "POST",
      body: form,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.errorMessage);
        } else {
          setError("");
        }
        router.push(`/@${data.user.username}`);
      });
  };

  return (
    <div>
      {user && (
        <div>
          {imageProfile && (
            <>
              <Transition appear show={profileIsOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-10"
                  onClose={closeProfileModal}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                  </Transition.Child>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Dialog.Panel className="flex flex-col justify-center w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-950 p-6 text-left align-middle shadow-xl transition-all">
                          <Cropper
                            src={imageProfile}
                            crop={onCropProfile}
                            ref={cropperRefProfile}
                            initialAspectRatio={1 / 1}
                            aspectRatio={1 / 1}
                            movable={false}
                            rotatable={false}
                            scalable={false}
                          />
                          <button
                            className="bg-sky-500 mt-4 p-4"
                            onClick={closeProfileModal}
                          >
                            Save
                          </button>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition>
            </>
          )}

          {imageBanner && (
            <>
              <Transition appear show={bannerIsOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-10"
                  onClose={closeBannerModal}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                  </Transition.Child>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Dialog.Panel className="flex flex-col justify-center w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-950 p-6 text-left align-middle shadow-xl transition-all">
                          <Cropper
                            src={imageBanner}
                            crop={onCropBanner}
                            ref={cropperRefBanner}
                            initialAspectRatio={21 / 9}
                            aspectRatio={21 / 9}
                            movable={false}
                            rotatable={false}
                            scalable={false}
                          />
                          <button
                            className="bg-sky-500 mt-4 p-4"
                            onClick={closeBannerModal}
                          >
                            Save
                          </button>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition>
            </>
          )}

          <form action="/settings" method="POST" onSubmit={handleSubmit}>
            <div className="">
              <label htmlFor="banner">
                {cropperBanner && !bannerIsOpen ? (
                  <header
                    className={`w-full h-52 bg-cover bg-center cursor-pointer relative`}
                    style={{ backgroundImage: `url(${cropperBanner})` }}
                  >
                    <CameraIcon className="w-6 h-6  absolute bottom-0 right-0 bg-slate-950 rounded-full m-4 p-1 border-none" />
                  </header>
                ) : (
                  <header
                    className={`w-full h-52 bg-cover bg-center cursor-pointer relative`}
                    style={{
                      backgroundImage: `url(${bannerUrl})`,
                    }}
                  >
                    <CameraIcon className="w-6 h-6  absolute bottom-0 right-0 bg-slate-950 rounded-full m-4 p-1 border-none" />
                  </header>
                )}
              </label>
              <input
                type="file"
                name="banner"
                id="banner"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleBannerChange}
                className="hidden file:bg-gray-800 file:text-white file:border file:border-none w-full border border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-700"
              />
              <div className="my-10 flex flex-row items-center w-100">
                <label htmlFor="profile">
                  {cropperProfile && !profileIsOpen ? (
                    <>
                      <Image
                        src={cropperProfile}
                        alt="a"
                        width={100}
                        height={100}
                        className="m-2 border-slate-950 absolute top-40 rounded-full border-solid border-2 cursor-pointer"
                      />
                      <div className="relative">
                        <CameraIcon className="w-6 h-6 -top-10 absolute bg-slate-950 rounded-full m-4 p-1 border-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <CldImage
                        src={user.avatar}
                        alt={user.username}
                        width={100}
                        height={100}
                        className="m-2 border-slate-950 absolute top-40 rounded-full border-solid border-2 cursor-pointer"
                      />
                      <div className="relative">
                        <CameraIcon className="w-6 h-6 -top-10 absolute bg-slate-950 rounded-full m-4 p-1 border-none" />
                      </div>
                    </>
                  )}
                </label>
                <input
                  id="profile"
                  type="file"
                  name="profile"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleProfileChange}
                  className="file:bg-gray-800 hidden file:text-white file:border file:border-none block w-full border border-gray-700 cursor-pointer bg-gray-50 dark:bg-gray-700"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="username" className="mt-4">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  onChange={handleChange}
                  value={user.username}
                  className="bg-slate-800 border-slate-800 text-white  focus:border-transparent focus:outline-transparent focus:ring-transparent"
                />
                {error && <p className="text-rose-400">{error}</p>}
                <label htmlFor="description" className="mt-4">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayname"
                  name="displayname"
                  onChange={handleChange}
                  value={user.displayname}
                  className="bg-slate-800 border-slate-800 text-white  focus:border-transparent focus:outline-transparent focus:ring-transparent"
                />

                <label htmlFor="description" className="mt-4">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  onChange={handleChange}
                  value={user.description}
                  className="bg-slate-800 border-slate-800 text-white  focus:border-transparent focus:outline-transparent focus:ring-transparent"
                />

                <button type="submit" className=" bg-slate-800 p-4 my-1">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
