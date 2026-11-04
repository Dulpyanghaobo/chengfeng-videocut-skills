#!/bin/zsh -l
cd "${0:A:h}"
if curl -fsS http://127.0.0.1:3211/api/catalog >/dev/null 2>&1; then
  open http://127.0.0.1:3211
else
  (sleep 2; open http://127.0.0.1:3211) &
  node bin/auto-video.mjs catalog
fi
