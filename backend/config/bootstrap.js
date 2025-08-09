/**
 * Bootstrap Module
 * Initializes the application and creates initial super admin user
 */
const logger = require("@/config/logger");
const User = require("@/models/common/User");
const { initializeSystem } = require("@/models/common/Metadata");
const bcrypt = require("bcrypt");

/**
 * Bootstrap the application
 */
async function bootstrap() {
  try {
    logger.info("Starting application bootstrap...");
    await initializeSystem();
  if (['development', 'test'].includes(process.env.NODE_ENV)) {
    await createSuperAdminUser();
    }
    logger.info("Application bootstrap completed successfully");
  } catch (error) {
    logger.error("Bootstrap failed:", error);
    throw error;
  }
}

/**
 * Create initial super admin user for development
 */
async function createSuperAdminUser() {
  try {
    const existingSuperAdmin = await User.findOne({
      roles: { $in: ["SUPER_ADMIN"] },
      isActive: true,
    });
    if (existingSuperAdmin) {
      logger.info("Super admin user already exists");
      return existingSuperAdmin;
    }

    const superAdminData = {
      firstName: "System",
      lastName: "Administrator",
      email: process.env.SUPER_ADMIN_EMAIL || "admin@REDVENOM.ca",
      username: process.env.SUPER_ADMIN_USERNAME || "superadmin",
      roles: ["SUPER_ADMIN"],
      isActive: true,
      isEmailVerified: true,
      title: "System Administrator",
      employeeId: "SYSTEM_ADMIN_001",
    };

    const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || "12", 10));
    superAdminData.passwordHash = await bcrypt.hash(password, salt);
    superAdminData.passwordSalt = salt;

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    logger.security("Super admin user created", {
      email: superAdmin.email,
      username: superAdmin.username,
      roles: superAdmin.roles,
    });

    if (process.env.NODE_ENV === "development") {
      logger.info("=".repeat(60));
      logger.info("SUPER ADMIN CREDENTIALS (Development Only)");
      logger.info("=".repeat(60));
      logger.info(`Email: ${superAdmin.email}`);
      logger.info(`Username: ${superAdmin.username}`);
      logger.info(`Password: [REDACTED]`);
      logger.info("=".repeat(60));
      logger.info("Please change the password after first login!");
      logger.info("=".repeat(60));
    }

    return superAdmin;
  } catch (error) {
    if (error.code === 11000) {
      logger.info("Super admin user already exists (duplicate key)");
      return null;
    }
    logger.error("Error creating super admin user:", error);
    throw error;
  }
}

/**
 * Create additional development users
 */
async function createDevelopmentUsers() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const developmentUsers = [
      {
        firstName: "Government",
        lastName: "User",
        email: "gov.user@REDVENOM.ca",
        username: "govuser",
        roles: ["INTERNAL"],
        title: "Program Officer",
      },
      {
        firstName: "External",
        lastName: "User",
        email: "external.user@example.com",
        username: "extuser",
        roles: ["APPLICANT"],
        title: "Executive Director",
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin.user@REDVENOM.ca",
        username: "adminuser",
        roles: ["ADMINISTRATOR"],
        title: "System Administrator",
      },
    ];

    for (const userData of developmentUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        continue;
      }

      const password = "DevUser123!";
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || "12", 10));
      userData.passwordHash = await bcrypt.hash(password, salt);
      userData.passwordSalt = salt;
      userData.isActive = true;
      userData.isEmailVerified = true;

      const user = new User(userData);
      await user.save();

      logger.security(`Development user created`, {
        email: user.email,
        username: user.username,
        roles: user.roles,
      });
    }
  } catch (error) {
    logger.error("Error creating development users:", error);
  }
}

/**
 * Verify system health after bootstrap
 */
async function verifySystemHealth() {
  try {
    const User = require("@/models/common/User");
    const userCount = await User.countDocuments();
    logger.info(`Database connection verified. User count: ${userCount}`);

    const { Ministry, FiscalYear, Metadata } = require("@/models/common/Metadata");
    const ministryCount = await Ministry.countDocuments();
    const fiscalYearCount = await FiscalYear.countDocuments();
    const metadataCount = await Metadata.countDocuments();

    logger.info("Grant system verification:", {
      ministries: ministryCount,
      fiscalYears: fiscalYearCount,
      metadataCategories: metadataCount,
    });

    return true;
  } catch (error) {
    logger.error("System health verification failed:", error);
    return false;
  }
}

/**
 * Full bootstrap with all components
 */
async function fullBootstrap() {
  try {
    await bootstrap();
    if (process.env.NODE_ENV === "development") {
      await createDevelopmentUsers();
    }
    const isHealthy = await verifySystemHealth();
    if (!isHealthy) {
      throw new Error("System health verification failed");
    }
    logger.info("Full bootstrap completed successfully");
  } catch (error) {
    logger.error("Full bootstrap failed:", error);
    throw error;
  }
}

module.exports = {
  bootstrap,
  createSuperAdminUser,
  createDevelopmentUsers,
  verifySystemHealth,
  fullBootstrap,
};
