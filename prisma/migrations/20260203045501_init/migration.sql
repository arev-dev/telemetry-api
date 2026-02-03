-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TelemetryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "platform" TEXT,
    "gameVersion" TEXT,
    "message" TEXT,
    "isActive" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "lastPingAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSessionTime" TEXT
);
INSERT INTO "new_TelemetryEvent" ("createdAt", "endedAt", "eventType", "gameVersion", "id", "isActive", "lastPingAt", "message", "platform", "totalSessionTime") SELECT "createdAt", "endedAt", "eventType", "gameVersion", "id", "isActive", coalesce("lastPingAt", CURRENT_TIMESTAMP) AS "lastPingAt", "message", "platform", "totalSessionTime" FROM "TelemetryEvent";
DROP TABLE "TelemetryEvent";
ALTER TABLE "new_TelemetryEvent" RENAME TO "TelemetryEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
