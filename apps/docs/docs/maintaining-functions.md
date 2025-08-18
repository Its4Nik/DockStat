# Creating dependency graphs

```bash
#!/bin/bash
cd src || exit 1
TMP=$(mktemp)

cat ./server.ts | grep "./routes" | awk '{print $2,$4}' > $TMP

spawn_worker(){
    local line="$1"
    local target_route="$(echo "$line" | cut -d '"' -f2).ts"
    local route=$(echo "$line" | awk '{print $1}')

    echo
    echo "Route: $route"
    echo ${target_route}

    sleep 0.5

    npx depcruise \
        -p cli-feedback \
        -T mermaid \
        -x "../node_modules|logger|.dependency-cruiser|path|fs" \
        -f ./misc/dependencyGraphs/mermaid-${route}.txt \
        ${target_route} || exit 1
}

while read line; do
    spawn_worker "$line" &
done < <(cat $TMP)

npx depcruise \
    -p cli-feedback \
    -T mermaid \
    -x "../node_modules|logger|.dependency-cruiser|path|fs" \
    -f ./misc/dependencyGraphs/mermaid-all.txt \
    ./server.ts || exit 1

wait

sleep 0.5

echo -e "\n========\n\n  DONE\n\n========"

exit 0
```

The script initializes a temp file (`$TMP`), where we dump all available routes which are initialized in the main server.js file.

Then we loop through that temp file and execute the depcruiser npm package via npx and save the output to `/misc/dependencyGraphs/${FILE}.txt`.

Since the *mermaid diagram renderer* is a bit outdated here in Outline we are going to use the [mermaid.live](https://mermaid.live) preview and embed it that way.


---

# Removing unused dependencies

```bash
#!/bin/bash

TMP="$(npx depcheck --ignores dependency-cruiser,tsx,@types/bcrypt,@types/express,@types/express-handlebars,@types/node,ts-node --quiet --oneline | tail -n 1 | tr -d '\n')"

lines=$(echo "$TMP" | tr -s ' ' '\n' | wc -l)

if ((lines == 0)); then
    echo "No unused dependencies."
else
    echo
    echo "Removing these unused dependencies:"
    for entry in $TMP; do
        echo "$entry"
    done
    echo
fi


read -n 1 -p "Delete unused dependencies? (y/n) " input
echo

case $input in
    Y|y)
        COMMAND=$(echo "npm remove $TMP")
        $COMMAND
        exit 0
        ;;
    *)
        echo "Aborting"
        exit 1
        ;;
esac

exit 2
```


---

# Automated testing – In VS Code

When opening the Project in VS Code you can see the testing tab in  the sidebar (typically on the left).

When opening said "Testing"  tab  you can see all 2 currently available tests:                ![Test tab](/api/attachments.redirect?id=4fb23db8-1789-4749-a400-fd033bc42ead)

The test take about 2 minutes since we have a timeout of 2 seconds in between request due to making sure that the previous section is done.

 ![Output of a running test](/api/attachments.redirect?id=ae630b90-2fad-42f5-90e6-ec55d5b32418)


---

# Minifying compiled JavaScript

This executes when running `npm run mini`.

```bash
#!/bin/bash

dist="$(pwd)/dist"

run_script() {
  echo -ne "\r⏳ Minifying : $(basename "$1")"
  npx uglifyjs --no-annotations --in-situ "$1" > /dev/null
  echo -ne "\r✔️  Minified  : $(basename "$1")\n"
}

if [ -d "$dist" ]; then
  echo "::: Dist directory exists."
else
  echo "::: Dist does not exist... Running npx tsc"
  npx tsc
fi

export -f run_script

find "$dist" -type f -exec bash -c 'run_script "$0"' {} \;

echo

if [[ $1 == "--build-only" ]]; then
    exit 0
fi

node dist/server.js
```

The goal of the script is to minify and compress the compiled JavaScript as much as possible.\nThat's why `find` traverses all directories and files inside `./dist` and runs `uglifyjs` on all found files.

## Example Data

```bash
"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:true});const express_1=__importDefault(require("express"));const swaggerDocs_1=__importDefault(require("./swagger/swaggerDocs"));const logger_1=__importDefault(require("./utils/logger"));const routes_1=__importDefault(require("./routes/auth/routes"));const routes_2=__importDefault(require("./routes/data/routes"));const routes_3=__importDefault(require("./routes/frontendController/routes"));const routes_4=__importDefault(require("./routes/getter/routes"));const routes_5=__importDefault(require("./routes/notifications/routes"));const routes_6=__importDefault(require("./routes/setter/routes"));const authMiddleware_1=__importDefault(require("./middleware/authMiddleware"));const routes_7=__importDefault(require("./routes/highavailability/routes"));const proxy_1=__importDefault(require("./controllers/proxy"));const rateLimiter_1=require("./middleware/rateLimiter");const scheduler_1=require("./controllers/scheduler");const highAvailability_1=require("./controllers/highAvailability");const cors_1=__importDefault(require("cors"));const app=(0,express_1.default)();const PORT=9876;app.use((0,cors_1.default)());app.use(express_1.default.json());app.use("/api-docs",(req,res,next)=>next());(0,swaggerDocs_1.default)(app);(0,proxy_1.default)(app);(0,scheduler_1.scheduleFetch)();app.use("/api",rateLimiter_1.limiter,authMiddleware_1.default,routes_4.default);app.use("/conf",rateLimiter_1.limiter,authMiddleware_1.default,routes_6.default);app.use("/auth",rateLimiter_1.limiter,authMiddleware_1.default,routes_1.default);app.use("/data",rateLimiter_1.limiter,authMiddleware_1.default,routes_2.default);app.use("/frontend",rateLimiter_1.limiter,authMiddleware_1.default,routes_3.default);app.use("/notification-service",rateLimiter_1.limiter,authMiddleware_1.default,routes_5.default);app.use("/ha",rateLimiter_1.limiter,authMiddleware_1.default,routes_7.default);app.get("/",(req,res)=>{res.redirect("/api-docs")});app.listen(PORT,()=>{logger_1.default.info(`Server is running on http://localhost:${PORT}`);logger_1.default.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);(0,highAvailability_1.startMasterNode)()});
```

This brings down the image size even more so that updates and installs are faster on a slower internet connection :sunglasses:


---

# credits.sh

Since I don't want any legal actions against me, I am going to credit every dependency I am using (which requires it according to the license), that's why this script exists:

```bash
#!/bin/bash

if ! command -v jq 2>&1 >/dev/null
then
    echo "ERROR: jq could not be found"
    exit 1
fi


LICENSE_JSON=$(npx license-checker \
  --exclude 'MIT, MIT-0, MIT OR X11, BSD, ISC, Unlicense, CC0-1.0, Python-2.0: 1' \
  --json)

{
    echo -e "# CREDITS\n"
    echo -e "This file shows all npm packages used in DockStatAPI (also Dev packages)\n"
} > CREDITS.md

jq -r '
  to_entries |
  group_by(.value.licenses)[] |
  "### License: \(.[0].value.licenses)\n\n" +
  "| Name | Repository | Publisher |\n|------|-------------|-----------|\n" +
  (map(
    "| \(.key) | \(.value.repository // "N/A") | \(.value.publisher // "N/A") |"
  ) | join("\n")) + "\n\n"
' <<< "$LICENSE_JSON" >> CREDITS.md

echo "Markdown file with license information has been created: CREDITS.md"
```

This will run a dependency (*ironic isn't it?*) which will check all licenses of all dependencies and puts them inside `./CREDITS.md`


---

# Creating a local environment file

Path:  `./src/misc/createEnvDev.sh`

```bash
#!/bin/bash

# Version
VERSION="$(cat ./package.json | grep version | cut -d '"' -f 4)"

# Docker
if grep -q '/docker' /proc/1/cgroup 2>/dev/null || [ -f /.dockerenv ]; then
    RUNNING_IN_DOCKER="true"
else
    RUNNING_IN_DOCKER="false"
fi

echo -n "\
{
    \"VERSION\": \"${VERSION}\",
    \"RUNNING_IN_DOCKER\": \"${RUNNING_IN_DOCKER}\",
    \"TRUSTED_PROXYS\": \"${TRUSTED_PROXYS}\",
    \"HA_MASTER\": \"${HA_MASTER}\",
    \"HA_MASTER_IP\": \"${HA_MASTER_IP}\",
    \"HA_NODE\": \"${HA_NODE}\",
    \"HA_UNSAFE\": \"${HA_UNSAFE}\",
    \"DISCORD_WEBHOOK_URL\": \"${DISCORD_WEBHOOK_URL}\",
    \"EMAIL_SENDER\": \"${EMAIL_SENDER}\",
    \"EMAIL_RECIPIENT\": \"${EMAIL_RECIPIENT}\",
    \"EMAIL_PASSWORD\": \"${EMAIL_PASSWORD}\",
    \"EMAIL_SERVICE\": \"${EMAIL_SERVICE}\",
    \"PUSHBULLET_ACCESS_TOKEN\": \"${PUSHBULLET_ACCESS_TOKEN}\",
    \"PUSHOVER_USER_KEY\": \"${PUSHOVER_USER_KEY}\",
    \"PUSHOVER_API_TOKEN\": \"${PUSHOVER_API_TOKEN}\",
    \"SLACK_WEBHOOK_URL\": \"${SLACK_WEBHOOK_URL}\",
    \"TELEGRAM_BOT_TOKEN\": \"${TELEGRAM_BOT_TOKEN}\",
    \"TELEGRAM_CHAT_ID\": \"${TELEGRAM_CHAT_ID}\",
    \"WHATSAPP_API_URL\": \"${WHATSAPP_API_URL}\",
    \"WHATSAPP_RECIPIENT\": \"${WHATSAPP_RECIPIENT}\"
} \
" > ./src/data/variables.json
```

This file will create a JSON file (`./src/data/variables.json`) which the backend will read (based on user configuration).

For the keen eyed: There is also a `createEnvFile.sh`, this does the same (just an adjusted path) for use inside the docker image.


---

# npm run functions:

## npm run docker:full

### Code

```bash
docker compose up -d && \
[ -z \"$TMUX\" ] && \
tmux new-session -d -s docker 'docker compose logs -f master' \\; \
split-window -v 'docker compose logs -f slave' \\; \
attach-session || echo 'Already inside a tmux session. Exiting.'; \
docker compose down
```

### Explanation


1. `docker compose up -d`: starts the docker-compose.yaml
2. `[ -z \"$TMUX\" ]`: tests if $TMUX is set
3. `tmux new-session -d -s docker 'docker compose logs -f master'`: Creates a TMUX session, named docker, with the default window of: `docker compose logs -f master`
4. `split-window -v 'docker compose logs -f slave'`: splits the TMUX window
5. `attach-session`: Attach to the new TMUX session
6. `|| echo 'Already inside a tmux session. Exiting.'`: aborts if attaching to session fails
7. `docker compose down`: Runs after the tmux session is closed, will shut down the docker compose stack


---

## npm run docker:build

### Code

```bash
docker build . -t \"dockstatapi:local\" -f ./Dockerfile-dev && \
docker compose up -d
```

### Explanation

Builds the local docker image using the Dockerfile-dev and starts the docker compose stack


:::info
Differences between Dockerfile and Dockerfile-dev:

Line 27:

* Dockerfile:

  `RUN npm run build:mini`
* Dockerfile-dev:

  `RUN npm run build`

The difference is that `npm run build:mini` will remove swagger documentation since it is based on comments.

:::


---

## npm run docker:build:full

### Code

```bash
npm run docker:build &&
[ -z \"$TMUX\" ] &&
tmux new-session -d -s docker 'docker compose up -d &&
docker compose logs -f master' \\;
split-window -v 'docker compose logs -f slave' \\;
attach-session || echo 'Already inside a tmux session. Exiting.'; 
docker compose down"
```

### Explanation


1. Runs the default docker:build run command
2. Checks if TMUX is already active
3. Creates a new tmux session and starts the docker-compose file (detached)
4. Follows the logs of the master container
5. Splits TMUX window and follows the logs of the slave container
6. Attaches to the session (fails if already inside a session)
7. Stops the entire docker compose stack


---

## npm run prettier

### Code

```bash
npx prettier -c ./src/**/*.ts --parser typescript --write && \
npx prettier -c ./.github/workflows/*.{yaml,yml} --parser yaml --write && \
npx prettier -c ./**/*.md --parser markdown --write && \
npx prettier -c ./**/*.json --parser json --write
```

### Explanation


1. "prettifies" all typescript files
2. "prettifies" all GitHub workflows
3. "prettifies" all markdown files
4. "prettifies" all JSON files