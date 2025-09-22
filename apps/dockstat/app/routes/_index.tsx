import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "~/components/ui/Card"

export default function Index(){
  return (
    <div>
      <div className="flex p-2">
        <Card>
          <CardHeader>
            Test Header
          </CardHeader>
          <CardBody>
          Test Body
          </CardBody>
            <CardFooter>
              Test Footer
            </CardFooter>
        </Card>
      </div>
      <div className="flex p-2">
        <Button variant="primary" size="sm">
          Primary sm
        </Button>
    </div>
    <div className="flex p-2">
        <Button variant="secondary" size="md">
          Secondary md
        </Button>
    </div>
    <div className="flex p-2">
        <Button variant="destructive" size="lg">
          Destructive lg
        </Button>
    </div>
    <div className="flex p-2">
        <Button variant="ghost">
          Ghost
        </Button>
    </div>
    <div className="space-x-4 space-y-4">
      <Badge variant="neutral" size="sm">
        Neutral SM
      </Badge>
      <Badge variant="success" size="md">
        Success MD
      </Badge>
      <Badge variant="warning">
        Warning
      </Badge>
      <Badge variant="danger">
        Danger
      </Badge>
    </div>
  </div>
  )
}
