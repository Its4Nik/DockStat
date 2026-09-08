import { AuthService } from "@dockstat/auth"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

/**
 * Auth service singleton backed by the app database.
 *
 * Guest registration reads the config table dynamically so settings
 * changes apply without a restart.
 */

const AuthServicesLogger = BaseLogger.spawn("AuthSingleton")

export const Auth = new AuthService(DockStatDB._sqliteWrapper, BaseLogger, {
  getAllowGuestRegistration: () =>
    DockStatDB.configTable.select(["additionalSettings"]).first()?.additionalSettings
      ?.enableRegistration || false,
  firstUserRole: "admin",
  setAllowGuestRegistration: (enable: boolean) => {
    DockStatDB.configTable.where({id: 0}).update({ additionalSettings: { enableRegistration: enable } })
  },
})

AuthServicesLogger.info("Auth singleton ready")

