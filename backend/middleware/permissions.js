// permissions.js remains the same as previous, but for completeness
/**
 * Permissions Definition using CASL
 * Defines abilities based on user roles for the application.
 */

const { AbilityBuilder, Ability } = require('@casl/ability');

function defineAbilityFor(user) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (!user) {
    // Public (unauthenticated)
    can('read', ['Metadata', 'FiscalYear', 'Ministry', 'Department', 'Branch']);
    return build();
  }

  // Handle multiple roles additively
  for (const role of user.roles || []) {
    switch (role.toUpperCase()) {
      case 'APPLICANT':
        can('create', 'Organization', { createdBy: user._id });
        can('read', 'Organization', { createdBy: user._id });
        can('update', 'Organization', { createdBy: user._id });
        can('delete', 'Organization', { createdBy: user._id });
        can('create', 'Contact', { organization: user.organizationId });
        can('read', 'Contact', { organization: user.organizationId });
        can('update', 'Contact', { organization: user.organizationId });
        can('delete', 'Contact', { organization: user.organizationId });
        can('create', 'Role', { createdBy: user._id });
        can('read', 'Role', { createdBy: user._id });
        can('update', 'Role', { createdBy: user._id });
        can('delete', 'Role', { createdBy: user._id });
        can('create', 'GrantApplication', { applicantOrganization: user.organizationId });
        can('read', 'GrantApplication', { applicantOrganization: user.organizationId });
        can('update', 'GrantApplication', { applicantOrganization: user.organizationId });
        can('create', 'GrantReport', { submittedBy: user.organizationId });
        can('read', 'GrantReport', { submittedBy: user.organizationId });
        can('update', 'GrantReport', { submittedBy: user.organizationId });
        can('update', 'User', { _id: user._id });
        break;
      case 'INTERNAL':
        can('read', ['Organization', 'Contact', 'Role', 'GrantProgram', 'GrantApplication', 'GrantAward', 'GrantPayment', 'GrantReport', 'ApplicationReview', 'ReviewCommittee', 'AuditTrail', 'PublicDisclosure', 'User'], { ministryId: user.ministryId });
        can('update', ['Organization', 'Contact', 'GrantProgram', 'GrantApplication', 'GrantAward', 'GrantPayment', 'GrantReport', 'ApplicationReview', 'ReviewCommittee', 'PublicDisclosure'], { ministryId: user.ministryId });
        can('delete', ['Organization', 'Contact', 'GrantProgram', 'GrantApplication', 'GrantAward', 'GrantPayment', 'GrantReport', 'ApplicationReview', 'ReviewCommittee', 'PublicDisclosure'], { ministryId: user.ministryId });
        can('create', ['GrantProgram', 'GrantAward', 'GrantPayment', 'ApplicationReview', 'ReviewCommittee', 'PublicDisclosure']);
        can('approve', ['GrantApplication', 'GrantPayment'], { ministryId: user.ministryId });
        break;
      case 'ADVANCED':
        can('create', ['Metadata', 'FiscalYear', 'Department', 'Branch']);
        can('update', ['Metadata', 'FiscalYear', 'Department', 'Branch']);
        can('delete', ['Metadata', 'FiscalYear', 'Department', 'Branch']);
        break;
      case 'ADMINISTRATOR':
        can('create', ['Ministry', 'User', 'Role']);
        can('read', ['Ministry', 'User', 'Role']);
        can('update', ['Ministry', 'User', 'Role']);
        can('delete', ['Ministry', 'User', 'Role']);
        break;
      case 'SUPER_ADMIN':
        can('manage', 'all');
        break;
    }
  }

  // Global rules
  cannot('delete', 'User', { roles: { $in: ['SUPER_ADMIN'] } });

  return build();
}

module.exports = {
  defineAbilityFor
};