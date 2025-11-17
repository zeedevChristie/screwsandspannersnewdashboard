import React from "react";
import SnSlogo from '../../assets/icon/SnSlogo.png';
import landingBackground from '../../assets/background/landingBackground.jpg';

const DeactivatedLoginPage = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 relative"
      style={{ backgroundImage: `url(${landingBackground})` }}
    >
      {/* 🔴 Toast Notification */}
      <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-md flex items-center gap-4 text-sm sm:text-base z-50">
        <span>Your account has been deactivated</span>
        <button className="bg-black text-white px-3 py-1 rounded hover:bg-red-100 transition">
          Contact Support
        </button>
      </div>

      {/* 🔐 Login Form */}
      <div className="bg- p-6 sm:p-8 rounded shadow-md w-full max-w-sm sm:max-w-md text-black dark:text-white">
        {/* Logo */}
        <div className="flex justify-start mb-4">
          <img src={SnSlogo} alt="Admin" className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Sign in to your account</h2>
          <p className="text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
            Welcome back, enter your details to sign in as an admin
          </p>
        </div>

        {/* Form */}
        <form>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="text"
              placeholder="Enter email address"
              className="w-full px-4 py-2 border rounded bg-gray-700 dark:text-white"
            />
          </div>

          {/* Password + Forgot */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Password</label>
              <a
                href="#"
                className="text-sm text-red-600 underline underline-offset-2 hover:text-red-700"
              >
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full px-4 py-2 border rounded bg-gray-700 dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-black text-white py-2 rounded mt-4 w-full mx-auto block hover:bg-gray-900 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeactivatedLoginPage;
