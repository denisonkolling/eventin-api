import fastify from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const app = fastify({ logger: true });

const prisma = new PrismaClient({
	log: ['query'],
});

app.get('/', async (request, reply) => {
	return { hello: 'world' };
});

app.post('/events', async (request, reply) => {
	const createEventSchema = z.object({
		title: z.string().min(6),
		details: z.string().nullable(),
		maximumAttendees: z.number().int().positive().nullable(),
	});

	const data = createEventSchema.parse(request.body);

	const event = await prisma.event.create({
		data: {
			title: data.title,
			details: data.details,
			maximumAttendees: data.maximumAttendees,
			slug: data.title.toLowerCase().replace(/ /g, '-'),
		},
	});

	return { eventId: event.id };
});

app.listen({ port: 3333 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	app.log.info(`Server listening at ${address}`);
});
