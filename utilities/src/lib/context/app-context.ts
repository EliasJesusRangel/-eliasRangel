import { createContext } from "react";
import { defaultAppContextValues } from "./app-context-default-values";
import { TAppContext } from "@elias-rangel/utilities"

export const appContext = createContext<TAppContext>(defaultAppContextValues);
