import camelCase from 'lodash/camelCase';
import mongoose from 'mongoose';
import registry from './index';

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
	 * * Enables timestamps by default. This can be disabled through the options argument.
     * * Adds association support between collections.
     * @param {string} name - The name to associate with the schema.
     * @param {object} fields - A mongoose schema fields definition object.
     * @param {object} options - A mongoose schema options object.
     */
	constructor (name, fields, options = {}) {
		if (!name) {
			throw new ChimeraSchemaError(`Missing required parameter 'name'`);
		}

		options = {
			timestamps: true,
			...options
		};

		super(fields, options);

		this.name = name;
	}

	/**
     * Creates a foreign key association, treating this as the dependent schema of the relationship.
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

		const localField = options.localField || `${options.as || camelCase(modelName)}Id`;
		if (!this.path(localField)) {
			this.add({
				[localField]: {
					...schemaOptions,
					type: mongoose.Schema.Types.ObjectId,
					ref
				}
			});
		} else {
			console.warn(`Unable to register new association path as it already exists: ${this.name}.${localField}`);
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
     * @param {string} [options.localField] - The name of the field in this schema that holds the foreign key reference.
     * @param {string} options.foreignField - The name of the field on the associated schema that matches the foreign key reference.
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
     * @param {string} [options.localField] - The name of the field in this schema that holds the foreign key reference.
     * @param {string} options.foreignField - The name of the field on the associated schema that matches the foreign key reference.
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

	/**
	 * Applies the given associations according to their type. This method mutates the schema by internally calling
	 * belongsTo, hasMany, hasOne, or belongsToMany to accurately reflect the supplied ChimeraAssociation objects.
	 * @param {[ChimeraAssociations]} associations - The ChimeraAssociations to apply to this schema. (from/to must be pre-populated!).
	 * @param {ChimeraModel} associations[].from - The ChimeraModel designated in the 'fromModelId' of the association.
	 * @param {ChimeraModel} associations[].to - The ChimeraModel designated in the 'toModelId' of the association.
	 */
	associate (associations) {
		const isDominant = assoc => assoc.from.namespace === this.name;

		associations.forEach(assoc => {
			switch (assoc.type) {
				case 'HierarchicalAssociation':
					isDominant(assoc)
						? this[assoc.many ? 'hasMany' : 'hasOne'](assoc.to.namespace, {
							foreignField: assoc.toModel.foreignKey || `${camelCase(this.name)}Id`,
							localField: assoc.fromModel.primaryKey,
							as: assoc.fromModel.reverseName
						})
						: this.belongsTo(assoc.from.namespace, {
							localField: assoc.toModel.foreignKey,
							foreignField: assoc.fromModel.primaryKey,
							as: assoc.toModel.relatedName
						});
					break;

				case 'NonHierarchicalAssociation':
					const through = this._buildJunction(assoc);

					isDominant(assoc)
						? this.belongsToMany(assoc.to.namespace, {
							localField: assoc.fromModel.primaryKey,
							foreignField: assoc.fromModel.foreignKey,
							as: assoc.fromModel.reverseName,
							through: through.name
						})
						: this.belongsToMany(assoc.from.namespace, {
							localField: assoc.toModel.primaryKey,
							foreignField: assoc.toModel.foreignKey,
							as: assoc.toModel.reverseName,
							through: through.name
						});

					break;

				default:
					throw new ChimeraSchemaError(`Cannot apply ChimeraAssociation of type '${assoc.type}'`);
			}
		});

	}

	/**
	 * Handles configuring a through model for use with non-hierarchical associations
	 * @param {object} assoc - The non-hierarchical association
	 * @returns {object} - The configured through model schema
	 */
	_buildJunction (assoc) {
		let junction;

		// Use an implicit through model
		if (!assoc.through) {
			const implicitName = `${assoc.from.namespace}_${assoc.to.namespace}`;

			if (registry.isRegistered(implicitName)) {
				junction = registry[implicitName].schema;
			} else {
				junction = registry._register(implicitName, new ChimeraSchema(implicitName)).schema;
			}

		// Use an explicit through model
		} else {
			junction = registry[assoc.through.namespace].schema;
		}

		junction.belongsTo(assoc.from.namespace, {
			localField: assoc.fromModel.foreignKey,
			foreignField: assoc.fromModel.primaryKey,
			as: assoc.fromModel.relatedName
		});

		junction.belongsTo(assoc.to.namespace, {
			localField: assoc.toModel.foreignKey,
			foreignField: assoc.toModel.primaryKey,
			as: assoc.toModel.relatedName
		});

		return junction;
	};
}

export default ChimeraSchema;
