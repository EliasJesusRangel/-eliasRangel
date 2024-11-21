import { useParsedFile } from '@elias-rangel/utilities';
import { open } from '@tauri-apps/plugin-dialog';

import { invoke, InvokeArgs } from '@tauri-apps/api/core';
import { MouseEventHandler, useEffect, useState } from 'react';

const DependencyGraphViewer = ({
  files,
  root,
}: {
  root: string | null;
  files: false | string[];
}) => {
  const [visible, setVisible] = useState(false);
  const [cache, setCache] = useState<Set<any>[]>([]);

  const { parsedFile } = useParsedFile();

  const setParsedFile = (content: any) => {
    setCache([...cache, parsedFile]);
  };

  useEffect(() => {}, [parsedFile]);
  return (
    <div className="flex">
      <div>
        <div className="w-[8em]">
          File Explorer
          <br />
          {root}
          <button className="size-4" onClick={(e) => setVisible(!visible)}>
            {visible ? '-' : '+'}
          </button>
        </div>
        <div
          className="w-[8em] invisible data-[visible=true]:visible bg-red-100 h-full"
          data-visible={visible}
        >
          {files &&
            files.map((value) => (
              <button
                className="button truncate max-w-[8em] hover:bg-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                }}
                title={value}
              >
                {value}
              </button>
            ))}
        </div>
      </div>
      <div className="overflow-scroll">
        {parsedFile?.getText(parsedFile.rootNode)}
      </div>
    </div>
  );
};
const RepositoryFormAndActions = ({
  handleActionOrSubmit,
}: {
  handleActionOrSubmit: (value: string | null) => void;
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    open({
      directory: true,
      multiple: false,
    }).then((result) => {
      console.log('#### FOLDER SELECTED', result);
      handleActionOrSubmit(result);
    });
  };
  return (
    <div className="flex gap-2.5 items-center justify-evenly p-2.5">
      <div className="grid grid-flow-col items-center gap-2.5 bg-gray-900 p-2.5">
        <button
          className="text-start bg-gray-700 rounded-md p-2 text-sm hover:bg-gray-900"
          onClick={handleClick}
        >
          Read/Analyze Repo
        </button>
      </div>
      <form className="grid grid-flow-col items-center gap-2.5 bg-gray-900 p-2.5 invisible">
        <label htmlFor="fileInput">Specific File Name</label>
        <input
          className="bg-inherit"
          name="fileInput"
          disabled
          title="not developed yet"
        />
        <button
          className="text-start bg-gray-700 rounded-md p-2 text-sm hover:bg-gray-900"
          type="submit"
        >
          Analyze
        </button>
      </form>
      <form className="grid grid-flow-col items-center gap-2.5 bg-gray-900 p-2.5 invisible">
        <label htmlFor="dependency">Dependency name</label>
        <input
          className="bg-inherit"
          name="dependency"
          disabled
          title="not developed yet"
        />
        <button
          className="text-start bg-gray-700 rounded-md p-2 text-sm hover:bg-gray-900"
          type="submit"
        >
          Find References
        </button>
      </form>
    </div>
  );
};

export function App() {
  const [files, setFiles] = useState<false | string[]>(false);
  const [root, setRoot] = useState<null | string>(null);

  const handleActionOrSubmit = (value: string | null) => {
    const inputString = value ?? '';

    const args: InvokeArgs = {
      repoUrl: inputString,
    };
    invoke('clone_repo', args).then((result) => {
      setRoot((JSON.parse(result as string) as { root: string }).root);
      setFiles((JSON.parse(result as string) as { entries: string[] }).entries);
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-800 flex-col flex text-white">
      <div className="grow h-full bg-inherit overflow-auto w-screen">
        <DependencyGraphViewer root={root} files={files ?? false} />
      </div>
      <div className="shrink-0 min-h-16 h-16 w-screen border flex items-center">
        <RepositoryFormAndActions handleActionOrSubmit={handleActionOrSubmit} />
      </div>
    </div>
  );
}
