import { createContext, Dispatch, SetStateAction, useContext } from "react";

interface GlobalState {
  auth: boolean;
  setAuth: Dispatch<SetStateAction<boolean>>;
  showNSFW: boolean;
  setShowNSFW: Dispatch<SetStateAction<boolean>>;
}

const defaultState: GlobalState = {
  auth: false,
  setAuth: () => {},
  showNSFW: false,
  setShowNSFW: () => {},
}

export const GlobalStateContext = createContext<GlobalState>(defaultState);

const useGlobalState = () => {
  return useContext(GlobalStateContext); 
}

export default useGlobalState;
