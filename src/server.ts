import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from './utils/generate-slug';

const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const prisma = new PrismaClient({
	log: ['query'],
});

app.get('/', async (request, reply) => {
	return { hello: 'world' };
});

app.withTypeProvider<ZodTypeProvider>().post(
	'/events',
	{
		schema: {
			body: z.object({
				title: z.string().min(6),
				details: z.string().nullable(),
				maximumAttendees: z.number().int().positive().nullable(),
			}),
			response: {
				201: z.object({
					eventId: z.string(),
				}),
				409: z.object({
					error: z.string(),
				}),
			},
		},
	},

	async (request, reply) => {
		const { title, details, maximumAttendees } = request.body;

		const slug = generateSlug(title);

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
				title,
				details,
				maximumAttendees,
				slug,
			},
		});

		return reply.status(201).send({ eventId: event.id });
	}
);

app.listen({ port: 3333 }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	app.log.info(`Server listening at ${address}`);
});
