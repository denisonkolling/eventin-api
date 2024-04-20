import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';
import { generateSlug } from '../utils/generate-slug';

export async function getEvent(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/events/:eventId',
		{
			schema: {
				params: z.object({
					eventId: z.string().uuid(),
				}),
				response: {
					200: z.object({
						id: z.string().uuid(),
						title: z.string(),
						slug: z.string(),
						details: z.string().nullable().optional(),	
						maximumAttendees: z.number().int().nullable().optional(),
						attendeesRegistred: z.number().int().nullable().optional(),
					}),
					404: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { eventId } = request.params;

			const event = await prisma.event.findUnique({
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
				where: {
					id: eventId,
				},
			});

			if (!event) {
				reply.status(404).send({
					message: 'Event not found',
				});
				return;
			}

			reply.send({
				id: event.id,
				title: event.title,
				slug: event.slug,
				details: event.details,
				maximumAttendees: event.maximumAttendees,
				attendeesRegistred: event._count.attendees,
			});
		}
	);
}
