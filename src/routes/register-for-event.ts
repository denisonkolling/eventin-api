import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function registerForEvent(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		'/events/:eventId/attendees',
		{
			schema: {
				summary: 'Register an attendee',
        tags: ['attendees'],
				body: z.object({
					name: z.string().min(6),
					email: z.string().email(),
				}),
				params: z.object({
					eventId: z.string().uuid(),
				}),
				response: {
					201: z.object({
						attendeeId: z.number(),
					}),
					409: z.object({
						message: z.string(),
					}),
				},
			},
		},

		async (request, reply) => {
			const { eventId } = request.params;
			const { name, email } = request.body;

			const [event, amountOfAttendees] = await Promise.all([
				prisma.event.findUnique({
					where: {
						id: eventId,
					},
				}),

				prisma.attendee.count({
					where: {
						eventId,
					},
				}),
			]);

			if (event?.maximumAttendees && amountOfAttendees >= event.maximumAttendees) {
				reply.status(409).send({
					message: 'Event is full',
				});
				return;
			}

			const attendeeFromEmail = await prisma.attendee.findUnique({
				where: {
					eventId_email: {
						eventId,
						email,
					},
				},
			});

			if (attendeeFromEmail) {
				reply.status(409).send({
					message: 'Attendee with this email already registered for this event',
				});
				return;
			}

			const attendee = await prisma.attendee.create({
				data: {
					name,
					email,
					eventId,
				},
			});

			reply.status(201).send({ attendeeId: attendee.id });
		}
	);
}
