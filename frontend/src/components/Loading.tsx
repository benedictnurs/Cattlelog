import React from "react";

export const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex col-span-2 justify-center items-center">
        <h1 className="mr-2">Loading...</h1>
        <img
          src="/cory-logo.avif"
          alt="Logo"
          className="h-14 w-auto animate-spin"
        />
      </div>
    </div>
  );
};
