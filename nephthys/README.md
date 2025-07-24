# Nephthys

Nephthys is the bot powering #summer-of-making-help and #identity-help in the Hack Club Slack! Below is a guide to set her up for developing and here's a list of some of her features :)

## Features

### Tags (OUT OF ORDER)

You can tag tickets in the private tickets channel or with the macro ?tag <tag_name>. This will DM the people who are specialised in responding to those issues and have it show up in their assigned tickets.
You can assign yourself to get notified for specific tags on the app home

### Macros

Sometimes it’s nice to be able to do things quickly... Here’s where macros come in! Send one of the following messages in an open thread and something will happen

* `?resolve` - the ticket gets closed. Equivalent of hitting i get it now
* `?identity` - redirect to #identity-help 
* `?faq` - redirect to the FAQ
* `?hii` - silly message :3
* more to come?? feel free to PR your own into hackclub/nephthys or tell me what you want

### Stale

Tickets that have been not had a response for more than 3 days will automatically be closed as stale. The last helper to respond in the thread gets credit for closing them

### Leaderboard

At midnight UK time each day, you get to see the stats for the day in the team channel! Helpers can also see more detailed stats at any time on the app home for the bot! 

### Assigned Tickets

When you send a message in a help thread, that thread is assigned to you and it is up to you to resolve it. You can see a list of threads waiting for you on the app home - just select the Assigned Tickets tab at the top


## Prerequisites

- Python (3.13 or later)
- uv
- A Slack workspace where you have permissions to install apps
- Tunneling tool (for local development)

## Setting up the Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click "Create New App".
2. Choose "From an app manifest" and select your workspace.
3. Copy and paste the manifest in `manifest.yml`, replacing `YOUR_URL` with your URL (we'll set this up later):
4. Review and create the app.
5. In the "Basic Information" section, note down the `App Id`, `Client Id`, `Client Secret`, `Signing Secret` .
6. Go to "OAuth & Permissions" and install the app to your workspace. Note down the "Bot User OAuth Token".

## Setting up the Project

1. Clone the repository:

   ```
   git clone https://github.com/hackclub/nephthys
   cd nephthys
   ```

2. Install dependencies:

   ```
   uv sync
   source .venv/bin/activate # for bash/zsh
   source .venv/bin/activate.fish # for fish
   source .venv/bin/activate.csh # for csh
   source .venv/bin/activate.ps1 # for powershell
   ```

3. Copy the `.env.sample` file to `.env`:

   ```
   cp .env.sample .env
   ```

4. Edit the `.env` file and fill in the values:


## Running the Application

1. Start your tunneling tool and expose the local server. (Not needed in socket mode with `SLACK_APP_TOKEN` set)

   Note the HTTPS URL you get.

2. Update your Slack app's request URLs:

   - Go to your Slack app's settings.
   - In "Event Subscriptions" and "Interactivity & Shortcuts", update the request URL to your HTTPS URL followed by `/slack/events`.
   - In "OAuth & Permissions", update `Redirect URLs` to your HTTPS URL followed by `/slack/oauth_redirect`.
3. MAKE SURE YOU CHANGE THE COMMAND - DO NOT USE THE SAME COMMAND
4. Install pre-commit hooks:

   ```
   uv run pre-commit install
   ```
5. Start your database and update the database schema:

   ```
   uv run prisma db push
   uv run prisma generate
   ```
6. Start the application:
   ```
   nephthys
   ```

Your Slack app should now be running and connected to your Slack workspace!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
