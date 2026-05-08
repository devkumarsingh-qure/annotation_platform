import { createContext, useContext } from "react";

export type DeviceContextType = {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
};

export const MOBILE_MAX_WIDTH = 767;
export const TABLET_MAX_WIDTH = 1023;

export const defaultDeviceContext: DeviceContextType = {
  width: 0,
  height: 0,
  isMobile: false,
  isTablet: false,
  isTouch: false,
};

export const DeviceContext =
  createContext<DeviceContextType>(defaultDeviceContext);

export function useDevice() {
  return useContext(DeviceContext);
}
