import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import NotFoundImage from "@/assets/404_not-found.png";

interface NotFoundProps {
  pageName?: string;
}

const NotFound: React.FC<NotFoundProps> = ({ pageName = "Page" }) => {
  const navigate = useNavigate();

  return (
    <div className="ml-25 h-screen w-screen fixed inset-0 overflow-hidden flex items-center justify-center">
      <div className="max-w-2xl w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl relative shrink-0 flex items-center justify-center">
          <img
            src={NotFoundImage}
            alt="Not Found"
            className="w-auto h-auto object-contain"
            style={{ maxHeight: "45vh", minWidth: "320px" }}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {pageName} Not Found
          </h1>
          <Button
            variant="default"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
