/**
 * Example Data Model
 * A simple example of a Mongoose model for our Template Application
 * Remove or adapt for your production system
 */

const mongoose = require("mongoose");
const logger = require("@/config/logger");
const {
  createEnumValidator,
  validatePostalCode,
} = require("@/models/common/Metadata"); //Import tthe validator for metadata

// =============================================================================
// APPLICATION SCHEMA
// =============================================================================

const applicationSchema = new mongoose.Schema(
  {
    //Gather organizational information
    legalName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    address: {
      street: { type: String, trim: true }, //Open text fields
      city: { type: String, trim: true },
      postalCode: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
          validator: function (v) {
            return !v || validatePostalCode(v);
          },
          message: "Invalid postal code format",
        },
      },
      province: {
        type: String,
        required: true,
        uppercase: true,
        validate: createEnumValidator("PROVINCES"),
      },

      country: {
        type: String,
        required: true,
        uppercase: true,
        validate: createEnumValidator("COUNTRIES"),
      },
    },

    organizationType: {
      type: String,
      required: true,
      uppercase: true,
      validate: createEnumValidator("ORGANIZATION_TYPES"),
    },

    taxNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    website: {
      type: String,
      trim: true,
      match: /^https?:\/\/.+/,
    },

    //Preference Information
    language: {
      type: String,
      required: true,
      uppercase: true,
      validate: createEnumValidator("LANGUAGES"),
    },

    //Administrative
    status: {
      type: String,
      required: false,
      uppercase: true,
      validate: createEnumValidator("APPLICATION_STATUSES"),
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedDate: {
      type: Date,
    },

    //Audit
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Sample Indexes for application
applicationSchema.index({ legalName: 1 });
applicationSchema.index({ "address.city": 1 });
applicationSchema.index({ "address.province": 1 });
applicationSchema.index({ createdAt: 1 });

const Application = mongoose.model("Application", applicationSchema);

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Models
  Application
};
