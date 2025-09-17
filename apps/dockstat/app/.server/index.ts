import DBFactory from '@dockstat/db'
import type sqliteWrapper from '@dockstat/sqlite-wrapper';
import type { QueryBuilder } from '@dockstat/sqlite-wrapper';
import type { DATABASE } from '@dockstat/typings';
import { createLogger } from '@dockstat/logger'
import { startUp } from './src/utils';
import AdapterHandler from './src/adapters/handler';
import ThemeHandler from './src/theme/themeHandler';

class ServerInstance {
  public logger: {
      error: (msg: string) => void;
      warn: (msg: string) => void;
      info: (msg: string) => void;
      debug: (msg: string) => void;
  }
  private AdapterHandler!: AdapterHandler;
  private DB!: DBFactory;
  private DBWrapper!: sqliteWrapper;
  private config_table!: QueryBuilder<DATABASE.DB_config>;
  private themeHandler!: ThemeHandler;

  constructor(docRoot: HTMLElement, name = 'DockStatAPI'){
    this.logger = createLogger(`${name}`);
    this.logger.debug("Initialized Server Logger")
    this.logger.info("Starting DockStat Server... Please stand by.")

    startUp({
      "Setup Database": {
        steps: [
          () => {
            this.DB = new DBFactory();
          },
          () => {
            // getDB() might return undefined-ish, so fall back to null explicitly
            this.DBWrapper = this.DB.getDB()
          },
          () => {
            // Final verification step: ensure both are assigned
            const okDB = !!this.DB;
            const okWrapper = !!this.DBWrapper;

            if (!okDB || !okWrapper) {
              const msg =
                `Database initialization failed: DB=${okDB}, okWrapper=${okWrapper}`;
              this.logger.error(msg);
              throw new Error(msg);
            }

            this.logger.info('Database initialized successfully.');
          },
          () => {this.config_table = this.DB.getConfigTable()}
        ]
      },
      "Setup Adapter Handler": {
        steps: [
          () => {
            this.AdapterHandler = new AdapterHandler(this.DB.getDB());
          },
        ]
      },
      "Init Docker Adapters": {
        asyncSteps: [() => {return this.AdapterHandler.initDockerAdapters()}]
      },
      "Init Docker Clients": {
        steps: [
          () => {
            this.logger.info("Getting Docker Adapters")
            let c = 0
            const DA = this.AdapterHandler.getDockerAdapters()
            for (const client of Object.values(DA)) {
              c = c++
              this.logger.info(`initializing Nr ${c}`)
              client.init()
            }
          }
        ]
      },
      "Setup Theme Handler": {
        steps: [
          () => {
            this.logger.info("Setting up Theme Handler")
            this.themeHandler = new ThemeHandler(this.DB.getDB(), docRoot)
          }
        ]
      }
    })
  }

  getDB(){
    this.logger.debug("Getting Database Object")
    const dbObj = {
      DB: this.DB,
      DBWrapper: this.DBWrapper,
      tables: {
        config: this.config_table,
        adapter: this.AdapterHandler.getAdapterTable()
      }
    }
    return dbObj
  }

  getThemeHandler(){
    return this.themeHandler
  }

  public getAdapterHandler(){
    return this.AdapterHandler;
  }
}

export default new ServerInstance(document.documentElement)
