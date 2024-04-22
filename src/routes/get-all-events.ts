import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';
import { generateSlug } from '../utils/generate-slug';

export async function getAllEvents(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/events',
		{
			schema: {
				summary: 'Get all events',
				tags: ['events'],
				response: {
					200: z.object({
						events: z.array(
							z.object({
								id: z.string().uuid(),
								title: z.string(),
								slug: z.string(),
								details: z.string().nullable().optional(),
								maximumAttendees: z.number().int().nullable().optional(),
								attendeesRegistred: z.number().int().nullable().optional(),
							})
						),
					}),
					404: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const events = await prisma.event.findMany({
				select: {
					id: true,
					title: true,
					slug: true,
					details: true,
					maximumAttendees: true,
					_count: {
						select: {
							attendees: true,
						},
					},
				},
			});

			if (!events) {
				reply.status(404).send({
					message: 'Events not found',
				});
				return;
			}

			reply.send({
				events: events.map((event) => ({
					id: event.id,
					title: event.title,
					slug: event.slug,
					details: event.details,
					maximumAttendees: event.maximumAttendees,
					attendeesRegistred: event._count.attendees,
				})),
			});
		}
	);
}
