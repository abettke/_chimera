import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import path from 'path';
import orm from './orm';
import smtp from './smtp';
import context from './httpContext';
import auth from './auth';
import api from './api';

const app = express();

/** Register Middleware */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(context.initialize());

/** Register API Routes */
app.use('/api', [
	auth,
	api
]);

/** HealthCheck API */
app.use('/status', (req, res) => {
	if (req.xhr) {
		return res.json({ status: 'OK' });
	}

	res.sendStatus(200);
});

/** Serves static files from 'public' */
app.use('/public', express.static('public'));
app.use('/auth', (req, res) => res.sendFile(path.resolve('./public/auth.html')));

app.init = async function () {
	await orm.init();

	app.orm = orm;
	app.smtp = smtp;
};

export default app;
