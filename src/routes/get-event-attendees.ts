import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function getEventAttendees(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/events/:eventId/attendees',
		{
			schema: {
				params: z.object({
					eventId: z.string().uuid(),
				}),
				response: {
					200: z.object({
						id: z.string().uuid(),
						title: z.string(),
						attendees: z.array(
							z.object({
								name: z.string(),
								email: z.string().email(),
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
			const { eventId } = request.params;

			const attendees = await prisma.attendee.findMany({
				where: {
					eventId,
				},
			});

			const event = await prisma.event.findUnique({
				select: {
					id: true,
					title: true,
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
				attendees: attendees.map((attendee) => ({
					name: attendee.name,
					email: attendee.email,
				})),
			});
		}
	);
}
