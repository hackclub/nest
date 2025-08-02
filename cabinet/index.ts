// run as root!!

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
import { stripIndent } from "common-tags";

import type { Response } from "identd";

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  let ident: Response;

  try {
    ident = await Identd.request({
      address: "localhost",
      client_port: Number(process.env.PORT),
      server_port: req.socket.remotePort!,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Authentication failure, please contact @nestadmins!");
    return;
  }

  req.username = ident.userid?.toString();
  req.admin = req.username === "root" || req.username === "nest-internal";
  req.setTimeout(0);

  if (req.query.impersonateUser && !req.admin) {
    res
      .status(403)
      .send("To impersonate another user, you'll need to use sudo or be root.");
  } else if (req.query.impersonateUser) {
    req.username = req.query.impersonateUser.toString();
    req.admin = req.username === "root" || req.username === "nest-internal";
    next();
  } else {
    next();
  }
});

app.get("/list", async (req, res) => {
  const domains = await prisma.domain.findMany({
    where: {
      username: req.username,
    },
  });

  const text = domains
    .map((domain) => `- ${domain.domain} (${domain.proxy})`)
    .join("\n");

  res.status(200).send(text);
});

app.get("/list/json", async (req, res) => {
  res.json(
    await prisma.domain.findMany({
      where: {
        username: req.username,
      },
    }),
  );
});

app.post("/domain/new", async (req, res) => {
  let user = req.username;
  req.admin = req.username === "root" || req.username === "nest-internal";
  if (!(validator.isFQDN(req.body.domain) || /^([a-z0-9-]+\.)*dn42$/i.test(req.body.domain))) {
    return res
      .status(400)
      .send(
        "This domain is not a valid domain name. Please choose a valid domain name.",
      );
  }

  if (await domainExists(req.body.domain)) {
    return res
      .status(409)
      .send(
        "This domain already has already been taken by you or someone else. Pick another one!",
      );
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
    return res
      .status(200)
      .send(
        `${req.body.domain} added. (${req.body.proxy || `unix//home/${user}/.${req.body.domain}.webserver.sock`})`,
      );
  }

  const domains = await prisma.domain.findMany({
    where: {
      username: req.username,
    },
  });

  const isAlreadyVerified = domains.some(domainObj => req.body.domain.endsWith("."+domainObj.domain));
  
  // Proceed as a regular domain
  if (!(await checkVerification(req.body.domain, user)) && !req.admin && !isAlreadyVerified) {
    return res.status(401).send(
      stripIndent`
        The domain \`${req.body.domain}\` is not verified.

        There are two ways to verify your domain:

        - Add a TXT record to your domain (${req.body.domain}) to "domain-verification=${user}". You can remove it after it is added.
        - Set the CNAME record on your domain (${req.body.domain}) to \`${user}.hackclub.app\`.
        
        If you have already done this, please wait a few minutes for DNS records to propagate.`,
    );
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
  if (!isAlreadyVerified) {
    return res
      .status(200)
      .send(stripIndent`
        Make sure to set the CNAME record on your domain (${req.body.domain}) to \`${user}.hackclub.app\`.
        ${req.body.domain} added. (${req.body.proxy || `unix//home/${user}/.${req.body.domain}.webserver.sock`})`,
      );
  } else {
    return res
      .status(200)
      .send(
        `${req.body.domain} added. (${req.body.proxy || `unix//home/${user}/.${req.body.domain}.webserver.sock`})`,
      );
  }
});

app.post("/domain/delete", async (req, res) => {
  let user = req.username;

  if (!(validator.isFQDN(req.body.domain) || /^([a-z0-9-]+\.)*dn42$/i.test(req.body.domain))) {
    return res
      .status(400)
      .send(
        "This domain is not a valid domain name. Please choose a valid domain name.",
      );
  }

  if (!(await domainExists(req.body.domain))) {
    return res.status(404).send("This domain is not in Caddy.");
  }

  if (!(await domainOwnership(req.body.domain, user))) {
    return res
      .status(401)
      .send("You do not own the domain, so you cannot remove it.");
  }
  await prisma.domain.delete({
    where: {
      domain: req.body.domain,
      username: user,
    },
  });
  await reloadCaddy();

  return res.status(200).send(`${req.body.domain} removed.`);
});

app.post("/reload", async (req, res) => {
  if (!req.admin) {
    return res
      .status(403)
      .send("To reload the global caddy instance, you must use sudo.");
  }

  await reloadCaddy();

  return res.status(200).send(`Global Caddy instance reloaded.`);
});

// listen on a privileged port >:)
app.listen(999, "localhost", () => {
  console.log(`Cabinet is listening on ${process.env.PORT}`);
});
