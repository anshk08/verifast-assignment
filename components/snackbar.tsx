import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { IoIosCloseCircleOutline } from "react-icons/io";

interface SnackbarProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: "warning" | "info";
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  isVisible,
  onClose,
  type = "info",
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const icon =
    type === "warning" ? (
      <IoIosCloseCircleOutline className="text-yellow-500 mr-2" />
    ) : (
      <FaTimes className="text-white mr-2" />
    );

  return (
    <div
      className={`fixed bottom-5 left-5 right-5 md:left-auto md:right-10 z-50 transition-transform transform ${
        isVisible ? "translate-y-0" : "translate-y-20"
      } bg-black text-white px-6 py-3 rounded-full text-center shadow-lg flex items-center`}
      style={{ background: type === "warning" ? "orange" : "black" }}
    >
      {icon}
      {message}
      <button onClick={onClose} className="ml-2 text-white focus:outline-none">
        <FaTimes />
      </button>
    </div>
  );
};

export default Snackbar;
