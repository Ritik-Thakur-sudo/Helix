import type { Mode } from "@helix/database/enums";
import { createBashTool } from "./bash";
import { createEditFileTool } from "./editFile";
import { createGlobTool } from "./glob";
import { createGrepTool } from "./grep";
import { createListDirectoryTool } from "./listDirectory";
import { createReadFileTool } from "./readFile";
import { createWriteFileTool } from "./writeFile";

export function createTools(cwd: string, mode: Mode) {
  const readOnlyTools = {
    readFile: createReadFileTool(cwd),
    listDirectory: createListDirectoryTool(cwd),
    grep: createGrepTool(cwd),
    glob: createGlobTool(cwd),
  };

  if (mode === "PLAN") {
    return readOnlyTools;
  }

  return {
    ...readOnlyTools,
    writeFile: createWriteFileTool(cwd),
    editFile: createEditFileTool(cwd),
    bash: createBashTool(cwd),
  };
}
