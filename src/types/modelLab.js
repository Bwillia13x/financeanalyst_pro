// Model Lab Type Definitions and Contracts

/**
 * @typedef {Object} Field
 * @property {string} key - Field identifier
 * @property {string} label - Display label
 * @property {'number'|'percent'|'select'} kind - Input type
 * @property {number} [step] - Increment step for number inputs
 * @property {number} [min] - Minimum value
 * @property {number} [max] - Maximum value
 * @property {string[]} [options] - Options for select fields
 * @property {string} [suffix] - Display suffix (e.g., '$', '%')
 */

/**
 * @typedef {Object} TemplateDef
 * @property {'DCF'|'LBO'|'Comps'|'EPV'} kind - Template type
 * @property {string} title - Template title
 * @property {string} description - Template description
 * @property {string[]} tags - Template tags
 * @property {Field[]} schema - Field definitions
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} field - Field key with issue
 * @property {'error'|'warn'} level - Issue severity
 * @property {string} message - Human-readable message
 */

/**
 * @typedef {Object} ModelOutputs
 * @property {number} [ev] - Enterprise Value
 * @property {number} [perShare] - Per-share value
 * @property {number} [irr] - Internal Rate of Return (LBO)
 * @property {string[]} [warnings] - Calculation warnings
 */

/**
 * @typedef {Object} Model
 * @property {string} id - Unique identifier
 * @property {string} name - Model name
 * @property {'DCF'|'LBO'|'Comps'|'EPV'} kind - Model type
 * @property {string[]} tags - Model tags
 * @property {string} version - Semantic version (vX.Y)
 * @property {string} created - ISO timestamp
 * @property {string} updated - ISO timestamp
 * @property {string} currency - Currency code (USD, EUR, etc.)
 * @property {Record<string, any>} assumptions - Input assumptions
 * @property {ModelOutputs} [outputs] - Calculated outputs
 * @property {boolean} [selected] - Selected for comparison
 * @property {string} [peerSetId] - Associated peer set ID
 * @property {string} [owner] - Owner ID (for API mode)
 * @property {string} [createdBy] - Creator ID
 * @property {string} [updatedBy] - Last updater ID
 */

/**
 * @typedef {Object} CalculatorResult
 * @property {number} [ev] - Enterprise Value
 * @property {number} [perShare] - Per-share value
 * @property {number} [irr] - Internal Rate of Return
 * @property {string[]} [warnings] - Calculation warnings
 */

/**
 * @typedef {Object} CalculatorPlugin
 * @property {'DCF'|'LBO'|'Comps'|'EPV'} kind - Calculator type
 * @property {function(Record<string, any>, any=): CalculatorResult} compute - Main calculation function
 * @property {function(Record<string, any>): ValidationIssue[]} [validate] - Validation function
 */

/**
 * @typedef {Object} ModelStore
 * @property {function(): Model[]} list - List all models
 * @property {function(string): Model|undefined} get - Get model by ID
 * @property {function(Model): void} save - Save model
 * @property {function(string): void} delete - Delete model by ID
 * @property {function(string[]=): Blob} export - Export models to JSON
 * @property {function(unknown): Model[]} import - Import models from JSON
 */

/**
 * @typedef {Object} ModelHistory
 * @property {string} id - History entry ID
 * @property {string} modelId - Associated model ID
 * @property {string} version - Model version at this point
 * @property {Record<string, any>} assumptions - Assumptions snapshot
 * @property {string} timestamp - ISO timestamp
 * @property {string} [changeReason] - Reason for change
 */

// Export for JSDoc usage
export const Types = {};
