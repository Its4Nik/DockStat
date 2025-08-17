import type { DATABASE } from "@dockstat/typings";

export default class HostHandler {
  private hosts: DATABASE.DB_target_host[] = [];

  public addHost(host: DATABASE.DB_target_host) {
    return this.hosts.push(host);
  }

  public getHosts() {
    return this.hosts;
  }

  public removeHost(host: DATABASE.DB_target_host) {
    this.hosts = this.hosts.filter(
      (existingHost) => existingHost.id !== host.id,
    );
  }
}
