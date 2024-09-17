import express from "express";
import Identd from "identd";
import validator from "validator";

import { prisma } from "./prisma";
import {
  domainExists,
  checkWhitelist,
  reloadCaddy,
  checkVerification,
  domainOwnership,
} from "./utils";

import type { Response } from "identd";

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  let ident: Response;

  try {
    ident = await Identd.request({
      address: "localhost",
      server_port: Number(process.env.PORT),
      client_port: req.socket.remotePort!,
    });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
    return;
  }

  req.username = ident.userid?.toString();
  req.admin = req.username === "root" || req.username === "nest-internal";
  next();
});

app.get("/list", async (req, res) => {
  const domains = await prisma.domain.findMany({
    where: {
      username: req.username,
    },
  });

  res.json(domains);
});

app.post("/domain/new", async (req, res) => {
  let user = req.username;

  if (req.body.impersonateUser && !req.admin) {
    res.sendStatus(403);
  } else if (req.body.impersonateUser) {
    user = req.body.impersonateUser;
  }

  if (!validator.isFQDN(req.body.domain)) {
    return res.sendStatus(400);
  }

  if (await domainExists(req.body.domain)) {
    return res.sendStatus(409);
  }

  if (checkWhitelist(req.body.domain, user)) {
    await prisma.domain.create({
      data: {
        domain: req.body.domain,
        username: user,
        proxy:
          req.body.proxy ||
          `unix//home/${user}/.${req.body.domain}.webserver.sock`,
      },
    });
    await reloadCaddy();
    return res.sendStatus(200);
  }

  // Proceed as a regular domain
  if (!(await checkVerification(req.body.domain, user))) {
    console.error(
      `Please set the TXT record for domain-verification to your username (${user}). You can remove it after it is added.`,
    );
    process.exit(1);
  }

  await prisma.domain.create({
    data: {
      domain: req.body.domain,
      username: user,
      proxy:
        req.body.proxy ||
        `unix//home/${user}/.${req.body.domain}.webserver.sock`,
    },
  });
  await reloadCaddy();
  return res.sendStatus(200);
});

app.post("/domain/delete", async (req, res) => {
  let user = req.username;

  if (req.body.impersonateUser && !req.admin) {
    res.sendStatus(403);
  } else if (req.body.impersonateUser) {
    user = req.body.impersonateUser;
  }

  if (!validator.isFQDN(req.body.domain)) {
    return res.sendStatus(400);
  }

  if (await domainExists(req.body.domain)) {
    return res.sendStatus(409);
  }

  if (!(await domainOwnership(req.body.domain, user))) {
    console.error("You do not own the domain, so you cannot remove it.");
    process.exit(1);
  }
  await prisma.domain.delete({
    where: {
      domain: req.body.domain,
      username: user,
    },
  });
  await reloadCaddy();

  return res.sendStatus(200);
});

app.post("/reload", async (req, res) => {
  if (!req.admin) {
    return res.sendStatus(403);
  }

  await reloadCaddy();

  return res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log(`Cabinet is listening on ${process.env.PORT}`);
});
