import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function getAttendeeBadge(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/attendees/:attendeeId/badge',
		{
			schema: {
				summary: 'Get an attendee badge',
        tags: ['attendees'],
				params: z.object({
					attendeeId: z.coerce.number().int(),
				}),
				response: {
					200: z.object({
							badge: z.object({
								name: z.string(),
								email: z.string().email(),
								eventTitle: z.string(),
								checkInURL: z.string().url(),
							}),
						})
						.passthrough(),
					404: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { attendeeId } = request.params;

			const attendee = await prisma.attendee.findUnique({
				select: {
					name: true,
					email: true,
					event: {
						select: {
							title: true,
						},
					},
				},
				where: {
					id: attendeeId,
				},
			});

			if (!attendee) {
				reply.status(404).send({
					message: 'Attendee not found',
				});
				return;
			}

			const baseURL = `${request.protocol}://${request.hostname}`;

			const checkInURL = new URL(`/attendees/${attendeeId}/check-in`, baseURL);

			return {
				badge: {
					name: attendee.name,
					email: attendee.email,
					eventTitle: attendee.event.title,
					checkInURL: checkInURL.toString(),
				},
			};
		}
	);
}
