import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

// ============================================
// Stack Mutation Hooks
// ============================================

export const useStackMutations = () => {
  // Create stack mutation
  const createStackMutation = eden.useEdenMutation({
    route: (nodeId: string) => api.node({ nodeId }).stacks.post,
    mutationKey: ["createStack"],
    invalidateQueries: [["listStacks"]],
    toast: {
      errorTitle: "Failed to create stack",
      successTitle: (_result) => `Stack created successfully`,
    },
  })

  // Update stack mutation
  const updateStackMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).patch,
    mutationKey: ["updateStack"],
    invalidateQueries: [["listStacks"]],
    toast: {
      errorTitle: "Failed to update stack",
      successTitle: "Stack updated successfully",
    },
  })

  // Delete stack mutation
  const deleteStackMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).delete,
    mutationKey: ["deleteStack"],
    invalidateQueries: [["listStacks"]],
    toast: {
      errorTitle: "Failed to delete stack",
      successTitle: "Stack deleted successfully",
    },
  })

  // Rename stack mutation
  const renameStackMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) =>
      api.node({ nodeId }).stacks({ stackId }).rename.patch,
    mutationKey: ["renameStack"],
    invalidateQueries: [["listStacks"]],
    toast: {
      errorTitle: "Failed to rename stack",
      successTitle: "Stack renamed successfully",
    },
  })

  return {
    createStackMutation,
    updateStackMutation,
    deleteStackMutation,
    renameStackMutation,
  }
}

// ============================================
// Stack Lifecycle Mutation Hooks
// ============================================

export const useStackLifecycleMutations = () => {
  // Stack up mutation
  const stackUpMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).up.post,
    mutationKey: ["stackUp"],
    invalidateQueries: [["stackPs"]],
    toast: {
      errorTitle: "Failed to start stack",
      successTitle: "Stack started successfully",
    },
  })

  // Stack down mutation
  const stackDownMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).down.post,
    mutationKey: ["stackDown"],
    invalidateQueries: [["stackPs"]],
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack restart mutation
  const stackRestartMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) =>
      api.node({ nodeId }).stacks({ stackId }).restart.post,
    mutationKey: ["stackRestart"],
    invalidateQueries: [["stackPs"]],
    toast: {
      errorTitle: "Failed to restart stack",
      successTitle: "Stack restarted successfully",
    },
  })

  // Stack stop mutation
  const stackStopMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).stop.post,
    mutationKey: ["stackStop"],
    invalidateQueries: [["stackPs"]],
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack pull mutation
  const stackPullMutation = eden.useEdenMutation({
    route: (nodeId: string, stackId: string) => api.node({ nodeId }).stacks({ stackId }).pull.post,
    mutationKey: ["stackPull"],
    toast: {
      errorTitle: "Failed to pull images",
      successTitle: "Images pulled successfully",
    },
  })

  return {
    stackUpMutation,
    stackDownMutation,
    stackRestartMutation,
    stackStopMutation,
    stackPullMutation,
  }
}

// ============================================
// Swarm Mutation Hooks
// ============================================

export const useSwarmMutations = () => {
  // Deploy swarm stack mutation
  const deploySwarmStackMutation = eden.useEdenMutation({
    route: (nodeId: string) => api.node({ nodeId }).swarm.stacks.deploy.post,
    mutationKey: ["deploySwarmStack"],
    invalidateQueries: [["listSwarmStacks"]],
    toast: {
      errorTitle: "Failed to deploy swarm stack",
      successTitle: "Swarm stack deployed successfully",
    },
  })

  // Remove swarm stack mutation
  const removeSwarmStackMutation = eden.useEdenMutation({
    route: (nodeId: string, name: string) => api.node({ nodeId }).swarm.stacks({ name }).delete,
    mutationKey: ["removeSwarmStack"],
    invalidateQueries: [["listSwarmStacks"]],
    toast: {
      errorTitle: "Failed to remove swarm stack",
      successTitle: "Swarm stack removed successfully",
    },
  })

  // Scale swarm service mutation
  const scaleSwarmServiceMutation = eden.useEdenMutation({
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).scale.post,
    mutationKey: ["scaleSwarmService"],
    invalidateQueries: [["listSwarmServices"]],
    toast: {
      errorTitle: "Failed to scale service",
      successTitle: "Service scaled successfully",
    },
  })

  // Update swarm service mutation
  const updateSwarmServiceMutation = eden.useEdenMutation({
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).patch,
    mutationKey: ["updateSwarmService"],
    invalidateQueries: [["listSwarmServices"]],
    toast: {
      errorTitle: "Failed to update service",
      successTitle: "Service updated successfully",
    },
  })

  // Remove swarm service mutation
  const removeSwarmServiceMutation = eden.useEdenMutation({
    route: (nodeId: string, serviceId: string) =>
      api.node({ nodeId }).swarm.services({ serviceId }).delete,
    mutationKey: ["removeSwarmService"],
    invalidateQueries: [["listSwarmServices"]],
    toast: {
      errorTitle: "Failed to remove service",
      successTitle: "Service removed successfully",
    },
  })

  // Init swarm mutation
  const initSwarmMutation = eden.useEdenMutation({
    route: (nodeId: string) => api.node({ nodeId }).swarm.init.post,
    mutationKey: ["initSwarm"],
    invalidateQueries: [["swarmStatus"]],
    toast: {
      errorTitle: "Failed to initialize swarm",
      successTitle: "Swarm initialized successfully",
    },
  })

  // Leave swarm mutation
  const leaveSwarmMutation = eden.useEdenMutation({
    route: (nodeId: string) => api.node({ nodeId }).swarm.leave.post,
    mutationKey: ["leaveSwarm"],
    invalidateQueries: [["swarmStatus"]],
    toast: {
      errorTitle: "Failed to leave swarm",
      successTitle: "Left swarm successfully",
    },
  })

  return {
    deploySwarmStackMutation,
    removeSwarmStackMutation,
    scaleSwarmServiceMutation,
    updateSwarmServiceMutation,
    removeSwarmServiceMutation,
    initSwarmMutation,
    leaveSwarmMutation,
  }
}
