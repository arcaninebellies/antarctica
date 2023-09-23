import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { PusherServer } from "@/pusher";
import prisma from "@/prisma";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await getServerSession(OPTIONS);
  const email = session!.user!.email!;
  const schema = z.object({
    directId: z.string(),
    message: z.string(),
  });
  const response = schema.safeParse(await request.json());
  if (!response.success) {
    return NextResponse.json({ error: true });
  }
  const { directId, message: newMessage } = response.data;

  const user = await prisma.user.findFirst({
    where: { email },
  });

  const direct = await prisma.direct.findFirst({
    where: {
      id: parseInt(directId),
      members: {
        some: {
          email,
        },
      },
    },
    include: {
      messages: true,
    },
  });
  if (direct && user) {
    const message = await prisma.directMessage.create({
      data: {
        content: newMessage,
        direct: {
          connect: {
            id: direct.id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        user: true,
      },
    });

    await prisma.direct.update({
      where: {
        id: direct.id,
      },
      data: {
        messages: {
          set: [...direct.messages.concat([message])],
        },
      },
    });

    const direct_ = await prisma.direct.findFirst({
      where: { id: direct.id },
      include: {
        members: true,
      },
    });

    if (direct_) {
      // I know this is hacky, but I find it easier to just send the entire User
      direct_.members.forEach(async (member) => {
        const user = await prisma.user.findFirst({
          where: {
            username: member.username,
          },
          include: {
            directs: {
              include: {
                members: true,
                messages: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        });
        await PusherServer.trigger(
          `directs-${member.username}`,
          "new message",
          {
            user,
          },
        );
      });
    }
    return NextResponse.json({ ok: "ok" });
  } else {
    return NextResponse.json({ error: true });
  }
}
