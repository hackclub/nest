// @ts-expect-error
import getent from "@opendrives/getent";

import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const users = getent.passwd();

  const nestUsers = users.filter((u: any) => u.uid >= 2000 && u.uid < 3000);

  res.status(200).json({ count: nestUsers.length });
}
