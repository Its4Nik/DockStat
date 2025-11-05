import type { RepoType } from "@dockstat/typings/types";
import { Card, CardBody, CardHeader } from "../Card/Card";
import { Badge } from "../Badge/Badge";
import { LockOpen, Lock, Github, Gitlab, Coffee, Link, Folder, Check, X } from "lucide-react";
import { HoverBubble } from "../HoverBubble/HoverBubble";
import { Divider } from "../Divider/Divider";



function getRepoIcon(repoType: RepoType["type"]) {
  switch (repoType) {
    case "github":
      return <Github />;
    case "gitlab":
      return <Gitlab />;
    case "gitea":
      return <Coffee />;
    case "http":
      return <Link />;
    case "local":
      return <Folder />;
  }
}

export function Repo({ repo }: { repo: RepoType }) {




  return (
    <Card hoverable variant="outlined" className="w-full" size="md">
      <CardHeader className="">
        <div className="justify-between flex">
          <p>
            <Card className="w-fit h-fit text-md" onClick={() => window.open(repo.source)} size="sm">
              {repo.name}
            </Card>
          </p>

          <div className="flex flex-row space-x-2 my-auto">
            <Badge variant={repo.policy === "relaxed" ? "error" : "success"}>{repo.policy === "relaxed" ? (
              <HoverBubble label="Relaxed Repository Setting! This is not adviced" position="bottom">
                <LockOpen />
              </HoverBubble>
            ) : (
              <HoverBubble label={`This Repository will veryfiy all downloadable content.

                The Endpoint is this:
                ${repo.verification_api}`} position="bottom">
                <Lock />
              </HoverBubble>

            )}</Badge>

            {repo.policy === "strict" ? (
              <>

                <Badge variant={repo.isVerified ? "success" : "error"}>{repo.isVerified ? (
                  <HoverBubble position="bottom" label="Repository is verified.

             This Repository is verified and trusted by the Auth-API">
                    <Check />
                  </HoverBubble>) : (
                  <HoverBubble position="bottom" label="This Repository is not verified!

                    You can still download from here, but there will be a warning everytime!">
                    <X />
                  </HoverBubble>
                )}
                </Badge>
              </>
            ) : null}
            <Divider shadow={false} orientation="vertical" className="ml-4 py-4" variant="solid" />
            <Badge className="mx-4">{getRepoIcon(repo.type)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody>
      </CardBody>
    </Card>
  )
}
