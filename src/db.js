import 'env';
import mongoose from 'mongoose';

mongoose.connect(
	'mongodb://' +
    `${process.env.NODE_ENV !== 'test' ? process.env.CHIMERADB_USERNAME + ':' : ''}` +
    `${process.env.NODE_ENV !== 'test' ? process.env.CHIMERADB_PASSWORD + '@' : ''}` +
    `${process.env.CHIMERADB_HOST}:` +
    `${process.env.CHIMERADB_PORT}/` +
    `${process.env.CHIMERADB_NAME}`, {
		useNewUrlParser: true
	}).catch(console.error);

export default mongoose.connection;
