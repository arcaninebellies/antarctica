import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/prisma";
import upload from "@/upload";
import { zfd } from "zod-form-data";
export async function GET(request: Request, response: Response) {
  const session = await getServerSession(OPTIONS);
  if (session) {
    const email = session.user?.email;
    if (email) {
      const user = await prisma.user.findFirst({
        where: { email },
        include: {
          posts: true,
          _count: { select: { notifications: { where: { read: false } } } },
        },
      });
      return NextResponse.json({ user });
    }
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(OPTIONS);
  if (session) {
    const email = session.user?.email;
    if (email) {
      const schema = zfd.formData({
        username: zfd.text(),
        description: zfd.text(),
        displayname: zfd.text(),
        avatar: zfd.text().optional(),
        banner: zfd.text().optional(),
      });
      const response = schema.safeParse(request.body);
      if (!response.success) {
        return NextResponse.json({ error: true });
      }
      const { username, description, displayname } = response.data;
      let dataToSave = {
        username,
        description,
        displayname,
      };
      if (response.data.avatar) {
        const { avatar } = response.data;

        const buffer = Buffer.from(
          avatar.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );
        const uuid = await upload(buffer, "avatars");

        (dataToSave as any).avatar = uuid;
      }
      if (response.data.banner) {
        const { banner } = response.data;
        const buffer = Buffer.from(
          banner.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );
        const uuid = await upload(buffer, "banners");

        (dataToSave as any).banner = uuid;
      }
      try {
        const user = await prisma.user.update({
          where: { email },
          data: { ...dataToSave },
        });
        return NextResponse.json({ user });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            return NextResponse.json({
              error: true,
              errorMessage: "username taken",
            });
          }
        }
      }
    }
  }
}
