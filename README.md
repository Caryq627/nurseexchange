# The Nurse Exchange

Cryptiq-secured GAPP pediatric home-care nurse marketplace. Static SPA — no build step, drag-and-drop deploy.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on Render

1. Push this folder to a new GitHub repo.
2. In Render, **New → Static Site**.
3. Connect the repo.
4. Settings:
   - **Build Command:** *(blank)*
   - **Publish Directory:** `.`
5. Deploy.

`render.yaml` is included so headers, rewrites, and PR previews are picked up automatically.

## Deploy on Netlify (drag-drop)

Drop the folder on the Netlify dashboard. `netlify.toml` handles headers and rewrites.

## Roles

- **Super Admin** — Platform oversight, agency approvals, data purge.
- **Agency Admin** — Manage nurses, cases, partners, team, billing.
- **Recruiter / Scheduler** — Pool, cases, meets, messages. *No agency or admin edits.*
- **Nurse** — Opportunities, schedule, credentials, availability, messages.
- **Parent / Guardian** — Shortlisted nurses, meet & greets, feedback, messages.

Reset: switch persona modal → **Reset demo data**, or super-admin **Purge data**.
