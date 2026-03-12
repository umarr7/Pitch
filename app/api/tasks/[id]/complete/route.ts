import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { addPoints, addReputation, preventPointFarming, POINTS_CONFIG, REPUTATION_CONFIG } from '@/lib/points';
import { getIO } from '@/lib/socket';

export const POST = withAuth(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const userId = req.user!.userId;
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Task is not accepted' },
        { status: 400 }
      );
    }

    if (task.acceptorId !== userId && task.requesterId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const isRequester = task.requesterId === userId;
    const isAcceptor = task.acceptorId === userId;

    // Avoid duplicate confirmations
    if ((isRequester && task.requesterCompleted) || (isAcceptor && task.acceptorCompleted)) {
      return NextResponse.json(
        { error: 'You have already confirmed completion for this task.' },
        { status: 400 }
      );
    }

    const newRequesterCompleted = isRequester ? true : task.requesterCompleted;
    const newAcceptorCompleted = isAcceptor ? true : task.acceptorCompleted;

    // Only when both will be completed for the first time, run point-farming protection
    if (
      !task.requesterCompleted &&
      !task.acceptorCompleted &&
      newRequesterCompleted &&
      newAcceptorCompleted
    ) {
      const canComplete = await preventPointFarming(task.requesterId, task.acceptorId!);
      if (!canComplete) {
        return NextResponse.json(
          {
            error:
              'Too many tasks completed between same users recently. Please wait 24 hours.',
          },
          { status: 429 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      const shouldFinalize =
        task.status === 'ACCEPTED' &&
        newRequesterCompleted &&
        newAcceptorCompleted &&
        !task.completedAt;

      await tx.task.update({
        where: { id: params.id },
        data: {
          requesterCompleted: newRequesterCompleted,
          acceptorCompleted: newAcceptorCompleted,
          ...(shouldFinalize
            ? {
                status: 'COMPLETED',
                completedAt: new Date(),
              }
            : {}),
        },
      });

      if (shouldFinalize) {
        await addPoints(
          task.acceptorId!,
          task.rewardPoints,
          'TASK_COMPLETED',
          `Completed task: ${task.title}`,
          task.id,
          tx
        );

        await addReputation(
          task.acceptorId!,
          REPUTATION_CONFIG.FOR_TASK_COMPLETION,
          'TASK_COMPLETED',
          `Completed task: ${task.title}`,
          task.id,
          undefined,
          tx
        );

        // Notify both sides that completion is fully confirmed
        await tx.message.createMany({
          data: [
            {
              taskId: task.id,
              senderId: task.acceptorId!,
              receiverId: task.requesterId,
              content:
                '✅ Task completion confirmed by both sides. Points and reputation have been updated.',
            },
            {
              taskId: task.id,
              senderId: task.requesterId,
              receiverId: task.acceptorId!,
              content:
                '✅ Task completion confirmed by both sides. Points and reputation have been updated.',
            },
          ],
        });
      } else {
        // One party has confirmed, prompt the other
        if (isAcceptor) {
          await tx.message.create({
            data: {
              taskId: task.id,
              senderId: task.acceptorId!,
              receiverId: task.requesterId,
              content:
                '✅ I have marked this task as completed. Please confirm completion so points can be transferred.',
            },
          });
        } else if (isRequester) {
          await tx.message.create({
            data: {
              taskId: task.id,
              senderId: task.requesterId,
              receiverId: task.acceptorId!,
              content:
                '✅ I have confirmed this task as completed. Your points will be added once both sides have confirmed.',
            },
          });
        }
      }
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        acceptor: {
          include: {
            profile: true,
          },
        },
        department: true,
      },
    });

    if (updatedTask?.status === 'COMPLETED') {
      const io = getIO();
      if (io) {
        io.to(`task:${updatedTask.id}`).emit('task-completed', updatedTask);
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete task' },
      { status: 500 }
    );
  }
});
