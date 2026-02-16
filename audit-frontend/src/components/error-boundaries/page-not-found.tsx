import React from "react";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import NotFoundImage from "@/assets/404_not-found.png";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="ml-25 h-screen w-screen fixed inset-0 overflow-hidden flex items-center justify-center">
      <div className="max-w-2xl w-full flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-2xl relative shrink-0 flex items-center justify-center">
          <img
            src={NotFoundImage}
            alt="Page Not Found"
            className="w-auto h-auto object-contain"
            style={{ maxHeight: "45vh", minWidth: "320px" }}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-md">
            The page you are looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <Button variant="default" onClick={() => navigate("/welcome")}>
            <Home className="mr-2 h-5 w-5" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
