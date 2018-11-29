import camelCase from 'lodash/camelCase';
import set from 'lodash/set';
import mongoose from 'mongoose';

class ChimeraSchemaError extends Error {
	constructor (message) {
		super(message);
		this.name = 'ChimeraSchemaError';
	}
};

class ChimeraSchema extends mongoose.Schema {
	/**
     * Enhances functionality of the base mongoose Schema class for use by Chimera.
     * * Add a naming identity at the schema level. This value will be used to name the mongoose model and mongodb collection.
     * * Adds association support between collections.
     * @param {string} name - The name to associate with the schema.
     * @param {object} fields - A mongoose schema fields definition object.
     * @param {object} options - A mongoose schema options object.
     */
	constructor (name, fields, options) {
		if (!name) {
			throw new ChimeraSchemaError(`Missing required parameter 'name'`);
		}

		set(options, 'collection', name);

		super(fields, options);

		this.name = name;
	}

	/**
     * Creates a foriegn key association, treating this as the dependent schema of the relationship.
     * @param {string} modelName - The name of the mongoose model to associate.
     * @param {object} [options] - Configuration options for the virtual field declaration.
     * @param {string} [options.localField] - The name of the field in this schema that holds the foreign key reference.
     * @param {string} [options.foreignField] - The name of the field on the associated schema that matches the foreign key reference.
     * @param {string} [options.as] - The name to use for the virtual field that describes the association.
     * @param {object} [schemaOptions] - Mongoose schema type options to pass to the localField declaration.
     * @returns {ChimeraSchema} - Mutates the schema by adding a virtual field to describe this association.
     */
	belongsTo (modelName, options = {}, schemaOptions = {}) {
		if (!modelName) {
			throw new ChimeraSchemaError(`Missing required parameter 'modelName'.`);
		}

		const ref = modelName;

		const localField = options.localField || `${camelCase(modelName)}Id`;
		if (!this.path(localField)) {
			this.add({
				[localField]: {
					...schemaOptions,
					type: mongoose.Schema.Types.ObjectId,
					ref
				}
			});
		}

		const associationName = options.as || camelCase(modelName);
		const association = {
			ref,
			localField,
			foreignField: options.foreignField || '_id',
			justOne: true
		};

		this.virtual(associationName, association);

		return this;
	}

	/**
     * Creates a one-to-many association, treating this as the independent schema of the relationship.
     * @param {string} modelName - The name of the mongoose model to associate.
     * @param {object} options - Configuration options for the virtual field declaration.
     * @param {string} options.localField - The name of the field in this schema that holds the foreign key reference.
     * @param {string} [options.foreignField] - The name of the field on the associated schema that matches the foreign key reference.
     * @param {string} [options.as] - The name to use for the virtual field that describes the association.
     * @returns {ChimeraSchema} - Mutates the schema by adding a virtual field to describe this association.
     */
	hasMany (modelName, options = {}) {
		if (!modelName) {
			throw new ChimeraSchemaError(`Missing required parameter 'modelName'.`);
		}

		if (!options.foreignField) {
			throw new ChimeraSchemaError(`Missing required option 'foreignField'.`);
		}

		const ref = modelName;
		const foreignField = options.foreignField;
		const localField = options.localField || '_id';

		const associationName = options.as || `${camelCase(modelName)}Set`;
		const association = {
			ref,
			localField,
			foreignField
		};

		this.virtual(associationName, association);

		return this;
	}

	/**
     * Creates a one-to-one association, treating this as the independent schema of the relationship.
     * To ensure the integrity of the association, a unique index should also be placed on the on the
     * dependent schema of the relationship to protect a one-to-many relationship from forming.
     * @param {string} modelName - The name of the mongoose model to associate.
     * @param {object} options - Configuration options for the virtual field declaration.
     * @param {string} options.localField - The name of the field in this schema that holds the foreign key reference.
     * @param {string} [options.foreignField] - The name of the field on the associated schema that matches the foreign key reference.
     * @param {string} [options.as] - The name to use for the virtual field that describes the association.
     * @returns {ChimeraSchema} - Mutates the schema by adding a virtual field to describe this association.
     */
	hasOne (modelName, options = {}) {
		if (!modelName) {
			throw new ChimeraSchemaError(`Missing required parameter 'modelName'.`);
		}

		if (!options.foreignField) {
			throw new ChimeraSchemaError(`Missing required option 'foreignField'.`);
		}

		const ref = modelName;
		const foreignField = options.foreignField;
		const localField = options.localField || `_id`;

		const associationName = options.as || `${camelCase(modelName)}`;
		const association = {
			ref,
			localField,
			foreignField,
			justOne: true
		};

		this.virtual(associationName, association);

		return this;
	}

	/**
     * Creates a many-to-many association, treating this as an independent schema of the relationship.
     * @param {string} modelName - The name of the mongoose model to associate.
     * @param {object} [options] - Configuration options for the virtual field declaration.
     * @param {string} [options.through] - The name of the model that will contain the association entries.
     * @param {string} [options.localField] - The name of the field in this schema that holds the foreign key reference.
     * @param {string} [options.foreignField] - The name of the field on the associated schema that matches the foreign key reference.
     * @param {string} [options.as] - The name to use for the virtual field that describes the association.
     * @returns {ChimeraSchema} - Mutates the schema by adding a virtual field to describe this association.
     */
	belongsToMany (modelName, options = {}) {
		if (!modelName) {
			throw new ChimeraSchemaError(`Missing required parameter 'modelName'.`);
		}

		const through = options.through || `${this.name}_${modelName}`;
		const localField = options.localField || `_id`;
		const foreignField = options.foreignField || `${camelCase(this.name)}Id`;

		const associationName = options.as || `${modelName}Set`;
		const association = {
			ref: through,
			localField,
			foreignField
		};

		this.virtual(associationName, association);

		return this;
	}
}

export default ChimeraSchema;
