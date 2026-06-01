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
  try {
    const result = await fetch("https://dashboard.hackclub.app/api/stats");

    if (!result.ok) {
      return res.status(200).json({ count: 477 }); // user count when i made this code
    }

    const data = await result.json();

    return res.status(200).json({ count: data.users });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return res.status(200).json({ count: 477 });
  }
}
