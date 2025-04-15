"use client";

import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}  // Auto-closes after 5 seconds
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      transition={Slide} // Using a Slide transition for smoother effects
      limit={3}          // Limits number of simultaneous toasts; adjust if needed
      toastStyle={{ zIndex: 99999 }} // Adjust the z-index if necessary
    />
  );
}
