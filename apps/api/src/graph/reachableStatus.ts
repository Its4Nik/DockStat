export function mapReachableStatus(node: {
  isReachable: unknown;
  initialized?: boolean;
}): "OK" | "NO" | "DockNode not initialised" {
  // Check for initialization first if that data is available
  if (node.initialized === false) {
    return "DockNode not initialised";
  }

  // Determine reachable status
  if (node.isReachable === true || node.isReachable === "OK") {
    return "OK";
  }

  return "NO";
}
