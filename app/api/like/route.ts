import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { z } from "zod";

export async function GET(request: Request, response: Response) {
  const session = await getServerSession(OPTIONS);
  const { searchParams } = new URL(request.url);

  const postId = searchParams.get("post_id")!;
  const email = session!.user!.email!;
  const user = await prisma.user.findFirst({
    where: { email },
    include: { likes: true },
  });
  const post = await prisma.post.findFirst({
    where: { id: parseInt(postId) },
    include: { likes: true },
  });
  if (user && post) {
    const userLikeIds = user?.likes.map((like) => like.id);
    const postLikeIds = post.likes.map((like) => like.id);

    const includes = userLikeIds.filter((id) => postLikeIds.includes(id));
    if (includes.length > 0) {
      // like exists
      return NextResponse.json({ liked: true });
    } else {
      return NextResponse.json({ liked: false });
    }
  } else {
    return NextResponse.json({ liked: false });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(OPTIONS);
  const email = session!.user!.email!;
  const schema = z.object({
    id: z.number(),
  });
  const response = schema.safeParse(await request.json());
  if (!response.success) {
    return NextResponse.json({ error: "error" });
  }
  const { id } = response.data;
  const user = await prisma.user.findFirst({ where: { email } });
  const post = await prisma.post.findFirst({
    where: { id },
    include: { author: true },
  });

  if (user && post) {
    const like = await prisma.like.findFirst({
      where: { author: { id: user.id }, post: { id: post.id } },
    });

    if (like) {
      await prisma.like.delete({ where: { id: like.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          post: {
            connect: {
              id: post.id,
            },
          },
          author: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      await prisma.notification.create({
        data: {
          type: "LIKE",
          to: {
            connect: {
              id: post.author.id,
            },
          },
          from: {
            connect: {
              id: user.id,
            },
          },
          post: {
            connect: {
              id: post.id,
            },
          },
        },
      });
      return NextResponse.json({ liked: true });
    }
  } else {
    return NextResponse.json({ liked: false });
  }
}
