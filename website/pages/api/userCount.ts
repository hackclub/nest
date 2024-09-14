import { exec } from "child_process";
import { promisify } from "util";

import type { NextApiRequest, NextApiResponse } from "next";

const execAsync = promisify(exec);

type ResponseData = {
  count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const users = await execAsync("getent passwd | cut -d: -f1,3");
  const uids = users.stdout
    .split("\n")
    .map((u) => parseInt(u.split(":")[1]))
    .filter((n) => n >= 2000 && n < 3000);
  console.log(uids);
  res.status(200).json({ count: uids.length });
}
