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
    this.logger.info("Initializing AdapterHandler with DB instance");
    this.db = db;
    this.db.createTable("adapters", {
      id: column.id(),
      name: column.text({ notNull: true }),
      type: column.enum(["docker"]),
      config: column.json({ notNull: true }),
    },{ifNotExists:true})

    this.adapterConfigTable = db.table("adapters", {jsonColumns: ["config"]});
    this.logger.debug("Adapter config table created and assigned");
  }

  getAdapterTable(){
    this.logger.debug("Returning adapterConfigTable");
    return this.adapterConfigTable
  }

  registerDockerAdapter(name: string, config: DOCKER.DockerAdapterOptions = {} ) {
    this.logger.info(`Registering Docker Adapter: ${name}`);
    this.logger.debug(`Config: ${JSON.stringify(config)}`);
    try {
      this.adapterConfigTable.insert({
        name: name,
        type: "docker",
        config: config
      });
      this.logger.info(`Docker Adapter "${name}" registered successfully`);
    } catch (err) {
      this.logger.error(`Failed to register Docker Adapter "${name}": ${err}`);
      throw err;
    }
  }

  unregisterDockerAdapter(name: string){
    this.logger.debug(`Unregistering Docker Adapter: ${name}`);
    try {
      this.adapterConfigTable.where({name: name}).delete();
      this.logger.info(`Docker Adapter "${name}" unregistered successfully`);
    } catch (err) {
      this.logger.error(`Failed to unregister Docker Adapter "${name}": ${err}`);
      throw err;
    }
  }

  async initDockerAdapters(){
    this.logger.info("Initializing Docker adapters");
    const DockerAdapters = this.adapterConfigTable.where({type: "docker"}).select(["*"]).all()
    this.logger.debug(`Found ${DockerAdapters.length} Docker adapters in table`);
    let count = 0;
    const rawEntries = Object.keys(this.dockerAdapters);
    const parsedEntries = rawEntries.map((id) => Number(id));

    for(const adapter of DockerAdapters){
      this.logger.debug(`Processing adapter ID: ${adapter.id}`);
      if(parsedEntries.includes(adapter.id)){
        this.logger.info(`Docker Adapter ${adapter.id} already initialized, testing reachability`);
        const docker = this.dockerAdapters[adapter.id];

        try {
          const result = await docker.checkAllHostsHealth();
          if(result){
            this.logger.info(`Docker Adapter ${adapter.id} is reachable --- ${JSON.stringify(result)}`);
            continue;
          }
          this.logger.warn(`Docker Adapter ${adapter.id} is not reachable, recreating`);
          delete this.dockerAdapters[adapter.id];
        } catch (err) {
          this.logger.error(`Error checking health for Docker Adapter ${adapter.id}: ${err}`);
          delete this.dockerAdapters[adapter.id];
        }
      }
      this.logger.info(
          `Initializing Docker Adapter ${adapter.id} --- ${count}/${DockerAdapters.length}`
        )
      try {
        this.dockerAdapters[adapter.id] = new DockerClient(adapter.id,this.db, adapter.config as DockerAdapterOptions);
        this.logger.info(`Initialized Docker Adapter ${adapter.id} --- ${count}/${DockerAdapters.length}`);
      } catch (err) {
        this.logger.error(`Failed to initialize Docker Adapter ${adapter.id}: ${err}`);
      }
      count++;
    }
    this.logger.debug(`Initialized ${count} Docker Adapters`);
  }

  getDockerAdapters(){
    this.logger.debug("Returning dockerAdapters map");
    return this.dockerAdapters;
  }
}

export default AdapterHandler
