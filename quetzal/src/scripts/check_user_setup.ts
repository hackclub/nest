import { prisma } from "../util/prisma.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface SetupStatus {
  username: string;
  slackUserId: string;
  name: string;
  email: string;
  isApproved: boolean;
  authentikPk: number | null;
  checks: {
    homeDir: boolean;
    caddyConfig: boolean;
    sshKeys: boolean;
    postgresUser: boolean;
    postgresDb: boolean;
    quota: boolean;
  };
}

async function checkUserSetup(username: string): Promise<SetupStatus["checks"]> {
  const checks = {
    homeDir: false,
    caddyConfig: false,
    sshKeys: false,
    postgresUser: false,
    postgresDb: false,
    quota: false,
  };

  try {
    await execAsync(`test -d /home/${username}`);
    checks.homeDir = true;
  } catch (e) {
    console.error(`Home directory check failed for ${username}:`, e);
  }

  try {
    await execAsync(`test -f /home/${username}/Caddyfile`);
    checks.caddyConfig = true;
  } catch (e) {
    console.error(`Caddy config check failed for ${username}:`, e);
  }

  try {
    await execAsync(`test -f /home/${username}/.ssh/authorized_keys`);
    checks.sshKeys = true;
  } catch (e) {
    console.error(`SSH keys check failed for ${username}:`, e);
  }

  try {
    const { stdout: pgUser } = await execAsync(`sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${username}'"`);
    checks.postgresUser = pgUser.trim() === "1";
  } catch (e) {
    console.error(`PostgreSQL user check failed for ${username}:`, e);
  }

  try {
    const { stdout: pgDb } = await execAsync(`sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${username}'"`);
    checks.postgresDb = pgDb.trim() === "1";
  } catch (e) {
    console.error(`PostgreSQL database check failed for ${username}:`, e);
  }

  try {
    const { stdout: quota } = await execAsync(`quota -u ${username}`);
    checks.quota = quota.trim().length > 0;
  } catch (e) {
    console.error(`Quota check failed for ${username}:`, e);
  }

  return checks;
}

async function main() {
  const users = await prisma.users.findMany({
    where: {
      is_approved: true,
    },
    select: {
      slack_user_id: true,
      tilde_username: true,
      name: true,
      email: true,
      pk: true,
    },
  });

  console.log(`Found ${users.length} approved users. Checking setup status...\n`);

  const results: SetupStatus[] = [];

  for (const user of users) {
    if (!user.tilde_username) continue;

    const checks = await checkUserSetup(user.tilde_username);
    
    results.push({
      username: user.tilde_username,
      slackUserId: user.slack_user_id,
      name: user.name,
      email: user.email,
      isApproved: true,
      authentikPk: user.pk,
      checks,
    });
  }
  
  console.log("Setup Status Report:");
  console.log("===================");
  console.log("\nUsers with failed checks:");
  console.log("------------------------");
  
  const failedUsers = results.filter(user => 
    Object.values(user.checks).some(check => !check)
  );

  if (failedUsers.length === 0) {
    console.log("No users with failed checks found!");
    return;
  }

  for (const user of failedUsers) {
    console.log(`\nUser: ${user.username} (${user.name})`);
    console.log(`Slack ID: ${user.slackUserId}`);
    console.log(`Email: ${user.email}`);
    console.log("Failed checks:");
    
    Object.entries(user.checks).forEach(([check, status]) => {
      if (!status) {
        console.log(`  - ${check}`);
      }
    });
  }

  console.log("\nSummary:");
  console.log("--------");
  console.log(`Total users checked: ${results.length}`);
  console.log(`Users with failed checks: ${failedUsers.length}`);
  console.log("\nFailed checks breakdown:");
  
  const failedChecks = Object.keys(results[0].checks).reduce((acc, check) => {
    acc[check] = results.filter(user => !user.checks[check as keyof typeof user.checks]).length;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(failedChecks).forEach(([check, count]) => {
    console.log(`  ${check}: ${count} failures`);
  });
}

main().catch(console.error); 