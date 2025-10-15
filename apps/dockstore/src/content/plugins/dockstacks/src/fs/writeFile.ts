import type { DockStacksDeployConfig } from "../types";

// TODO: Implement new DockNode API for Stack Integration
// DockNode writes the parsed compose file to the filesystem but the parsing of variables is done here
// This is to ensure that the variables are correctly parsed before being written to the filesystem
// and to avoid any potential security issues with writing unparsed files to the filesystem
// The DockNode API will then handle the deployment of the stack using the written compose file
// Starting the containers will be handled by the dpcker-client in DockStat
export async function deployStack(
  stackName: string,
  data: string,
  stackDeployConfig: DockStacksDeployConfig
) {
  const composePath = `./stacks/${stackName}`;
  try {
    const parsedData = parseVars(stackDeployConfig, data);
    const res = await Bun.write(composePath, parsedData);
    return {
      success: true,
      message: `Compose file written to ${composePath}`,
      result: res,
    };
  } catch (error) {
    throw new Error(
      JSON.stringify({
        success: false,
        message: `An error occured writing the compose file: ${composePath}`,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

function parseVars(deployConfig: DockStacksDeployConfig, data: string) {
  data.replace(
    /{{(.*?)}}/g,
    (_, key) => deployConfig.variables[key.trim()] ?? ""
  );

  const matches = data.search(/{{(.*?)}}/g);

  if (matches <= 0) {
    throw new Error(
      "Not all variables were provided values in the deploy config"
    );
  }

  return data;
}
