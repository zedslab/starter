/**
 * Mertadata Models and Services
 * Comprehensive Mongoose schemas and functions for managing Metadata for your application,
 */

const mongoose = require('mongoose');
const logger = require('@/config/logger');

// =============================================================================
// DYNAMIC ENUM CACHE AND VALIDATION SYSTEM
// =============================================================================

class EnumCache {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      const metadata = await Metadata.find({ isActive: true });
      this.cache.clear();
      
      for (const meta of metadata) {
        const activeValues = meta.values
          .filter(v => v.isActive)
          .map(v => v.value);
        this.cache.set(meta.commonId, activeValues);
      }
      
      this.initialized = true;
      logger.info('Enum cache initialized successfully');
    } catch (error) {
      logger.error('Error initializing enum cache:', error);
      throw error;
    }
  }

  getValues(enumId) {
    if (!this.initialized) {
      throw new Error('Enum cache not initialized');
    }
    return this.cache.get(enumId) || [];
  }

  async refresh(enumId) {
    try {
      const metadata = await Metadata.findOne({ commonId: enumId, isActive: true });
      if (metadata) {
        const activeValues = metadata.values
          .filter(v => v.isActive)
          .map(v => v.value);
        this.cache.set(enumId, activeValues);
      }
    } catch (error) {
      logger.error(`Error refreshing enum cache for ${enumId}:`, error);
    }
  }
}

const enumCache = new EnumCache();

/**
 * Dynamic enum validator
 */
function createEnumValidator(enumId) {
  return {
    validator: function(value) {
      if (!value) return true; // Allow empty values if not required
      const validValues = enumCache.getValues(enumId);
      return validValues.includes(value.toString().toUpperCase());
    },
    message: function(props) {
      const validValues = enumCache.getValues(enumId);
      return `${props.value} is not a valid value. Valid values are: ${validValues.join(', ')}`;
    }
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique identifier
 */
function generateUniqueId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

/**
 * Validate Canadian postal code
 */
function validatePostalCode(postalCode) {
  const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return canadianPostalCodeRegex.test(postalCode);
}

/**
 * Validate phone number (North American format)
 */
function validatePhoneNumber(phone) {
  const phoneRegex = /^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone);
}


// =============================================================================
// METADATA SCHEMA
// =============================================================================

/**
 * Metadata Schema for Dynamic Enums
 * Stores all enum values that can be dynamically updated, which impacts all other schemas using ENUMS
 */

const metadataSchema = new mongoose.Schema({
  commonId: {
    type: String,
    required: true,
    unique:true, 
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  values: [{
    value: {
      type: String,
      required: false,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for metadata
// metadataSchema.index({ commonId: 1 });
metadataSchema.index({ 'values.value': 1 });

const Metadata = mongoose.model('Metadata', metadataSchema);

// =============================================================================
// FISCAL YEAR SCHEMA
// =============================================================================
const fiscalYearSchema = new mongoose.Schema({
  fiscalYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  budgetYear: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Include virtuals in JSON output
  toObject: { virtuals: true } // Include virtuals in object output
});

// Virtual for isCurrent
fiscalYearSchema.virtual('isCurrent').get(function () {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate;
});

// Indexes for fiscal year
fiscalYearSchema.index({ fiscalYear: 1 }, { unique: true });
fiscalYearSchema.index({ isActive: 1 });

const FiscalYear = mongoose.model('FiscalYear', fiscalYearSchema);

// =============================================================================
// MINISTRY SCHEMA
// =============================================================================

const ministrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  minister: {
    type: String,
    trim: true,
    maxlength: 100
  },
  deputyMinister: {
    type: String,
    trim: true,
    maxlength: 100
  },
  website: {
    type: String,
    trim: true,
    match: /^https?:\/\/.+/
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/
  },
  contactPhone: {
    type: String,
    trim: true,
    validate: {
      validator: validatePhoneNumber,
      message: 'Invalid phone number format'
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true, default: 'Alberta' },
    postalCode: { 
      type: String, 
      trim: true, 
      uppercase: true,
      validate: {
        validator: validatePostalCode,
        message: 'Invalid postal code format'
      }
    },
    country: { type: String, trim: true, default: 'Canada' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for ministry
ministrySchema.index({ name: 1 }, { unique: true });
ministrySchema.index({ shortName: 1 }, { unique: true });
ministrySchema.index({ isActive: 1 });

const Ministry = mongoose.model('Ministry', ministrySchema);

// =============================================================================
// METADATA CRUD OPERATIONS
// =============================================================================

class MetadataCRUD {
  /**
   * Get all enum values for a commonId
   */
  static async getEnumValues(commonId) {
    try {
      const metadata = await Metadata.findOne({ commonId: commonId.toUpperCase() });
      return metadata ? metadata.values.filter(v => v.isActive) : [];
    } catch (error) {
      logger.error(`Error getting enum values for ${commonId}:`, error);
      throw error;
    }
  }

  /**
   * Add new enum value
   */
  static async addEnumValue(commonId, valueData) {
    try {
      const metadata = await Metadata.findOne({ commonId: commonId.toUpperCase() });
      if (!metadata) {
        throw new Error(`Metadata commonId ${commonId} not found`);
      }

      // Check if value already exists
      const existingValue = metadata.values.find(v => v.value === valueData.value.toUpperCase());
      if (existingValue) {
        throw new Error(`Value ${valueData.value} already exists in commonId ${commonId}`);
      }

      metadata.values.push({
        ...valueData,
        value: valueData.value.toUpperCase()
      });

      await metadata.save();
      
      // Refresh enum cache
      await enumCache.refresh(commonId.toUpperCase());
      
      logger.info(`Added enum value ${valueData.value} to commonId ${commonId}`);
      return metadata;
    } catch (error) {
      logger.error(`Error adding enum value to ${commonId}:`, error);
      throw error;
    }
  }

  /**
   * Update enum value
   */
  static async updateEnumValue(commonId, value, updateData) {
    try {
      const metadata = await Metadata.findOne({ commonId: commonId.toUpperCase() });
      if (!metadata) {
        throw new Error(`Metadata commonId ${commonId} not found`);
      }

      const enumValue = metadata.values.find(v => v.value === value.toUpperCase());
      if (!enumValue) {
        throw new Error(`Value ${value} not found in commonId ${commonId}`);
      }

      Object.assign(enumValue, updateData);
      await metadata.save();
      
      // Refresh enum cache
      await enumCache.refresh(commonId.toUpperCase());
      
      logger.info(`Updated enum value ${value} in commonId ${commonId}`);
      return metadata;
    } catch (error) {
      logger.error(`Error updating enum value ${value} in ${commonId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate enum value
   */
  static async deactivateEnumValue(commonId, value) {
    try {
      return await this.updateEnumValue(commonId, value, { isActive: false });
    } catch (error) {
      logger.error(`Error deactivating enum value ${value} in ${commonId}:`, error);
      throw error;
    }
  }
}

// =============================================================================
// SYSTEM INITIALIZATION
// =============================================================================

async function initializeSystem() {
  try {
    logger.info(`Initializing ${process.env.APP_NAME} Metadata...`);
    
    await initializeMetadata();
    await initializeFiscalYears();
    await initializeMinistries();
    await enumCache.initialize();
    
    logger.info('Metadata initialized successfully');
  } catch (error) {
    logger.error('Error initializing system:', error);
    throw error;
  }
}

async function initializeMetadata() {
  const metadataDefinitions = [
    {
      commonId: 'ROLE_TYPES',
      name: 'Role Types',
      description: 'Role types for users',
      values: [
        { value: 'PUBLIC', name: 'Public', description: 'Public access level' },
        { value: 'APPLICANT', name: 'Applicant', description: 'Standard access level for applicants' },
        { value: 'INTERNAL', name: 'Internal', description: 'Internal access level' },
        { value: 'ADVANCED', name: 'Advanced', description: 'Advanced access level' },
        { value: 'ADMINISTRATOR', name: 'Administrator', description: 'Administrator access level' },
        { value: 'SUPER_ADMIN', name: 'Super Admin', description: 'Super administrator access level' }
      ]
    },

      {
      commonId: 'SSO_PROVIDERS',
      name: 'SSO Providers',
      description: 'The list of valid Single Sign On (SSO) providers for this app',
      values: [
        { value: null, name: 'None', description: 'No SSO provider' },
        { value: 'GOOGLE', name: 'Google', description: 'Google as SSO provider' },
        { value: 'MICROSOFT', name: 'Microsoft', description: 'Microsoft as SSO provider' },
        { value: 'GITHUB', name: 'GitHub', description: 'GitHub as SSO provider' },
      ]
    },
    {
      commonId: 'ADDRESS_TYPES',
      name: 'Address Types',
      description: 'Types of addresses for organizations and contacts',
      values: [
        { value: 'MAILING', name: 'Mailing Address', description: 'Primary mailing address' },
        { value: 'PHYSICAL', name: 'Physical Address', description: 'Physical location address' },
        { value: 'BILLING', name: 'Billing Address', description: 'Billing and invoicing address' }
      ]
    },
    {
      commonId: 'APPLICATION_STATUSES',
      name: 'Application Statuses',
      description: 'Status values for grant applications',
      values: [
        { value: 'DRAFT', name: 'Draft', description: 'Application is in draft status' },
        { value: 'SUBMITTED', name: 'Submitted', description: 'Application has been submitted' },
        { value: 'UNDER_REVIEW', name: 'Under Review', description: 'Application is under review' },
        { value: 'ADDITIONAL_INFO_REQUIRED', name: 'Additional Info Required', description: 'Additional information is required' },
        { value: 'APPROVED', name: 'Approved', description: 'Application has been approved' },
        { value: 'REJECTED', name: 'Rejected', description: 'Application has been rejected' },
        { value: 'WITHDRAWN', name: 'Withdrawn', description: 'Application has been withdrawn' }
      ]
    },
    {
      commonId: 'ORGANIZATION_TYPES',
      name: 'Organization Types',
      description: 'Types of organizations',
      values: [
        { value: 'NON_PROFIT', name: 'Non-Profit', description: 'Non-profit organizations' },
        { value: 'FOR_PROFIT', name: 'For-Profit', description: 'For-profit organizations' },
        { value: 'GOVERNMENT', name: 'Government', description: 'Government organizations' },
        { value: 'ACADEMIC', name: 'Academic', description: 'Academic institutions' },
        { value: 'INDIGENOUS', name: 'Indigenous', description: 'Indigenous organizations' },
        { value: 'COOPERATIVE', name: 'Cooperative', description: 'Cooperative organizations' },
        { value: 'OTHER', name: 'Other', description: 'Other types of organizations' }
      ]
    },
    {
      commonId: 'PROVINCES',
      name: 'Provinces',
      description: 'Canadian provinces and territories',
      values: [
        { value: 'AB', name: 'Alberta', description: 'Alberta' },
        { value: 'BC', name: 'British Columbia', description: 'British Columbia' },
        { value: 'MB', name: 'Manitoba', description: 'Manitoba' },
        { value: 'NB', name: 'New Brunswick', description: 'New Brunswick' },
        { value: 'NL', name: 'Newfoundland and Labrador', description: 'Newfoundland and Labrador' },
        { value: 'NS', name: 'Nova Scotia', description: 'Nova Scotia' },
        { value: 'ON', name: 'Ontario', description: 'Ontario' },
        { value: 'PE', name: 'Prince Edward Island', description: 'Prince Edward Island' },
        { value: 'QC', name: 'Quebec', description: 'Quebec' },
        { value: 'SK', name: 'Saskatchewan', description: 'Saskatchewan' },
        { value: 'NT', name: 'Northwest Territories', description: 'Northwest Territories' },
        { value: 'NU', name: 'Nunavut', description: 'Nunavut' },
        { value: 'YT', name: 'Yukon', description: 'Yukon' }
      ]
    },
    {
      commonId: 'COUNTRIES',
      name: 'Countries',
      description: 'Countries',
      values: [
        { value: 'CA', name: 'Canada', description: 'Canada' },
        { value: 'US', name: 'United States', description: 'United States' },
        { value: 'OTHER', name: 'Other', description: 'Other countries' }
      ]
    },
    {
      commonId: 'CURRENCIES',
      name: 'Currencies',
      description: 'Currency codes',
      values: [
        { value: 'CAD', name: 'Canadian Dollar', description: 'Canadian Dollar' },
        { value: 'USD', name: 'US Dollar', description: 'US Dollar' }
      ]
    },
    {
      commonId: 'LANGUAGES',
      name: 'Languages',
      description: 'Supported languages',
      values: [
        { value: 'ENGLISH', name: 'English', description: 'English language' },
        { value: 'FRENCH', name: 'French', description: 'French language' },
      ]
    },
     
  ];

  for (const metaDef of metadataDefinitions) {
    const existing = await Metadata.findOne({ commonId: metaDef.commonId });
    if (!existing) {
      await new Metadata(metaDef).save();
      logger.info(`Created metadata: ${metaDef.commonId}`);
    }
  }
}

async function initializeFiscalYears() {
  const fiscalYears = [];
  
  // Create fiscal years from 2020-2021 to 2030-2031
  for (let year = 2020; year <= 2030; year++) {
    const fiscalYear = `${year}-${year + 1}`;
    const startDate = new Date(year, 3, 1); // April 1
    const endDate = new Date(year + 1, 2, 31); // March 31
    
    fiscalYears.push({
      fiscalYear,
      startDate,
      endDate,
      description: `Alberta Fiscal Year ${fiscalYear}`
    });
  }

  for (const fy of fiscalYears) {
    const existing = await FiscalYear.findOne({ fiscalYear: fy.fiscalYear });
    if (!existing) {
      await new FiscalYear(fy).save();
      logger.info(`Created fiscal year: ${fy.fiscalYear}`);
    }
  }
}

async function initializeMinistries() {
const albertaMinistries = [
    { name: 'Advanced Education', shortName: 'AE', description: 'Advanced Education' },
    { name: 'Affordability and Utilities', shortName: 'AU', description: 'Affordability and Utilities' },
    { name: 'Agriculture and Irrigation', shortName: 'AI', description: 'Agriculture and Irrigation' },
    { name: 'Arts, Culture and Status of Women', shortName: 'ACSW', description: 'Arts, Culture and Status of Women' },
    { name: 'Assisted Living and Social Services', shortName: 'ALSS', description: 'Assisted Living and Social Services' },
    { name: 'Children and Family Services', shortName: 'CFS', description: 'Children and Family Services' },
    { name: 'Communications and Public Engagement', shortName: 'CPE', description: 'Communications and Public Engagement' },
    { name: 'Education and Childcare', shortName: 'EDC', description: 'Education and Childcare' },
    { name: 'Energy and Minerals', shortName: 'EM', description: 'Energy and Minerals' },
    { name: 'Environment and Protected Areas', shortName: 'EPA', description: 'Environment and Protected Areas' },
    { name: 'Executive Council', shortName: 'EC', description: 'Executive Council' },
    { name: 'Forestry and Parks', shortName: 'FP', description: 'Forestry and Parks' },
    { name: 'Hospital and Surgical Health Services', shortName: 'HSHS', description: 'Hospital and Surgical Health Services' },
    { name: 'Indigenous Relations', shortName: 'IR', description: 'Indigenous Relations' },
    { name: 'Infrastructure', shortName: 'INFRA', description: 'Infrastructure' },
    { name: 'Jobs, Economy, Trade, and Immigration', shortName: 'JETI', description: 'Jobs, Economy, Trade, and Immigration' },
    { name: 'Justice', shortName: 'JUS', description: 'Justice and Solicitor General' },
    { name: 'Mental Health and Addiction', shortName: 'MHA', description: 'Mental Health and Addiction' },
    { name: 'Municipal Affairs', shortName: 'MA', description: 'Municipal Affairs' },
    { name: 'Primary and Preventative Health Services', shortName: 'PPHS', description: 'Primary and Preventative Health Services' },
    { name: 'Public Safety and Emergency Services', shortName: 'PSES', description: 'Public Safety and Emergency Services' },
    { name: 'Public Service Commission', shortName: 'PSC', description: 'Public Service Commission' },
    { name: 'Service Alberta and Red Tape Reduction', shortName: 'SARTR', description: 'Service Alberta and Red Tape Reduction' },
    { name: 'Technology and Innovation', shortName: 'TI', description: 'Technology and Innovation' },
    { name: 'Tourism and Sport', shortName: 'TS', description: 'Tourism and Sport' },
    { name: 'Transportation and Economic Corridors', shortName: 'TEC', description: 'Transportation and Economic Corridors' },
    { name: 'Treasury Board and Finance', shortName: 'TBF', description: 'Treasury Board and Finance' }
  ];

  for (const ministry of albertaMinistries) {
    const existing = await Ministry.findOne({ shortName: ministry.shortName });
    if (!existing) {
      await new Ministry(ministry).save();
      logger.info(`Created ministry: ${ministry.name}`);
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Models
  Metadata,
  FiscalYear,
  Ministry,
  
  // Enum System
  EnumCache,
  enumCache,
  createEnumValidator,
  
  // CRUD Operations
  MetadataCRUD,
  
  // Initialization
  initializeSystem,
  
  // Utility functions
  generateUniqueId,
  validatePostalCode,
  validatePhoneNumber
};

