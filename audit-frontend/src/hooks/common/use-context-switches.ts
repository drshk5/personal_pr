import { useState, useEffect } from "react";

export function useContextSwitches() {
  const [isSwitchingModule, setIsSwitchingModule] = useState<boolean>(
    sessionStorage.getItem("moduleSwitch") === "true"
  );
  const [isSwitchingOrg, setIsSwitchingOrg] = useState<boolean>(
    sessionStorage.getItem("orgSwitch") === "true"
  );

  useEffect(() => {
    const checkSwitchState = () => {
      const moduleSwitch = sessionStorage.getItem("moduleSwitch") === "true";
      const orgSwitch = sessionStorage.getItem("orgSwitch") === "true";

      setIsSwitchingModule(moduleSwitch);
      setIsSwitchingOrg(orgSwitch);
    };

    checkSwitchState();

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "moduleSwitch" ||
        event.key === "orgSwitch" ||
        event.key === "lastContextUpdateTime"
      ) {
        checkSwitchState();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Poll frequently enough to avoid visible flicker on context switches
    const intervalId = setInterval(checkSwitchState, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const isSwitchingContext = isSwitchingModule || isSwitchingOrg;

  return {
    isSwitchingModule,
    isSwitchingOrg,
    isSwitchingContext,
  };
}
