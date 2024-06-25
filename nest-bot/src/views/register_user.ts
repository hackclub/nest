import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import reserved_usernames from "../reserved_usernames.json" with { type: "json" };
import unapproved_home from "../blocks/unapproved_home.js";
import approval_message from "../blocks/approval_message.js";

export function register_user(app: Slack.App) {
  app.view("register_user", async ({ ack, body, view, client }) => {
    // Get form values (jank)
    const { username, name, email, ssh_key, description } = Object.fromEntries(
      Object.entries(body.view.state.values).map(([key, value]) => [
        key,
        value[`${key}_input`].value,
      ])
    );

    // Slack enforces required fields to be present
    if (!username || !name || !email || !ssh_key || !description) {
      return;
    }

    // Username validations
    if (username.toLowerCase() !== username) {
      ack({
        errors: {
          username: "Username must be lowercase",
        },
        response_action: "errors",
      });
      return;
    }

    // DNS label validation
    if (!username.match(/^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/)) {
      ack({
        errors: {
          username: "Invalid username - must be a valid DNS label",
        },
        response_action: "errors",
      });
      return;
    }

    const takenUsers = await prisma.users.findFirst({
      where: {
        tilde_username: username,
      },
      select: {
        id: true,
      },
    });

    if (takenUsers != null || reserved_usernames.includes(username)) {
      ack({
        errors: {
          username: "Username already taken",
        },
        response_action: "errors",
      });
      return;
    }

    // Email validation
    if (!email.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/)) {
      ack({
        errors: {
          email: "Invalid email",
        },
        response_action: "errors",
      });
      return;
    }

    // SSH key validation
    if (
      !ssh_key.match(
        /ssh-(ed25519|rsa|dss|ecdsa) AAAA(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{4})( [^@]+@[^@]+)?/
      )
    ) {
      ack({
        errors: {
          ssh_key: "Invalid SSH key",
        },
        response_action: "errors",
      });
      return;
    }

    ack();

    await prisma.users.create({
      data: {
        slack_user_id: body.user.id,
        name,
        email,
        ssh_public_key: ssh_key,
        description,
        tilde_username: username,
      },
    });

    await client.chat.postMessage({
      channel: "C05VBD1B7V4", // private #nest-registration channel id
      blocks: approval_message(
        body.user.id,
        name,
        username,
        email,
        ssh_key,
        description
      ),
      text: `<@${body.user.id}> is requesting an approval for Nest`,
    });

    await client.views.publish({
      user_id: body.user.id,
      view: unapproved_home(name, username, email, ssh_key),
    });

    await client.chat.postMessage({
      channel: body.user.id,
      text: "Keep an eye out in your DMs -  you'll recieve a notification within 24 hours about your approval status!",
    });

    console.log(`User ${body.user.id} registered with username ${username}`);
  });
}
