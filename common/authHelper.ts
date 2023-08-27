import { PrismaClient } from "@prisma/client";
import {
  GetServerSideProps,
  GetServerSidePropsResult,
  PreviewData,
} from "next";
import { getServerSession } from "next-auth";
import { ParsedUrlQuery } from "querystring";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export enum Role {
  EventEditor = "EVENT_EDITOR",
  InfosScreenEditor = "INFO_SCREEN_EDITOR",
  GlobalAdmin = "GLOBAL_ADMIN",
}

export type Requirements = {
  role?: Role;
  roles?: Role[];
  custom?: () => Promise<boolean>;
};

const prisma = new PrismaClient();

export const hasRole = (
  userRoles: string[],
  requiredRoles: Role | Role[],
): boolean => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.some((role) => userRoles.includes(role));
};

export const getGetServerSidePropsLoginRedirect = (
  redirectUrl: string,
): GetServerSidePropsResult<never> => ({
  redirect: {
    destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
      redirectUrl,
    )}`,
    permanent: false,
  },
});

export const getServerSidePropsWithAuth = <
  Props extends { [key: string]: any } = { [key: string]: any },
  Params extends ParsedUrlQuery = ParsedUrlQuery,
  Preview extends PreviewData = PreviewData,
>(
  requirements: Requirements,
  getServerSideProps: GetServerSideProps<Props, Params, Preview>,
): GetServerSideProps<Props, Params, Preview> => {
  return async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );

    const userId = Number.parseInt(session?.token.sub || "");

    if (!userId) return getGetServerSidePropsLoginRedirect(context.resolvedUrl);

    let hasRoles = true;

    if (requirements.role || requirements.roles) {
      const requiredRoles = [Role.GlobalAdmin];
      if (requirements.role) requiredRoles.push(requirements.role);
      if (requirements.roles) requiredRoles.push(...requirements.roles);

      const userRoles = (
        await prisma.adminUserRoles.findMany({
          select: {
            role: true,
          },
          where: {
            userId,
          },
        })
      ).map(({ role }) => role);

      hasRoles = hasRole(userRoles, requiredRoles);
    }

    if (!hasRoles || (requirements.custom && !(await requirements.custom())))
      return {
        notFound: true,
      };

    return getServerSideProps(context);
  };
};
