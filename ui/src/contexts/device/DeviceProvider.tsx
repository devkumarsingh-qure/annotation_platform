import { useEffect, useState, type ReactNode } from "react";
import {
  DeviceContext,
  MOBILE_MAX_WIDTH,
  TABLET_MAX_WIDTH,
  type DeviceContextType,
} from "./deviceContext";

function getDeviceSnapshot(): DeviceContextType {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      isMobile: false,
      isTablet: false,
      isTouch: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= MOBILE_MAX_WIDTH;
  const isTablet = width > MOBILE_MAX_WIDTH && width <= TABLET_MAX_WIDTH;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
  };
}

export default function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceContextType>(getDeviceSnapshot);

  useEffect(() => {
    const handleResize = () => {
      setDevice(getDeviceSnapshot());
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  );
}
