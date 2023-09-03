import { getServerSession } from "next-auth/next";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { PusherServer } from "@/pusher";
import prisma from "@/prisma";
import upload from "@/upload";
import redis from "@/redis";

export async function GET(request: Request, response: Response) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const cache = await redis.get(`post-${id}`);
  if (cache) {
    return NextResponse.json({ post: JSON.parse(cache) });
  } else {
    const post = await prisma.post.findFirst({
      where: { id: parseInt(id!) },
      include: {
        author: true,
        likes: true,
        reply: {
          include: {
            author: true,
          },
        },
        replies: {
          include: {
            author: true,
            likes: true,
            reposts: true,
            reply: {
              include: {
                author: true,
              },
            },
          },
        },
        reposts: true,
      },
    });
    redis.set(`post-${id}`, JSON.stringify(post));
    return NextResponse.json({ post });
  }
}

export async function POST(request: Request, response: Response) {
  const session = await getServerSession(OPTIONS);
  if (session) {
    const email = session.user?.email;
    const data = await request.formData();
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        followers: {
          include: {
            follower: true,
          },
        },
      },
    });
    if (user) {
      let post;
      if (data.get("image")) {
        const image = data.get("image");
        const arrayBuffer = await (image as Blob).arrayBuffer();
        const result = (await upload(arrayBuffer, "uploads")) as string;
        if (data.get("reply")) {
          const postToConnectTo = await prisma.post.findFirst({
            where: {
              id: parseInt(data.get("reply") as string),
            },
          });
          post = await prisma.post.create({
            data: {
              content: data.get("post") as string,
              image: result,
              author: {
                connect: {
                  id: user.id,
                },
              },
              reply: {
                connect: {
                  id: postToConnectTo.id,
                },
              },
            },
          });
        } else {
          post = await prisma.post.create({
            data: {
              content: data.get("post") as string,
              image: result,
              author: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
        }
      } else {
        if (data.get("reply")) {
          const postToConnectTo = await prisma.post.findFirst({
            where: {
              id: parseInt(data.get("reply") as string),
            },
          });
          post = await prisma.post.create({
            data: {
              content: data.get("post") as string,
              author: {
                connect: {
                  id: user.id,
                },
              },
              reply: {
                connect: {
                  id: postToConnectTo.id,
                },
              },
            },
          });
        } else {
          post = await prisma.post.create({
            data: {
              content: data.get("post") as string,
              author: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
        }
      }
      const post_ = await prisma.post.findFirst({
        where: {
          id: post.id,
        },
        include: {
          author: true,
          likes: true,
          reposts: true,
          replies: true,
        },
      });
      PusherServer.trigger(`profile-${user.username}`, "new message", {
        post: post_,
      });
      user.followers.forEach((follower) => {
        const email_ = follower.follower.email;
        PusherServer.trigger(`dashboard-${email_}`, "new message", {
          post: post_,
        });
      });
      // send to self
      PusherServer.trigger(`dashboard-${user.email}`, "new message", {
        post: post_,
      });
      return NextResponse.json({ post });
    } else {
      return NextResponse.json({ error: "error" });
    }
  } else {
    return NextResponse.json({ error: "error" });
  }
}

export async function DELETE(request: Request, response: Response) {
  const session = await getServerSession(OPTIONS);
  const data = await request.json();
  if (session) {
    const email = session.user?.email;
    if (email) {
      const post = await prisma.post.findFirst({
        where: {
          author: {
            email: email,
          },
          id: data.id,
        },
        include: {
          author: {
            include: {
              followers: {
                include: {
                  follower: true,
                },
              },
            },
          },
        },
      });
      await prisma.post.delete({ where: { id: post.id } });
      await redis.del(`post-${post.id}`);
      PusherServer.trigger(
        `profile-${post.author.username}`,
        "delete message",
        {
          post: post,
        },
      );
      post.author.followers.forEach((follower) => {
        const email_ = follower.follower.email;
        PusherServer.trigger(`dashboard-${email_}`, "delete message", {
          post: post,
        });
      });
      // send to self
      PusherServer.trigger(`dashboard-${post.author.email}`, "delete message", {
        post: post,
      });
      return NextResponse.json({ post });
    }
  }
}
