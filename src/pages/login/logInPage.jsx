import React, { useState } from "react";
import SnSlogo from '../../assets/icon/SnSlogo.png';
import landingBackground from "../../assets/background/landingBackground.jpg";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Build form-data for API
      const formData = new FormData();
      formData.append("phone_code", "+234");     // Nigeria country code
      formData.append("phone_number", phoneNumber);
      formData.append("password", password);
      formData.append("device_type", "android"); // or "apple"
      formData.append("device_id", "1");         // can be any identifier

      const response = await fetch("https://app.screwsandspanners.com/api/auth/login", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.token) {
        // Save token for authenticated requests
        localStorage.setItem("authToken", data.token);
        navigate("/dashboard");
      } else {
        alert("Oops! Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Something went wrong, try again later.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${landingBackground})` }}
    >
      <div className="bg- dark:bg- p- sm:p- rounded shadow-md w-full max-w-sm sm:max-w-md text-black dark:text-white">
        {/* Logo */}
        <div className="flex justify-start mb-4">
          <img
            src={SnSlogo}
            alt="Admin"
            className="w-12 h-12 sm:w-16 sm:h-16"
          />
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold">
            Sign In to your account
          </h2>
          <p className="text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
            Welcome back, enter your details to sign in as an admin
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="Enter phone number"
              className="w-full px-4 py-2 border rounded bg-gray-700 text-white"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div> 

          {/* Password */}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

export default LoginPage;
