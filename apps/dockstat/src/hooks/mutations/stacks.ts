import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

// ============================================
// Stack Mutation Hooks
// ============================================

export const useStackMutations = () => {
  // Create stack mutation
  const createStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["createStack"],
    route: (nodeId: string) => api.node({ nodeId }).stacks.post,
    toast: {
      errorTitle: "Failed to create stack",
      successTitle: (_result) => `Stack created successfully`,
    },
  })

  // Update stack mutation
  const updateStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["updateStack"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).patch,
    toast: {
      errorTitle: "Failed to update stack",
      successTitle: "Stack updated successfully",
    },
  })

  // Delete stack mutation
  const deleteStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["deleteStack"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).delete,
    toast: {
      errorTitle: "Failed to delete stack",
      successTitle: "Stack deleted successfully",
    },
  })

  // Rename stack mutation
  const renameStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["renameStack"],
    route: (nodeId: string, stackId: string) =>
      api.node({ nodeId }).stacks({ stackId }).rename.patch,
    toast: {
      errorTitle: "Failed to rename stack",
      successTitle: "Stack renamed successfully",
    },
  })

  return {
    createStackMutation,
    deleteStackMutation,
    renameStackMutation,
    updateStackMutation,
  }
}

// ============================================
// Stack Lifecycle Mutation Hooks
// ============================================

export const useStackLifecycleMutations = () => {
  // Stack up mutation
  const stackUpMutation = eden.useEdenMutation({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackUp"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).up.post,
    toast: {
      errorTitle: "Failed to start stack",
      successTitle: "Stack started successfully",
    },
  })

  // Stack down mutation
  const stackDownMutation = eden.useEdenMutation({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackDown"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).down.post,
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack restart mutation
  const stackRestartMutation = eden.useEdenMutation({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackRestart"],
    route: (nodeId: string, stackId: string) =>
      api.node({ nodeId }).stacks({ stackId }).restart.post,
    toast: {
      errorTitle: "Failed to restart stack",
      successTitle: "Stack restarted successfully",
    },
  })

  // Stack stop mutation
  const stackStopMutation = eden.useEdenMutation({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackStop"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).stop.post,
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack pull mutation
  const stackPullMutation = eden.useEdenMutation({
    mutationKey: ["stackPull"],
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).pull.post,
    toast: {
      errorTitle: "Failed to pull images",
      successTitle: "Images pulled successfully",
    },
  })

  return {
    stackDownMutation,
    stackPullMutation,
    stackRestartMutation,
    stackStopMutation,
    stackUpMutation,
  }
}

// ============================================
// Swarm Mutation Hooks
// ============================================

export const useSwarmMutations = () => {
  // Deploy swarm stack mutation
  const deploySwarmStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listSwarmStacks"]],
    mutationKey: ["deploySwarmStack"],
    route: (nodeId: string) => api.node({ nodeId }).swarm.stacks.deploy.post,
    toast: {
      errorTitle: "Failed to deploy swarm stack",
      successTitle: "Swarm stack deployed successfully",
    },
  })

  // Remove swarm stack mutation
  const removeSwarmStackMutation = eden.useEdenMutation({
    invalidateQueries: [["listSwarmStacks"]],
    mutationKey: ["removeSwarmStack"],
    route: (nodeId: string, name: string) => api.node({ nodeId }).swarm.stacks({ name }).delete,
    toast: {
      errorTitle: "Failed to remove swarm stack",
      successTitle: "Swarm stack removed successfully",
    },
  })

  // Scale swarm service mutation
  const scaleSwarmServiceMutation = eden.useEdenMutation({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["scaleSwarmService"],
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).scale.post,
    toast: {
      errorTitle: "Failed to scale service",
      successTitle: "Service scaled successfully",
    },
  })

  // Update swarm service mutation
  const updateSwarmServiceMutation = eden.useEdenMutation({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["updateSwarmService"],
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).patch,
    toast: {
      errorTitle: "Failed to update service",
      successTitle: "Service updated successfully",
    },
  })

  // Remove swarm service mutation
  const removeSwarmServiceMutation = eden.useEdenMutation({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["removeSwarmService"],
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).delete,
    toast: {
      errorTitle: "Failed to remove service",
      successTitle: "Service removed successfully",
    },
  })

  // Init swarm mutation
  const initSwarmMutation = eden.useEdenMutation({
    invalidateQueries: [["swarmStatus"]],
    mutationKey: ["initSwarm"],
    route: (nodeId: string) => api.node({ nodeId }).swarm.init.post,
    toast: {
      errorTitle: "Failed to initialize swarm",
      successTitle: "Swarm initialized successfully",
    },
  })

  // Leave swarm mutation
  const leaveSwarmMutation = eden.useEdenMutation({
    invalidateQueries: [["swarmStatus"]],
    mutationKey: ["leaveSwarm"],
    route: (nodeId: string) => api.node({ nodeId }).swarm.leave.post,
    toast: {
      errorTitle: "Failed to leave swarm",
      successTitle: "Left swarm successfully",
    },
  })

  return {
    deploySwarmStackMutation,
    initSwarmMutation,
    leaveSwarmMutation,
    removeSwarmServiceMutation,
    removeSwarmStackMutation,
    scaleSwarmServiceMutation,
    updateSwarmServiceMutation,
  }
}
