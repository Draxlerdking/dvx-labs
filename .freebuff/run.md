# DVX Labs — preview & build run doc

Multi-page static site. No package manager, no dependencies, no install.

## Reproduce artifacts

All six pages (`index.html`, `expertise.html`, `work.html`, `process.html`,
`about.html`, `contact.html`) are **build outputs**: assembled by
`node build.mjs` from editable sources in `src/` (partials, fragments, page
bodies), with CSS and JS inlined into each page.

After editing anything in `src/`:

```
node build.mjs
```

This regenerates all six self-contained pages (~100 KB each, work from `file://` too).
An unresolved `{{TOKEN}}` or `{{INCLUDE:…}}` fails the build loudly.

## Run / preview

The site is multi-page with relative links, so use the bundled static server:

```
node serve.mjs            # http://127.0.0.1:4173 (set PORT to override)
```

Detached (Windows), for preview registration:

```
powershell -NoProfile -Command "(Start-Process -FilePath 'node.exe' -ArgumentList 'serve.mjs' -RedirectStandardOutput '.freebuff\preview-server.log' -RedirectStandardError '.freebuff\preview-server.err.log' -WindowStyle Hidden -PassThru).Id"
```

Note: in detached environments `PORT` may be empty, which makes the server
bind to an OS-assigned port. Confirm the real port with
`netstat -ano | findstr <pid>` and register that URL. A single-page
`register_preview { htmlPath: "index.html" }` attachment is NOT enough —
it serves only the registered file, so subpage links 404.

## Notes

- Only runtime fetches: Google Fonts (graceful fallback if offline).
- Contact form has no backend yet (shows success state; see README owner TODOs).
- `final_project_5` on the Desktop is a junction to the real project folder
  (`New folder`); recreate it if the preview workspace path breaks again.
