export class DockerError extends Error {
  status: number
  path: string
  version: string
  params: object | string

  constructor(
    message: string,
    status: number,
    path: string,
    version: string,
    params: object | string
  ) {
    super(message)
    this.name = "DockerError"
    this.status = status
    this.path = path
    this.version = version
    this.params = params

    Object.setPrototypeOf(this, DockerError.prototype)
  }
}
