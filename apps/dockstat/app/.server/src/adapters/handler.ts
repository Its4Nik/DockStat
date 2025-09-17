import type DB from "@dockstat/sqlite-wrapper"
import type { DOCKER, ADAPTER ,DockerAdapterOptions } from "@dockstat/typings";
import DockerClient from "@dockstat/docker-client";
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import { createLogger } from "@dockstat/logger";

class AdapterHandler {
  private db: DB;
  private adapterConfigTable: QueryBuilder<ADAPTER.AdapterTable>;
  private dockerAdapters: Record<number, DockerClient> = {};
  private logger = createLogger("AdapterHandler")

  constructor(db: DB) {
    this.db = db;
    this.db.createTable("adapters", {
      id: column.id(),
      name: column.text({ notNull: true }),
      type: column.enum(["docker"]),
      config: column.json({ notNull: true }),
    },{ifNotExists:true})

    this.adapterConfigTable = db.table("adapters", {jsonColumns: ["config"]});
  }

  getAdapterTable(){
    return this.adapterConfigTable
  }

  registerDockerAdapter(name: string, config: DOCKER.DockerAdapterOptions = {} ) {
    this.adapterConfigTable.insert({
      name: name,
      type: "docker",
      config: config
    });
  }

  async initDockerAdapters(){
    this.logger.info("Initializing Docker adapters");
    const DockerAdapters = this.adapterConfigTable.where({type: "docker"}).select(["*"]).all()
    let count = 0;
    const rawEntries = Object.keys(this.dockerAdapters);
    const parsedEntries = rawEntries.map((id) => Number(id));

    for(const adapter of DockerAdapters){
      if(parsedEntries.includes(adapter.id)){
        this.logger.info(`Docker Adapter ${adapter.id} already initialized, testing reachability`);
        const docker = this.dockerAdapters[adapter.id];

        const result = await docker.checkAllHostsHealth();
        if(result){
          this.logger.info(`Docker Adapter ${adapter.id} is reachable --- ${JSON.stringify(result)}`);
          continue;
        }
          this.logger.warn(`Docker Adapter ${adapter.id} is not reachable, recreating`);
          delete this.dockerAdapters[adapter.id];
      }
      this.logger.info(
          `Initializing Docker Adapter ${adapter.id} --- ${count}/${DockerAdapters.length}`
        )
      this.dockerAdapters[adapter.id] = new DockerClient(adapter.id,this.db, adapter.config as DockerAdapterOptions);
      this.logger.info(`Initialized Docker Adapter ${adapter.id} --- ${count}/${DockerAdapters.length}`);
      count++;
    }
    this.logger.debug(`Initialized ${count} Docker Adapters`);
  }

  getDockerAdapters(){
    return this.dockerAdapters;
  }
}

export default AdapterHandler
