import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { generateSlug } from '../utils/generate-slug';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function checkIn(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		'/attendees/:attendeeId/check-in',
		{
			schema: {
				summary: 'Check-in an attendee',
        tags: ['check-ins'],
				params: z.object({
					attendeeId: z.coerce.number().int(),
				}),
				response: {
					201: z.null(),
					404: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { attendeeId } = request.params;

			const attendeeCheckIn = await prisma.checkIn.findUnique({
				where: {
					attendeeId,
				},
			});

			const attendee = await prisma.attendee.findUnique({
				where: {
					id: attendeeId,
				},
			});

			if (attendeeCheckIn !== null) {
				reply.status(400).send({
					message: 'Attendee already checked in',
				});
				return;
			}

			if (!attendee) {
				reply.status(404).send({
					message: 'Attendee not found',
				});
				return;
			}

			await prisma.checkIn.create({
				data: {
					attendeeId,
				},
			});

			return reply.status(201).send();
		}
	);
}
