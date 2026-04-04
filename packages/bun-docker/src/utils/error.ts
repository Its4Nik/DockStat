export class DockerError extends Error {
  status: number
  path: string
  version: string

  constructor(message: string, status: number, path: string, version: string) {
    super(message)
    this.name = "DockerError"
    this.status = status
    this.path = path
    this.version = version

    Object.setPrototypeOf(this, DockerError.prototype)
  }
}
