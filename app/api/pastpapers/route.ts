import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subject = url.searchParams.get('subject');

    const whereClause: any = {};
    if (subject && subject !== 'All') {
      whereClause.subject = subject;
    }

    const pastPapers = await prisma.pastPaper.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(pastPapers);
  } catch (error) {
    console.error('Failed to fetch past papers:', error);
    return NextResponse.json({ error: 'Failed to fetch past papers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const { title, subject, fileUrl } = body;

    if (!title || !subject || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pastPaper = await prisma.pastPaper.create({
      data: {
        title,
        subject,
        fileUrl,
        uploaderId: payload.userId,
        isPlaceholder: false,
      },
      include: {
        uploader: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(pastPaper, { status: 201 });
  } catch (error) {
    console.error('Failed to create past paper:', error);
    return NextResponse.json({ error: 'Failed to create past paper' }, { status: 500 });
  }
}
