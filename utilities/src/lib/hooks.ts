import { useQuery } from "@tanstack/react-query"; import { invoke, } from '@tauri-apps/api/core';
import { QUERY_KEYS } from "./constants";
import { useContext } from "react";
import { appContext } from "./context/app-context";

export const useParsedFile = () => {
  const { filename } = useContext(appContext)
  const { data } = useQuery({
    queryKey: [...QUERY_KEYS.extractFunctions, filename], queryFn: async () => {
      const data = await invoke("parse_file", { filename });

    }
  })
  return { parsedFile: data };
};
