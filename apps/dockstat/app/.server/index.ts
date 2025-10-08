import DBFactory from '@dockstat/db'
import type sqliteWrapper from '@dockstat/sqlite-wrapper';
import type { QueryBuilder } from '@dockstat/sqlite-wrapper';
import type { DATABASE } from '@dockstat/typings';
import { createLogger } from '@dockstat/logger'
import PluginHandler from "@dockstat/plugin-handler"

import { startUp } from '~/.server/src/utils';
import AdapterHandler from '~/.server/src/adapters/handler';
import ThemeHandler from '~/.server/src/theme/themeHandler';



class ServerInstance {
  private logger: {
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
  private pluginHandler!: PluginHandler

  constructor(name = 'DockStatAPI') {
    this.logger = createLogger(`${name}`);
    this.logger.debug("Initialized Server Logger");
    this.logger.info("Starting DockStat Server... Please stand by.");

    startUp({
      "Setup Database": {
        steps: [
          () => {
            this.logger.debug("Step: Instantiating DBFactory");
            this.DB = new DBFactory();
            this.logger.info("DBFactory instance created");
          },
          () => {
            this.logger.debug("Step: Getting DB Wrapper from DBFactory");
            this.DBWrapper = this.DB.getDB();
            this.logger.info(`DBWrapper assigned: ${!!this.DBWrapper}`);
          },
          () => {
            // Final verification step: ensure both are assigned
            const okDB = !!this.DB;
            const okWrapper = !!this.DBWrapper;

            this.logger.debug(`Verifying DB and DBWrapper: DB=${okDB}, Wrapper=${okWrapper}`);

            if (!okDB || !okWrapper) {
              const msg =
                `Database initialization failed: DB=${okDB}, okWrapper=${okWrapper}`;
              this.logger.error(msg);
              throw new Error(msg);
            }

            this.logger.info('Database initialized successfully.');
          },
          () => {
            this.logger.debug("Step: Getting config table from DB");
            this.config_table = this.DB.getConfigTable();
            this.logger.info("Config table assigned");
          }
        ]
      },
      "initialize plugins": {
        steps: [
          () => {
            this.pluginHandler = new PluginHandler(this.DB.getDB())
          }
        ]
      },
      "Setup Adapter Handler": {
        steps: [
          () => {
            this.logger.debug("Step: Instantiating AdapterHandler");
            this.AdapterHandler = new AdapterHandler(this.DB.getDB());
            this.logger.info("AdapterHandler instance created");
          },
        ]
      },
      "Init Docker Adapters": {
        asyncSteps: [async () => {
          this.logger.info("Async Step: Initializing Docker Adapters");
          try {
            await this.AdapterHandler.initDockerAdapters();
            this.logger.info("Docker Adapters initialized");
          } catch (err) {
            this.logger.error(`Error initializing Docker Adapters: ${err}`);
            throw err;
          }
        }]
      },
      "Init Docker Clients": {
        steps: [
          () => {
            this.logger.info("Getting Docker Adapters");
            let c = 0;
            const DA = this.AdapterHandler.getDockerAdapters();
            this.logger.debug(`Found ${Object.keys(DA).length} Docker Adapters`);
            for (const client of Object.values(DA)) {
              c = c++;
              this.logger.info(`initializing Nr ${c}`);
              try {
                client.init();
                this.logger.debug(`Docker client ${c} initialized`);
              } catch (err) {
                this.logger.error(`Error initializing Docker client ${c}: ${err}`);
              }
            }
          }
        ]
      },
      "Setup Theme Handler": {
        steps: [
          () => {
            this.logger.info("Setting up Theme Handler");
            try {
              this.themeHandler = new ThemeHandler(this.DB.getDB());
              this.logger.debug("ThemeHandler instance created");
            } catch (err) {
              this.logger.error(`Error setting up ThemeHandler: ${err}`);
              throw err;
            }
          }
        ]
      },
    });
  }

  getLogger() {
    return this.logger;
  }

  getDB() {
    this.logger.debug("Getting Database Object");
    const dbObj = {
      DB: this.DB,
      DBWrapper: this.DBWrapper,
      tables: {
        config: this.config_table,
        themes: this.themeHandler.getThemeTable(),
        adapter: this.AdapterHandler.getAdapterTable()
      }
    };
    this.logger.info("Database object returned");
    return dbObj;
  }

  getThemeHandler() {
    this.logger.debug("Getting ThemeHandler instance");
    return this.themeHandler;
  }

  getAdapterHandler() {
    this.logger.debug("Getting AdapterHandler instance");
    return this.AdapterHandler;
  }

  getPluginHandler() {
    this.logger.debug("Getting PluginHandler")
    return this.pluginHandler;
  }
}

export default new ServerInstance();
