import factory from 'factory-girl';
import orm from 'chimera/orm';

const model = orm.model('ChimeraField');

factory.define(model.modelName, model, {
	chimeraModelId: factory.assoc('ChimeraModel', '_id'),
	name: factory.chance('word', { length: 5 }),
	type: 'String'
});
