import type DB from "@dockstat/sqlite-wrapper"
import type { AdapterTable, DockerClientOptions } from "@dockstat/typings";
import DockerClient from "@dockstat/docker-client";
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import { createLogger } from "@dockstat/logger";

class AdapterHandler {
  private db: DB;
  private adapterConfigTable: QueryBuilder<AdapterTable>;
  private dockerClients: Record<number, DockerClient> = {};
  private logger = createLogger("AdapterHandler")

  constructor(db: DB) {
    this.db = db;
    this.db.createTable("adapters", {
      id: column.id(),
      name: column.text({notNull: true}),
      type: column.enum(["docker"]),
      config: column.json({notNull: true})
    },{ifNotExists:true})

    this.adapterConfigTable = db.table("adapters");
  }

  getAdapterTable(){
    return this.adapterConfigTable
  }

  registerDockerClient(name: string, config: DockerClientOptions = {} ) {
    this.adapterConfigTable.insert({
      name: name,
      type: "docker",
      config: config
    });
  }

  async initDockerClients(){
    const DockerClients = this.adapterConfigTable.where({type: "docker"}).select(["*"]).all()
    let count = 0;
    const rawEntries = Object.keys(this.dockerClients);
    const parsedEntries = rawEntries.map((id) => Number(id));

    for(const client of DockerClients){
      if(parsedEntries.includes(client.id)){
        this.logger.info(`Docker client ${client.id} already initialized, testing reachability`);
        const docker = this.dockerClients[client.id];

        const result = await docker.checkAllHostsHealth();
        if(result){
          this.logger.info(`Docker client ${client.id} is reachable --- ${JSON.stringify(result)}`);
          continue;
        }
          this.logger.warn(`Docker client ${client.id} is not reachable, recreating`);
          delete this.dockerClients[client.id];
      }
      this.logger.info(
          `Initializing Docker client ${client.id} --- ${count}/${DockerClients.length}`
        )
      this.dockerClients[client.id] = new DockerClient(client.id,this.db, client.config);
      this.logger.info(`Initialized Docker client ${client.id} --- ${count}/${DockerClients.length}`);
      count++;
    }
    this.logger.debug(`Initialized ${count} Docker clients`);
  }

  getDockerClients(){
    return this.dockerClients;
  }
}

export default AdapterHandler
