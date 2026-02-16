import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const MasterMenuFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  const SwitchFieldSkeleton = () => (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-6 w-11 bg-white rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Basic Information Section */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Module Selection */}
              <FormFieldSkeleton />
              
              {/* Menu Name */}
              <FormFieldSkeleton />
            </div>
          </div>

          <Separator />

          {/* Menu Structure Section */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Parent Master Menu */}
              <FormFieldSkeleton />
              
              {/* Sequence Number */}
              <FormFieldSkeleton />
              
              {/* Category */}
              <FormFieldSkeleton />
              
              {/* Page Template */}
              <FormFieldSkeleton />
            </div>
            
            {/* Has Submenu - Separate from grid */}
            <div className="mt-4">
              <SwitchFieldSkeleton />
            </div>
          </div>

          <Separator />

          {/* Navigation Settings */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Path */}
              <FormFieldSkeleton />
              
              {/* Menu Position */}
              <FormFieldSkeleton />
              
              {/* Map Key */}
              <FormFieldSkeleton />
              
              {/* Icon Name */}
              <FormFieldSkeleton />
            </div>
          </div>

          <Separator />

          {/* Access Control */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex flex-col space-y-4">
                {/* Is Active */}
                <SwitchFieldSkeleton />
                
                {/* Super Admin Access */}
                <SwitchFieldSkeleton />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Action buttons */}
      <CardFooter className="flex justify-between pt-6">
        {/* Left side - Delete button */}
        <div>
        </div>
        
        {/* Right side - Cancel and Save buttons */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
};