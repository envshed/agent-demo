# agent-demo

A tiny app with three fake secrets, to try [Envshed](https://envshed.com) with an AI coding agent in about five minutes.

Like many real apps, it prints its configuration when it starts. That is how secret values usually end up in an agent's chat history. With Envshed, the agent runs the app, asks you for the key that is missing, and the output shows `[ENVSHED:KEY_NAME]` instead of each value.

Every value in this repository is fake. Use a test organization, not your company's.

## What you need

- Node.js 20.6 or later
- An Envshed account: the first sign-in creates it at [app.envshed.com](https://app.envshed.com/login)
- [Claude Code](https://docs.claude.com/en/docs/claude-code). Cursor works too, see [Cursor](#cursor).

## 1. Set up the CLI and the agent (once per machine)

In your own terminal:

```bash
npm install -g envshed
envshed login
envshed agent install
claude mcp add --transport http envshed https://app.envshed.com/api/mcp
claude mcp login envshed
```

`envshed login` and `claude mcp login envshed` each open the browser for you to approve. `envshed agent install` adds hooks that stop Claude Code from reading `.env` files or printing secrets. The [Start with AI guide](https://docs.envshed.com/agents/get-started) explains each step.

## 2. Create the project and import the fake values

```bash
git clone https://github.com/envshed/agent-demo
cd agent-demo
envshed orgs
envshed project create --name agent-demo -o <org>
envshed init -o <org> -p agent-demo -e development --yes --no-guide --no-import
envshed import demo.env -e development
```

Replace `<org>` with the slug that `envshed orgs` prints. The import sends `DATABASE_URL` and `PAYMENTS_API_KEY` to Envshed and prints key names only. It warns that `demo.env` is tracked by git and tells you to rotate those secrets: in a real project you would, here the values are fake.

`EMAIL_API_KEY` is left out on purpose. The agent will ask you for it. The import also suggests deleting `demo.env`: keep it until step 5.

## 3. Give the agent the task

Start `claude` in this folder and paste:

```text
Run this app with Envshed. Organization: <org>. Project: agent-demo. Environment: development.
1. Use the Envshed MCP server to list the key names and find any that are missing.
2. For each missing key, call request_secret, give me the link and wait until I fill it.
3. Run the app with: envshed run -- npm start
Never read .env files, never print secret values and never ask me to paste a value in the chat.
```

The agent finds that `EMAIL_API_KEY` is missing and gives you a link. Open it, type any fake value, such as `demo-email-key`, and save. Then tell the agent you filled it, so it does not wait for its next check. It runs the app, and the output looks like this:

```text
Starting agent-demo with config:
  DATABASE_URL=[ENVSHED:DATABASE_URL]
  PAYMENTS_API_KEY=[ENVSHED:PAYMENTS_API_KEY]
  EMAIL_API_KEY=[ENVSHED:EMAIL_API_KEY]

agent-demo is ready.
```

## 4. Check the agent's history

```bash
envshed scan
```

`scan` looks for your Envshed values in Claude Code's local history. It prints `Nothing found`: none of your values is in the agent's history.

## 5. Compare with a .env file (optional, 1 minute)

Whatever a command prints is what the agent reads. Run the app both ways and save the output:

```bash
cp demo.env .env
npm run start:dotenv > without-envshed.log 2>&1
envshed run --redact -- npm start > with-envshed.log 2>&1
```

`npm run start:dotenv` exits with code 1, because `demo.env` has no `EMAIL_API_KEY`. That is expected: it has already printed the other values.

Then look for your values in each file:

```bash
envshed scan --path without-envshed.log --no-mark
envshed scan --path with-envshed.log --no-mark
```

The first scan lists `DATABASE_URL` and `PAYMENTS_API_KEY` and exits with code `2`: with a `.env` file, the values are in the output, so an agent that runs the app has them in its history. The second prints `Nothing found`. Some agents hide values on their own, depending on the model and the session. Masking does not depend on that.

`--no-mark` keeps this check local. Without it, `scan` also marks what it finds as **Exposed** in the dashboard. Delete `.env` and the two log files when you are done.

## Cursor

Add the server to `.cursor/mcp.json` in this folder:

```json
{
  "mcpServers": {
    "envshed": { "url": "https://app.envshed.com/api/mcp" }
  }
}
```

Then sign in with `cursor-agent mcp login envshed`. Cursor has no Envshed hooks, and `envshed run` does not mask output on its own there, so in step 3 write `envshed run --redact -- npm start`. `envshed scan` reads Claude Code's history only.

## What this shows, and what it does not

The MCP server never returns or accepts a secret value, and a requested value goes into Envshed, not into the chat. Masking replaces known values in the output of `envshed run`.

It reduces accidental leaks. It is not a barrier against an agent with shell access, which can still reach what your login can. See [what Envshed guarantees](https://docs.envshed.com/agents/get-started#limits).

## License

MIT
