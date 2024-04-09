import fastify from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from './utils/generate-slug';

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

	const slug = generateSlug(data.title);

	const eventWithSlug = await prisma.event.findUnique({
		where: { slug },
	});

	if (eventWithSlug) {
		return reply.status(409).send({
			error: 'Event with this title already exists',
		});
	}

	const event = await prisma.event.create({
		data: {
			title: data.title,
			details: data.details,
			maximumAttendees: data.maximumAttendees,
			slug: slug,
		},
	});

	return reply.status(201).send({ eventId: event.id });
});

app.listen({ port: 3333 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	app.log.info(`Server listening at ${address}`);
});
