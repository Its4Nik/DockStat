import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

// ============================================
// Stack Mutation Hooks
// ============================================

export const useStackMutations = () => {
  const eden = useContext(EdenClientContext)

  // Create stack mutation
  const createStackMutation = eden.mutateRoute({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["createStack"],
    routeBuilder: ({ nodeId }: { nodeId: string }) => api.node({ nodeId }).stacks.post,
    toast: {
      errorTitle: "Failed to create stack",
      successTitle: (_result) => `Stack created successfully`,
    },
  })

  // Update stack mutation
  const updateStackMutation = eden.mutateRoute({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["updateStack"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).patch,
    toast: {
      errorTitle: "Failed to update stack",
      successTitle: "Stack updated successfully",
    },
  })

  // Delete stack mutation
  const deleteStackMutation = eden.mutateRoute({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["deleteStack"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).delete,
    toast: {
      errorTitle: "Failed to delete stack",
      successTitle: "Stack deleted successfully",
    },
  })

  // Rename stack mutation
  const renameStackMutation = eden.mutateRoute({
    invalidateQueries: [["listStacks"]],
    mutationKey: ["renameStack"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
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
  const eden = useContext(EdenClientContext)

  // Stack up mutation
  const stackUpMutation = eden.mutateRoute({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackUp"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).up.post,
    toast: {
      errorTitle: "Failed to start stack",
      successTitle: "Stack started successfully",
    },
  })

  // Stack down mutation
  const stackDownMutation = eden.mutateRoute({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackDown"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).down.post,
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack restart mutation
  const stackRestartMutation = eden.mutateRoute({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackRestart"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).restart.post,
    toast: {
      errorTitle: "Failed to restart stack",
      successTitle: "Stack restarted successfully",
    },
  })

  // Stack stop mutation
  const stackStopMutation = eden.mutateRoute({
    invalidateQueries: [["stackPs"]],
    mutationKey: ["stackStop"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).stop.post,
    toast: {
      errorTitle: "Failed to stop stack",
      successTitle: "Stack stopped successfully",
    },
  })

  // Stack pull mutation
  const stackPullMutation = eden.mutateRoute({
    mutationKey: ["stackPull"],
    routeBuilder: ({ nodeId, stackId }: { nodeId: string; stackId: string }) =>
      api.node({ nodeId }).stacks({ stackId }).pull.post,
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
  const eden = useContext(EdenClientContext)

  // Deploy swarm stack mutation
  const deploySwarmStackMutation = eden.mutateRoute({
    invalidateQueries: [["listSwarmStacks"]],
    mutationKey: ["deploySwarmStack"],
    routeBuilder: ({ nodeId }: { nodeId: string }) => api.node({ nodeId }).swarm.stacks.deploy.post,
    toast: {
      errorTitle: "Failed to deploy swarm stack",
      successTitle: "Swarm stack deployed successfully",
    },
  })

  // Remove swarm stack mutation
  const removeSwarmStackMutation = eden.mutateRoute({
    invalidateQueries: [["listSwarmStacks"]],
    mutationKey: ["removeSwarmStack"],
    routeBuilder: ({ nodeId, name }: { nodeId: string; name: string }) =>
      api.node({ nodeId }).swarm.stacks({ name }).delete,
    toast: {
      errorTitle: "Failed to remove swarm stack",
      successTitle: "Swarm stack removed successfully",
    },
  })

  // Scale swarm service mutation
  const scaleSwarmServiceMutation = eden.mutateRoute({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["scaleSwarmService"],
    routeBuilder: ({ nodeId, serviceId }: { nodeId: string; serviceId: string }) =>
      api.node({ nodeId }).swarm.services({ serviceId }).scale.post,
    toast: {
      errorTitle: "Failed to scale service",
      successTitle: "Service scaled successfully",
    },
  })

  // Update swarm service mutation
  const updateSwarmServiceMutation = eden.mutateRoute({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["updateSwarmService"],
    routeBuilder: ({ nodeId, serviceId }: { nodeId: string; serviceId: string }) =>
      api.node({ nodeId }).swarm.services({ serviceId }).patch,
    toast: {
      errorTitle: "Failed to update service",
      successTitle: "Service updated successfully",
    },
  })

  // Remove swarm service mutation
  const removeSwarmServiceMutation = eden.mutateRoute({
    invalidateQueries: [["listSwarmServices"]],
    mutationKey: ["removeSwarmService"],
    routeBuilder: ({ nodeId, serviceId }: { nodeId: string; serviceId: string }) =>
      api.node({ nodeId }).swarm.services({ serviceId }).delete,
    toast: {
      errorTitle: "Failed to remove service",
      successTitle: "Service removed successfully",
    },
  })

  // Init swarm mutation
  const initSwarmMutation = eden.mutateRoute({
    invalidateQueries: [["swarmStatus"]],
    mutationKey: ["initSwarm"],
    routeBuilder: ({ nodeId }: { nodeId: string }) => api.node({ nodeId }).swarm.init.post,
    toast: {
      errorTitle: "Failed to initialize swarm",
      successTitle: "Swarm initialized successfully",
    },
  })

  // Leave swarm mutation
  const leaveSwarmMutation = eden.mutateRoute({
    invalidateQueries: [["swarmStatus"]],
    mutationKey: ["leaveSwarm"],
    routeBuilder: ({ nodeId }: { nodeId: string }) => api.node({ nodeId }).swarm.leave.post,
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
