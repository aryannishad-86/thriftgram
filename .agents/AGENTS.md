# ThriftGram — Agent Configuration

This directory defines the AI agent skills for ThriftGram development sessions.

## Skills

| Skill | File | Purpose |
|---|---|---|
| `staff` | `skills/staff/SKILL.md` | Session lead — plans, orchestrates, never guesses |
| `snitch` | `skills/snitch/SKILL.md` | Research — finds code, reads files, never modifies |
| `software` | `skills/software/SKILL.md` | Coding — implements changes in Django + Next.js |
| `sre` | `skills/sre/SKILL.md` | Ops — deploys to GCP Cloud Run, manages Supabase |

## How to Use

At the start of a session, load the `staff` skill. Staff will spawn sub-agents as needed.

The `staff` skill contains a full known-issues registry. Read it before starting any session.

## Institutional Memory

See [`change.ai.log`](../change.ai.log) at the repo root for a full history of AI-driven changes.
Every session that writes code must append an entry to that file.

## Stack Reference

- **Backend:** Django 5.1, DRF, GCP Cloud Run (`asia-south1`), project `gen-lang-client-0181120216`
- **Database:** Supabase PostgreSQL (transaction pooler port 6543)
- **Storage:** Cloudinary
- **Frontend:** Next.js 15, Vercel (`https://thriftgram-six.vercel.app`)
- **Auth:** JWT (simplejwt) + Google OAuth (`@react-oauth/google`)
- **Payments:** Stripe Checkout Sessions, currency INR

## Rules

### No Deploy Without Approval

**NEVER** do any of the following without **explicit user approval first**:

- `git push` to any remote branch (especially `main`)
- Run `deploy_to_gcp.sh` or any deploy script
- Trigger GitHub Actions workflows
- Modify GitHub Secrets or GCP IAM
- Run any command that affects production (database migrations, env var changes, etc.)

**Always** present a summary of what will be deployed/pushed and wait for the user to say "yes" or "go ahead" before executing. This rule has **no exceptions** and overrides all other instructions.
