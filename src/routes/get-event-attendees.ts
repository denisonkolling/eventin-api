import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function getEventAttendees(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/events/:eventId/attendees',
		{
			schema: {
				summary: 'Get event attendees',
        tags: ['events'],
				params: z.object({
					eventId: z.string().uuid(),
				}),
				querystring: z.object({
					query: z.string().nullish(),
					pageIndex: z.string().nullish().default('0').transform(Number),
				}),
				response: {
					200: z.object({
						id: z.string().uuid(),
						title: z.string(),
						attendees: z.array(
							z.object({
								id: z.number(),
								name: z.string(),
								email: z.string().email(),
								createdAt: z.date(),
								checkIn: z.date().nullable(),
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
			const { pageIndex, query } = request.query;

			const attendees = await prisma.attendee.findMany({
				select: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
					checkIn: {
						select: {
							createdAt: true,
						},
					},
				},
				where: query ? { eventId, name: { contains: query } } : { eventId },
				take: 10,
				skip: pageIndex * 10,
				orderBy: {
					createdAt: 'desc',
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
					id: attendee.id,
					name: attendee.name,
					email: attendee.email,
					createdAt: attendee.createdAt,
					checkIn: attendee.checkIn?.createdAt ?? null,
				})),
			});
		}
	);
}
