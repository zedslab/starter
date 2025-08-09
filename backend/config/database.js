/**
 * Database Configuration
 * Configures MongoDB connection and provides database utilities
 */
const mongoose = require("mongoose");
const logger = require("./logger");

/**
 * Database Configuration
 * Handles MongoDB connection and configuration
 */
class Database {
  constructor() {
    this.uri =
      process.env.NODE_ENV === "test" ? process.env.MONGODB_TEST_URI : process.env.MONGODB_URI ;

    this.options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      // Enable TLS/SSL if not connecting to localhost
      // ...(this.uri.includes("localhost")
      //   ? {}
      //   : {
      //       ssl: true,
      //       sslValidate: true,
      //       sslCA: process.env.MONGODB_CA_CERT,
      //     }),
    };

    this.connection = null;

    // Enable MongoDB query performance monitoring
    try {
      logger.monitorMongoDBQueries(mongoose);
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * Connect to MongoDB
   * @returns {Promise} - MongoDB connection
   */
  async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      // Set up mongoose connection
      mongoose.set("strictQuery", true);

      // Connect to MongoDB
      this.connection = await mongoose.connect(this.uri, this.options);

      // Log successful connection
      logger.info("MongoDB connected successfully", {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      });

      // Set up connection event handlers
      mongoose.connection.on("error", (err) => {
        logger.error("MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
      });

      // Handle process termination
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logger.error("MongoDB connection error:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise} - Disconnect promise
   */
  async disconnect() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info("MongoDB disconnected");
      }
    } catch (error) {
      logger.error("MongoDB disconnect error:", error);
      throw error;
    }
  }

  /**
   * Check database health
   * @returns {Object} - Health status
   */
  async healthCheck() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return {
          status: "unhealthy",
          details: "Database not connected",
          readyState: mongoose.connection.readyState,
        };
      }

      // Ping database
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        details: "Database connected and responding",
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      };
    } catch (error) {
      logger.error("Database health check failed:", error);

      return {
        status: "unhealthy",
        details: error.message,
        readyState: mongoose.connection.readyState,
      };
    }
  }

  /**
   * Create indexes for collections
   * This ensures that all required indexes are created
   * @returns {Promise} - Promise that resolves when indexes are created
   */
  async createIndexes() {
    try {
      logger.info("Creating MongoDB indexes");
      const modelNames = mongoose.modelNames();
      for (const modelName of modelNames) {
        const model = mongoose.model(modelName);
        await model.createIndexes();
        logger.info(`Created indexes for ${modelName}`);
      }
      
      // Create TTL index for Session model if it exists
      if (mongoose.models.Session) {
        await mongoose.model("Session").createIndexes();
        logger.info("Created TTL index for Session model");
      }
      
      logger.info("All MongoDB indexes created successfully");
    } catch (error) {
      logger.error("Failed to create MongoDB indexes:", error);
      throw error;
    }
  }
}

module.exports = new Database();
