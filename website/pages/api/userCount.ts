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
  // TODO: replace with actual data
  res.status(200).json({ count: 367 });
}
