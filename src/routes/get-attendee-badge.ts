import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function getAttendeeBadge(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/attendees/:attendeeId/badge',
		{
			schema: {
				params: z.object({
					attendeeId: z.coerce.number().int(),
				}),
				response: {
					200: z.object({
						name: z.string(),
						email: z.string().email(),
						event: z.object({
							id: z.string().uuid(),
							title: z.string(),
							slug: z.string(),
						}),
					}),
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
							id: true,
							title: true,
							slug: true,
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

			reply.send(attendee);
		}
	);
}
