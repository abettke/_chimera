import { Record } from 'js-data';
import schema from './schema';
import relations from './relations';
import ChimeraSchema from '../Schema';

class ChimeraModel extends Record {};

export default {
	collection: 'ChimeraModel',
	recordClass: ChimeraModel,
	schema: new ChimeraSchema(schema),
	relations
};
